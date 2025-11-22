import { supabase } from '../lib/supabase';
import type { StorageProvider } from './types';
import type { Product, Client, Sale, FinancialTransaction, Establishment } from '../types';
import { fromDbProduct, toDbProduct, fromDbClient, toDbClient, fromDbTx, toDbTx, toDbSale } from './mappers';

// 🏢 Helper para obter establishment_id do usuário logado
async function getUserEstablishmentId(): Promise<string | null> {
	try {
		const { data: { session } } = await supabase.auth.getSession();
		if (!session?.user) {
			return null;
		}
		
		const { data: profile, error } = await supabase
			.from('profiles')
			.select('establishment_id')
			.eq('user_id', session.user.id)
			.maybeSingle();
		
		if (error) {
			console.error('❌ WebStorage: Erro ao buscar establishment_id:', error);
			return null;
		}
		
		return profile?.establishment_id || null;
	} catch (error) {
		console.error('❌ WebStorage: Exceção ao buscar establishment_id:', error);
		return null;
	}
}

function ensureOk<T>(data: T | null, error: any): T {
	if (error) throw new Error(error.message ?? 'Supabase error');
	return (data ?? []) as unknown as T;
}

// Validar se é um UUID válido
function isValidUuid(id: string | undefined): boolean {
	if (!id) return false;
	return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

const normalizeSale = (raw: any): Sale => {
	const safe = raw ?? {};

	const rawItems = Array.isArray(safe.items)
		? safe.items
		: Array.isArray(safe.sale_items)
			? safe.sale_items
			: [];

	return {
		id: safe.id ?? '',
		number: safe.number ?? undefined,
		date: safe.date ?? new Date().toISOString(),
		dueDate: safe.dueDate ?? safe.due_date ?? undefined,
		total: Number(safe.total ?? 0),
		profit: safe.profit ?? undefined,
		type: safe.type ?? 'receipt',
		clientId: safe.clientId ?? safe.client_id ?? undefined,
		clientName: safe.clientName ?? safe.client_name ?? undefined,
		items: rawItems.map((item: any) => ({
			id: item.id ?? undefined, // Incluir o ID do sale_item
			productId: item.productId ?? item.product_id ?? '',
			productName: item.productName ?? item.product_name ?? 'Produto',
			quantity: Number(item.quantity ?? 0),
			price: Number(item.price ?? 0),
			purchasePrice: Number(item.purchasePrice ?? item.purchase_price ?? 0),
		})),
		observations: safe.observations ?? safe.observations ?? undefined,
		externalReference: safe.externalReference ?? safe.external_reference ?? undefined,
		paymentMethod: safe.paymentMethod ?? safe.payment_method ?? undefined,
		status: safe.status ?? 'pending',
	};
};

const normalizeSaleArray = (rows: any[]): Sale[] => {
	if (!Array.isArray(rows)) return [];
	return rows.map(normalizeSale);
};

export class WebStorage implements StorageProvider {
	async init(): Promise<void> {
		// no-op for web
	}

	async getProducts(): Promise<Product[]> {
		// 🆕 OBTER establishment_id DO USUÁRIO
		const establishmentId = await getUserEstablishmentId();
		if (!establishmentId) {
			console.warn('⚠️ WebStorage getProducts: Usuário sem establishment_id, retornando apenas dados locais');
			// Retornar apenas dados locais se existirem
			try {
				const localData = localStorage.getItem('products_backup');
				if (localData) {
					const localProducts = JSON.parse(localData) as Product[];
					return Array.isArray(localProducts) ? localProducts : [];
				}
			} catch (e) {
				console.warn('Erro ao carregar backup local de produtos:', e);
			}
			return [];
		}
		
		// Primeiro tentar carregar do localStorage (backup local)
		try {
			const localData = localStorage.getItem('products_backup');
			if (localData) {
				const localProducts = JSON.parse(localData) as Product[];
				if (Array.isArray(localProducts) && localProducts.length > 0) {
					// Tentar buscar do Supabase também e fazer merge
					try {
						// 🆕 FILTRAR POR establishment_id
						const { data, error } = await supabase
							.from('products')
							.select('*')
							.eq('establishment_id', establishmentId)
							.order('updated_at', { ascending: false });
						
						if (!error && data) {
							const serverProducts = data.map(fromDbProduct);
							// Merge: local primeiro, depois server (server sobrescreve se mesmo ID)
							const merged = new Map<string, Product>();
							localProducts.forEach(p => merged.set(p.id, p));
							serverProducts.forEach(p => merged.set(p.id, p));
							const result = Array.from(merged.values());
							// Atualizar backup local
							localStorage.setItem('products_backup', JSON.stringify(result));
							return result;
						}
					} catch (e) {
						console.warn('Erro ao buscar produtos do Supabase, usando backup local:', e);
					}
					return localProducts;
				}
			}
		} catch (e) {
			console.warn('Erro ao carregar backup local de produtos:', e);
		}

		// Se não tem backup local, buscar do Supabase
		try {
			// 🆕 FILTRAR POR establishment_id
			const { data, error } = await supabase
				.from('products')
				.select('*')
				.eq('establishment_id', establishmentId)
				.order('updated_at', { ascending: false });
			
			const rows = ensureOk<any[]>(data, error);
			const products = rows.map(fromDbProduct);
			// Salvar como backup local
			localStorage.setItem('products_backup', JSON.stringify(products));
			return products;
		} catch (e) {
			console.warn('Erro ao buscar produtos do Supabase:', e);
			return [];
		}
	}

	async upsertProduct(product: Product): Promise<void> {
		// Validar UUID antes de salvar
		if (!isValidUuid(product.id)) {
			console.error('❌ ID inválido (não é UUID):', product.id);
			throw new Error(`ID inválido: ${product.id}. Use UUIDs válidos (sem prefixos como "prod_").`);
		}

		// APENAS salvar localmente (backup)
		// O sync para Supabase será feito via backend (pushChanges) que tem service role
		try {
			const localData = localStorage.getItem('products_backup');
			const localProducts = localData ? (JSON.parse(localData) as Product[]) : [];
			const updated = localProducts.filter(p => p.id !== product.id);
			updated.push(product);
			localStorage.setItem('products_backup', JSON.stringify(updated));
			console.log('✅ Produto salvo localmente:', product.id);
		} catch (e) {
			console.error('❌ Erro ao salvar backup local de produto:', e);
			throw e;
		}
	}

	async deleteProduct(productId: string): Promise<void> {
		// APENAS remover do backup local
		// A exclusão no Supabase será tratada via backend se necessário
		try {
			const localData = localStorage.getItem('products_backup');
			if (localData) {
				const localProducts = JSON.parse(localData) as Product[];
				const updated = localProducts.filter(p => p.id !== productId);
				localStorage.setItem('products_backup', JSON.stringify(updated));
				console.log('✅ Produto removido localmente:', productId);
			}
		} catch (e) {
			console.error('❌ Erro ao remover produto do backup local:', e);
			throw e;
		}
	}

	async getClients(): Promise<Client[]> {
		// 🆕 OBTER establishment_id DO USUÁRIO
		const establishmentId = await getUserEstablishmentId();
		if (!establishmentId) {
			console.warn('⚠️ WebStorage getClients: Usuário sem establishment_id, retornando apenas dados locais');
			try {
				const localData = localStorage.getItem('clients_backup');
				if (localData) {
					const localClients = JSON.parse(localData) as Client[];
					return Array.isArray(localClients) ? localClients : [];
				}
			} catch (e) {
				console.warn('Erro ao carregar backup local de clientes:', e);
			}
			return [];
		}
		
		// Primeiro tentar carregar do localStorage (backup local)
		try {
			const localData = localStorage.getItem('clients_backup');
			if (localData) {
				const localClients = JSON.parse(localData) as Client[];
				if (Array.isArray(localClients) && localClients.length > 0) {
					// Tentar buscar do Supabase também e fazer merge
					try {
						// 🆕 FILTRAR POR establishment_id
						const { data, error } = await supabase
							.from('clients')
							.select('*')
							.eq('establishment_id', establishmentId)
							.order('updated_at', { ascending: false });
						
						if (!error && data) {
							const serverClients = data.map(fromDbClient);
							const merged = new Map<string, Client>();
							localClients.forEach(c => merged.set(c.id, c));
							serverClients.forEach(c => merged.set(c.id, c));
							const result = Array.from(merged.values());
							localStorage.setItem('clients_backup', JSON.stringify(result));
							return result;
						}
					} catch (e) {
						console.warn('Erro ao buscar clientes do Supabase, usando backup local:', e);
					}
					return localClients;
				}
			}
		} catch (e) {
			console.warn('Erro ao carregar backup local de clientes:', e);
		}

		// Se não tem backup local, buscar do Supabase
		try {
			// 🆕 FILTRAR POR establishment_id
			const { data, error } = await supabase
				.from('clients')
				.select('*')
				.eq('establishment_id', establishmentId)
				.order('updated_at', { ascending: false });
			
			const rows = ensureOk<any[]>(data, error);
			const clients = rows.map(fromDbClient);
			localStorage.setItem('clients_backup', JSON.stringify(clients));
			return clients;
		} catch (e) {
			console.warn('Erro ao buscar clientes do Supabase:', e);
			return [];
		}
	}

	async upsertClient(client: Client): Promise<void> {
		// Validar UUID antes de salvar
		if (!isValidUuid(client.id)) {
			console.error('❌ ID inválido (não é UUID):', client.id);
			throw new Error(`ID inválido: ${client.id}. Use UUIDs válidos.`);
		}

		// APENAS salvar localmente (backup)
		// O sync para Supabase será feito via backend (pushChanges)
		try {
			const localData = localStorage.getItem('clients_backup');
			const localClients = localData ? (JSON.parse(localData) as Client[]) : [];
			const updated = localClients.filter(c => c.id !== client.id);
			updated.push(client);
			localStorage.setItem('clients_backup', JSON.stringify(updated));
			console.log('✅ Cliente salvo localmente:', client.id);
		} catch (e) {
			console.error('❌ Erro ao salvar backup local de cliente:', e);
			throw e;
		}
	}

	async getSales(): Promise<Sale[]> {
		// 🆕 OBTER establishment_id DO USUÁRIO
		const establishmentId = await getUserEstablishmentId();
		if (!establishmentId) {
			console.warn('⚠️ WebStorage getSales: Usuário sem establishment_id, retornando apenas dados locais');
			try {
				const localData = localStorage.getItem('sales_backup');
				if (localData) {
					const localSalesRaw = JSON.parse(localData) as any[];
					const localSales = normalizeSaleArray(localSalesRaw);
					return Array.isArray(localSales) ? localSales : [];
				}
			} catch (e) {
				console.warn('Erro ao carregar backup local de vendas:', e);
			}
			return [];
		}
		
		// Primeiro tentar carregar do localStorage (backup local)
		try {
			const localData = localStorage.getItem('sales_backup');
			if (localData) {
				const localSalesRaw = JSON.parse(localData) as any[];
				const localSales = normalizeSaleArray(localSalesRaw);
				if (Array.isArray(localSales) && localSales.length > 0) {
					// Tentar buscar do Supabase também e fazer merge
					try {
						// 🆕 FILTRAR POR establishment_id
						const { data, error } = await supabase
							.from('sales')
							.select('*, sale_items(*)')
							.eq('establishment_id', establishmentId)
							.order('date', { ascending: false });
						
						if (!error && data) {
							const serverSales = normalizeSaleArray(data as any[]);
							const merged = new Map<string, Sale>();
							localSales.forEach(s => merged.set(s.id, s));
							serverSales.forEach(s => merged.set(s.id, s));
							const result = Array.from(merged.values());
							localStorage.setItem('sales_backup', JSON.stringify(result));
							return result;
						}
					} catch (e) {
						console.warn('Erro ao buscar vendas do Supabase, usando backup local:', e);
					}
					return localSales;
				}
			}
		} catch (e) {
			console.warn('Erro ao carregar backup local de vendas:', e);
		}

		// Se não tem backup local, buscar do Supabase
		try {
			// 🆕 FILTRAR POR establishment_id
			const { data, error } = await supabase
				.from('sales')
				.select('*, sale_items(*)')
				.eq('establishment_id', establishmentId)
				.order('date', { ascending: false });
			
			const rows = ensureOk<any[]>(data, error);
			const sales = normalizeSaleArray(rows);
			localStorage.setItem('sales_backup', JSON.stringify(sales));
			return sales;
		} catch (e) {
			console.warn('Erro ao buscar vendas do Supabase:', e);
			return [];
		}
	}

	async addSale(sale: Sale): Promise<void> {
		// APENAS salvar localmente (backup)
		// O sync para Supabase será feito via backend (pushChanges)
		try {
			const localData = localStorage.getItem('sales_backup');
			const localSales = localData ? normalizeSaleArray(JSON.parse(localData)) : [];
			const updated = localSales.filter(s => s.id !== sale.id);
			updated.push(normalizeSale(sale));
			localStorage.setItem('sales_backup', JSON.stringify(updated));
			console.log('✅ Venda salva localmente:', sale.id);
		} catch (e) {
			console.error('❌ Erro ao salvar backup local de venda:', e);
			throw e;
		}
	}

	async getTransactions(): Promise<FinancialTransaction[]> {
		// 🆕 OBTER establishment_id DO USUÁRIO
		const establishmentId = await getUserEstablishmentId();
		if (!establishmentId) {
			console.warn('⚠️ WebStorage getTransactions: Usuário sem establishment_id, retornando apenas dados locais');
			try {
				const localData = localStorage.getItem('transactions_backup');
				if (localData) {
					const localTxs = JSON.parse(localData) as FinancialTransaction[];
					return Array.isArray(localTxs) ? localTxs : [];
				}
			} catch (e) {
				console.warn('Erro ao carregar backup local de transações:', e);
			}
			return [];
		}
		
		// Primeiro tentar carregar do localStorage (backup local)
		try {
			const localData = localStorage.getItem('transactions_backup');
			if (localData) {
				const localTxs = JSON.parse(localData) as FinancialTransaction[];
				if (Array.isArray(localTxs) && localTxs.length > 0) {
					// Tentar buscar do Supabase também e fazer merge
					try {
						// 🆕 FILTRAR POR establishment_id
						const { data, error } = await supabase
							.from('financial_transactions')
							.select('*')
							.eq('establishment_id', establishmentId)
							.order('date', { ascending: false });
						
						if (!error && data) {
							const serverTxs = data.map(fromDbTx);
							const merged = new Map<string, FinancialTransaction>();
							localTxs.forEach(t => merged.set(t.id, t));
							serverTxs.forEach(t => merged.set(t.id, t));
							const result = Array.from(merged.values());
							localStorage.setItem('transactions_backup', JSON.stringify(result));
							return result;
						}
					} catch (e) {
						console.warn('Erro ao buscar transações do Supabase, usando backup local:', e);
					}
					return localTxs;
				}
			}
		} catch (e) {
			console.warn('Erro ao carregar backup local de transações:', e);
		}

		// Se não tem backup local, buscar do Supabase
		try {
			// 🆕 FILTRAR POR establishment_id
			const { data, error } = await supabase
				.from('financial_transactions')
				.select('*')
				.eq('establishment_id', establishmentId)
				.order('date', { ascending: false });
			
			const rows = ensureOk<any[]>(data, error);
			const transactions = rows.map(fromDbTx);
			localStorage.setItem('transactions_backup', JSON.stringify(transactions));
			return transactions;
		} catch (e) {
			console.warn('Erro ao buscar transações do Supabase:', e);
			return [];
		}
	}

	async addTransaction(tx: FinancialTransaction): Promise<void> {
		// APENAS salvar localmente (backup)
		// O sync para Supabase será feito via backend (pushChanges)
		try {
			const localData = localStorage.getItem('transactions_backup');
			const localTxs = localData ? (JSON.parse(localData) as FinancialTransaction[]) : [];
			const updated = localTxs.filter(t => t.id !== tx.id);
			updated.push(tx);
			localStorage.setItem('transactions_backup', JSON.stringify(updated));
			console.log('✅ Transação salva localmente:', tx.id);
		} catch (e) {
			console.error('❌ Erro ao salvar backup local de transação:', e);
			throw e;
		}
	}

	// Establishment
	async getEstablishment(): Promise<Establishment | null> {
		// Load profile to find linked establishment
		const { data: auth } = await supabase.auth.getUser();
		const user = auth?.user;
		if (!user) return null;
		const { data: prof, error: pErr } = await supabase.from('profiles').select('establishment_id').eq('user_id', user.id).maybeSingle();
		if (pErr) return null;
		if (!prof?.establishment_id) return null;
		const { data: est, error } = await supabase.from('establishments').select('*').eq('id', prof.establishment_id).maybeSingle();
		if (error || !est) return null;
		return {
			id: est.id,
			name: est.name,
			document: est.document ?? undefined,
			phone: est.phone ?? undefined,
			address: est.address ?? undefined,
			updatedAt: est.updated_at,
		};
	}
	async upsertEstablishment(_est: Establishment): Promise<void> {
		// No-op on web (writes should go through backend with service role)
	}

	async clearAll(): Promise<void> {
		try {
			console.log('🗑️ WebStorage: Iniciando limpeza robusta de dados...');

			// Lista de permissão: chaves que NÃO devem ser apagadas.
			// Adicione aqui qualquer chave que deva persistir entre sessões (ex: tema, idioma).
			const PRESERVED_KEYS = [
				'theme', 
				'i18nextLng' // Chave comum para internacionalização
			];

			const keysToRemove: string[] = [];
			for (let i = 0; i < localStorage.length; i++) {
				const key = localStorage.key(i);

				// Ignorar chaves preservadas e chaves de autenticação do Supabase,
				// que são gerenciadas pelo próprio Supabase no logout.
				if (key && !PRESERVED_KEYS.includes(key) && !key.startsWith('sb-')) {
					keysToRemove.push(key);
				}
			}

			keysToRemove.forEach(key => {
				console.log(`🗑️ WebStorage: Removendo chave: ${key}`);
				localStorage.removeItem(key);
			});

			console.log(`✅ WebStorage: Limpeza de dados concluída (${keysToRemove.length} chaves removidas)`);
		} catch (error) {
			console.error('❌ WebStorage: Erro ao limpar dados:', error);
			throw error;
		}
	}
}


