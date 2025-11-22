import { apiPost, API_URL } from './api';
import { supabase } from './supabase';
import { getStorage } from '../storage';
import { toDbProduct, toDbClient, toDbTx, toDbSale } from '../storage/mappers';

type PullResponse = {
	changes: Record<string, any[]>;
	serverTime: string;
};

function isUuid(id: string | undefined) {
	if (!id) return false;
	return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

// Função para gerar UUID v4 válido (compatível com todos os ambientes)
function generateUuid(): string {
	// Tentar usar crypto.randomUUID() se disponível
	if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
		return (crypto as any).randomUUID();
	}
	
	// Fallback: gerar UUID v4 manualmente
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		const r = Math.random() * 16 | 0;
		const v = c === 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});
}

export async function pullChanges() {
	if (!API_URL) return;
	const { data: { session } } = await supabase.auth.getSession();
	
	// 🆕 SOLUÇÃO 3: OBTER establishment_id DO USUÁRIO ANTES DE FAZER PULL
	let userEstablishmentId: string | null = null;
	if (session?.user) {
		try {
			const { data: profile, error } = await supabase
				.from('profiles')
				.select('establishment_id')
				.eq('user_id', session.user.id)
				.maybeSingle();
			
			if (error) {
				console.error('❌ Pull: Erro ao buscar establishment_id:', error);
			} else {
				userEstablishmentId = profile?.establishment_id || null;
				console.log('🔒 Pull: establishment_id do usuário:', userEstablishmentId || 'NENHUM');
			}
		} catch (error) {
			console.error('❌ Pull: Exceção ao buscar establishment_id:', error);
		}
	}
	
	const storage = await getStorage();
	
	// 🆕 SOLUÇÃO 3: LIMPAR DADOS LOCAIS QUE NÃO PERTENCEM AO ESTABLISHMENT_ID ATUAL
	if (userEstablishmentId) {
		console.log('🧹 Pull: Limpando dados locais de outros estabelecimentos...');
		try {
			// Obter todos os dados locais
			const [allProducts, allClients, allSales, allTransactions] = await Promise.all([
				storage.getProducts().catch(() => []),
				storage.getClients().catch(() => []),
				storage.getSales().catch(() => []),
				storage.getTransactions().catch(() => []),
			]);
			
			let removedCount = 0;
			
			// Remover produtos que não pertencem ao establishment atual
			for (const prod of allProducts) {
				const prodEstablishmentId = (prod as any).establishmentId;
				if (prodEstablishmentId && prodEstablishmentId !== userEstablishmentId) {
					await storage.deleteProduct(prod.id).catch(() => {});
					removedCount++;
					console.log(`🗑️ Pull: Removido produto ${prod.id} de outro estabelecimento`);
				}
			}
			
			// Remover clientes que não pertencem ao establishment atual
			for (const client of allClients) {
				const clientEstablishmentId = (client as any).establishmentId;
				if (clientEstablishmentId && clientEstablishmentId !== userEstablishmentId) {
					// Clientes não têm deleteClient, então vamos limpar todos e deixar o servidor enviar os corretos
					// Mas como não temos deleteClient, vamos apenas logar
					console.log(`⚠️ Pull: Cliente ${client.id} pertence a outro estabelecimento (será removido no clearAll)`);
				}
			}
			
			// Para sales e transactions, vamos confiar no clearAll que já foi feito antes do pull
			// Mas vamos logar para debug
			for (const sale of allSales) {
				const saleEstablishmentId = (sale as any).establishmentId;
				if (saleEstablishmentId && saleEstablishmentId !== userEstablishmentId) {
					console.log(`⚠️ Pull: Venda ${sale.id} pertence a outro estabelecimento (será removida no clearAll)`);
				}
			}
			
			for (const tx of allTransactions) {
				const txEstablishmentId = (tx as any).establishmentId;
				if (txEstablishmentId && txEstablishmentId !== userEstablishmentId) {
					console.log(`⚠️ Pull: Transação ${tx.id} pertence a outro estabelecimento (será removida no clearAll)`);
				}
			}
			
			if (removedCount > 0) {
				console.log(`✅ Pull: ${removedCount} registros removidos de outros estabelecimentos`);
			} else {
				console.log('✅ Pull: Nenhum dado de outro estabelecimento encontrado');
			}
		} catch (error) {
			console.error('❌ Pull: Erro ao limpar dados de outros estabelecimentos:', error);
			// Continuar mesmo com erro (melhor que bloquear o pull)
		}
	} else {
		console.warn('⚠️ Pull: Usuário sem establishment_id - dados locais podem conter dados de outros estabelecimentos');
	}
	
	// Pull changes from server and MERGE with local data (don't replace)
	const res = await apiPost<PullResponse>('/sync/pull', {
		tables: ['products', 'clients', 'sales', 'sale_items', 'financial_transactions', 'establishments']
	}, session?.access_token);
	
	// MERGE products: upsert server data into local (don't delete local-only items)
	if (res.changes?.products) {
		for (const serverProd of res.changes.products) {
			try {
				// Convert from snake_case to camelCase
				const localProd = {
					id: serverProd.id,
					name: serverProd.name,
					price: serverProd.price,
					purchasePrice: serverProd.purchase_price,
					category: serverProd.category ?? undefined,
					unit: serverProd.unit ?? undefined,
					quantity: serverProd.quantity,
					qrCode: serverProd.qr_code || serverProd.id,
					createdAt: serverProd.created_at,
					updatedAt: serverProd.updated_at,
					image: serverProd.image ?? undefined,
				};
				await storage.upsertProduct(localProd);
			} catch (e) {
				console.warn('Erro ao fazer merge de produto:', e);
			}
		}
	}

	// MERGE clients
	if (res.changes?.clients) {
		for (const serverClient of res.changes.clients) {
			try {
				const localClient = {
					id: serverClient.id,
					name: serverClient.name,
					phone: serverClient.phone ?? undefined,
					address: serverClient.address ?? undefined,
					nif: serverClient.nif ?? undefined,
					createdAt: serverClient.created_at,
					updatedAt: serverClient.updated_at,
				};
				await storage.upsertClient(localClient);
			} catch (e) {
				console.warn('Erro ao fazer merge de cliente:', e);
			}
		}
	}

	// MERGE sales (more complex - need to merge items too)
	if (res.changes?.sales) {
		const serverSaleItems = res.changes.sale_items || [];
		for (const serverSale of res.changes.sales) {
			try {
				const saleItems = serverSaleItems
					.filter((si: any) => si.sale_id === serverSale.id)
					.map((si: any) => ({
						productId: si.product_id || '',
						productName: si.product_name,
						quantity: si.quantity,
						price: si.price,
						purchasePrice: si.purchase_price,
					}));
				const localSale = {
					id: serverSale.id,
					number: serverSale.number ?? undefined,
					date: serverSale.date,
					dueDate: serverSale.due_date ?? undefined,
					total: serverSale.total,
					profit: serverSale.profit ?? undefined,
					type: serverSale.type,
					clientId: serverSale.client_id ?? undefined,
					clientName: serverSale.client_name ?? undefined,
					items: saleItems,
					observations: serverSale.observations ?? undefined,
					externalReference: serverSale.external_reference ?? undefined,
					paymentMethod: serverSale.payment_method ?? undefined,
					status: serverSale.status,
				};
				await storage.addSale(localSale);
			} catch (e) {
				console.warn('Erro ao fazer merge de venda:', e);
			}
		}
	}

	// MERGE transactions
	if (res.changes?.financial_transactions) {
		for (const serverTx of res.changes.financial_transactions) {
			try {
				const localTx = {
					id: serverTx.id,
					type: serverTx.type,
					description: serverTx.description,
					amount: serverTx.amount,
					date: serverTx.date,
					category: serverTx.category ?? undefined,
				};
				await storage.addTransaction(localTx);
			} catch (e) {
				console.warn('Erro ao fazer merge de transação:', e);
			}
		}
	}

	// Upsert establishments offline (mobile). Web provider may ignore upsert.
	const ests = res.changes?.establishments ?? [];
	if (Array.isArray(ests) && ests.length > 0) {
		const latest = ests[ests.length - 1];
		try {
			await storage.upsertEstablishment({
				id: latest.id,
				name: latest.name,
				document: latest.document ?? undefined,
				phone: latest.phone ?? undefined,
				address: latest.address ?? undefined,
				updatedAt: latest.updated_at,
			});
		} catch {}
	}
	return res;
}

export async function pushChanges() {
	console.log('\n' + '🔷'.repeat(30));
	console.log('📤 pushChanges: FUNÇÃO INICIADA');
	console.log('  - API_URL:', API_URL);
	console.log('  - Timestamp:', new Date().toLocaleTimeString());
	console.log('🔷'.repeat(30) + '\n');
	
	if (!API_URL) {
		console.error('❌ Sync: API_URL não configurado! Configure VITE_API_URL no arquivo .env');
		console.error('❌ Sync: Dados estão sendo salvos APENAS LOCALMENTE');
		console.error('❌ Sync: Para sincronizar com Supabase, configure o servidor backend');
		throw new Error('API_URL não configurado. Configure VITE_API_URL no arquivo .env');
	}
	
	console.log('✅ pushChanges: API_URL está configurada:', API_URL);
	console.log('📤 Sync: Iniciando push para servidor...');
	
	console.log('📦 Sync: Obtendo storage...');
	const storage = await getStorage();
	console.log('✅ Sync: Storage obtido:', storage.constructor.name);
	
	const [products, clients, sales, txs] = await Promise.all([
		storage.getProducts().catch(() => []),
		storage.getClients().catch(() => []),
		storage.getSales().catch(() => []),
		storage.getTransactions().catch(() => []),
	]);
	
	console.log('📊 Sync: Dados locais:', {
		products: products.length,
		clients: clients.length,
		sales: sales.length,
		transactions: txs.length
	});
	
	// Only push rows with UUID ids to match Supabase schemas
	const productsDb = products.filter(p => isUuid(p.id)).map(toDbProduct);
	const clientsDb = clients.filter(c => isUuid(c.id)).map(toDbClient);
	const salesDb = sales.filter(s => isUuid(s.id)).map(toDbSale);
	const saleItemsDb = sales
		.filter(s => isUuid(s.id))
		.flatMap(s => (s.items || []).map((it: any, idx) => {
			// Se o item já tem ID (UUID), usar ele. Caso contrário, gerar novo.
			// Isso evita duplicação a cada push.
			const itemId = (it.id && isUuid(it.id)) ? it.id : generateUuid();
			if (!it.id || !isUuid(it.id)) {
				console.log(`🆕 Sync: Item da venda ${s.id}[${idx}] sem ID válido, gerando: ${itemId}`);
			}
			return {
				id: itemId,
				sale_id: s.id,
				product_id: isUuid(it.productId) ? it.productId : null,
				product_name: it.productName,
				quantity: it.quantity,
				price: it.price,
				purchase_price: it.purchasePrice,
			};
		}));
	const txsDb = txs.filter(t => isUuid(t.id)).map(toDbTx);

	console.log('🔍 Sync: Dados com UUID válido:', {
		products: productsDb.length,
		clients: clientsDb.length,
		sales: salesDb.length,
		sale_items: saleItemsDb.length,
		transactions: txsDb.length
	});

	const changes: Record<string, any[]> = {};
	if (productsDb.length) changes['products'] = productsDb;
	if (clientsDb.length) changes['clients'] = clientsDb;
	if (salesDb.length) changes['sales'] = salesDb;
	if (saleItemsDb.length) changes['sale_items'] = saleItemsDb;
	if (txsDb.length) changes['financial_transactions'] = txsDb;
	
	if (Object.keys(changes).length === 0) {
		console.log('ℹ️ Sync: Nenhuma mudança para enviar');
		return;
	}

	console.log('📤 Sync: Enviando para servidor:', Object.keys(changes).join(', '));
	console.log('🔑 Sync: Obtendo sessão do Supabase...');
	
	const { data: { session } } = await supabase.auth.getSession();
	console.log('🔑 Sync: Sessão obtida:', session ? 'SIM' : 'NÃO');
	
	if (!session?.access_token) {
		console.error('❌ Sync: Sem token de autenticação!');
		console.error('❌ Sync: session:', session);
		throw new Error('Sem token de autenticação para fazer push');
	}
	
	console.log('✅ Sync: Token presente:', session.access_token.substring(0, 20) + '...');
	console.log('📡 Sync: Fazendo requisição POST para:', API_URL + '/sync/push');
	
	try {
		console.log('⏰ Sync: Chamando apiPost...');
		const response = await apiPost('/sync/push', { changes }, session.access_token);
		console.log('✅ Sync: Resposta recebida:', response);
		console.log('🎉 Sync: Push completo com sucesso!');
		console.log('🔷'.repeat(30) + '\n');
	} catch (error: any) {
		console.error('\n' + '❌'.repeat(30));
		console.error('❌ Sync: ERRO ao fazer push');
		console.error('❌ Tipo:', typeof error);
		console.error('❌ Nome:', error?.name);
		console.error('❌ Mensagem:', error?.message);
		console.error('❌ Stack:', error?.stack);
		console.error('❌ Erro completo:', error);
		console.error('❌'.repeat(30) + '\n');
		throw error;
	}
}


