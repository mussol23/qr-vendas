import type { StorageProvider } from './types';
import type { Product, Client, Sale, FinancialTransaction, Establishment } from '../types';
import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { supabase } from '../lib/supabase';

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
			console.error('❌ SQLite: Erro ao buscar establishment_id:', error);
			return null;
		}
		
		return profile?.establishment_id || null;
	} catch (error) {
		console.error('❌ SQLite: Exceção ao buscar establishment_id:', error);
		return null;
	}
}

const DB_NAME = 'qrvendas.db';

export class MobileSQLiteStorage implements StorageProvider {
	private db: SQLiteDBConnection | null = null;

	private generateUuid(): string {
		if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
			return (crypto as any).randomUUID();
		}
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			const r = Math.random() * 16 | 0;
			const v = c === 'x' ? r : (r & 0x3 | 0x8);
			return v.toString(16);
		});
	}

	private async saveToStore(): Promise<void> {
		if (!this.db) {
			console.warn('⚠️ SQLite: DB não inicializado, não é possível fazer saveToStore');
			return;
		}
		try {
			console.log('💾 SQLite: Executando saveToStore...');
			const sqlite = CapacitorSQLite as any;
			if (typeof sqlite.saveToStore === 'function') {
				await sqlite.saveToStore({ database: DB_NAME });
				console.log('✅ SQLite: saveToStore completo');
			} else {
				console.warn('⚠️ SQLite: saveToStore não disponível');
			}
		} catch (e) {
			console.error('❌ SQLite: Erro ao fazer saveToStore:', e);
		}
	}

	async init(): Promise<void> {
		if (!Capacitor.isNativePlatform()) {
			console.log('🌐 SQLite: Não é plataforma nativa, ignorando init');
			return;
		}
		try {
			console.log('📱 SQLite: Iniciando no mobile...');
			console.log('🗄️ SQLite: Nome do banco:', DB_NAME);
			console.log('🔍 SQLite: Tipo de DB_NAME:', typeof DB_NAME);
			console.log('🔍 SQLite: DB_NAME é string?', typeof DB_NAME === 'string');
			console.log('🔍 SQLite: DB_NAME length:', DB_NAME?.length);
			
			if (!DB_NAME || typeof DB_NAME !== 'string' || DB_NAME.trim() === '') {
				throw new Error('Nome do banco de dados inválido!');
			}
			
			const sqlite = CapacitorSQLite as any;
			console.log('🔍 SQLite: Plugin disponível?', !!sqlite);
			console.log('🔍 SQLite: createConnection disponível?', typeof sqlite.createConnection);
			
			// Android: request permissions if available
			if (typeof sqlite.requestPermissions === 'function') {
				console.log('🔑 SQLite: Solicitando permissões...');
				try {
					const permResult = await sqlite.requestPermissions();
					console.log('✅ SQLite: Permissões:', permResult);
				} catch (permErr) {
					console.warn('⚠️ SQLite: Erro ao solicitar permissões:', permErr);
				}
			}
			
			console.log('🔗 SQLite: Criando conexão...');
			console.log('🔗 SQLite: Parâmetros:', {
				database: DB_NAME,
				encrypted: false,
				mode: 'no-encryption',
				version: 1,
				readonly: false
			});
			
			// Tentar com parâmetros posicionais (API antiga)
			let conn;
			try {
				console.log('🔗 Tentativa 1: Parâmetros posicionais');
				conn = await sqlite.createConnection(DB_NAME, false, 'no-encryption', 1, false);
				console.log('✅ SQLite: Conexão criada com parâmetros posicionais');
			} catch (err1) {
				console.warn('⚠️ Tentativa 1 falhou:', err1);
				console.log('🔗 Tentativa 2: Objeto de configuração');
				try {
					conn = await sqlite.createConnection({
						database: DB_NAME,
						encrypted: false,
						mode: 'no-encryption',
						version: 1,
						readonly: false
					});
					console.log('✅ SQLite: Conexão criada com objeto');
				} catch (err2) {
					console.error('❌ Tentativa 2 falhou:', err2);
					throw err2;
				}
			}
			
			this.db = conn;
			
			console.log('📂 SQLite: Abrindo banco de dados...');
			await this.db.open();
			
			console.log('🔧 SQLite: Executando migrações...');
			await this.migrate();
			
			console.log('✅ SQLite: Inicialização completa!');
		} catch (e) {
			// If plugin is missing or fails, keep db as null to allow graceful fallback
			console.error('❌ SQLite: Init falhou:', e);
			this.db = null;
			throw e; // Re-throw para o timeout capturar
		}
	}

	private async migrate() {
		if (!this.db) return;
		// Minimal schema; align fields with Supabase tables
		await this.db.execute(`
			PRAGMA foreign_keys=ON;
			PRAGMA journal_mode=WAL;
			PRAGMA synchronous=NORMAL;
			CREATE TABLE IF NOT EXISTS products (
				id TEXT PRIMARY KEY,
				name TEXT NOT NULL,
				price REAL NOT NULL,
				purchasePrice REAL NOT NULL,
				category TEXT,
				unit TEXT,
				quantity INTEGER NOT NULL,
				qrCode TEXT,
				createdAt TEXT NOT NULL,
				updatedAt TEXT NOT NULL,
				image TEXT,
				establishmentId TEXT
			);
			CREATE TABLE IF NOT EXISTS clients (
				id TEXT PRIMARY KEY,
				name TEXT NOT NULL,
				phone TEXT,
				address TEXT,
				nif TEXT,
				createdAt TEXT NOT NULL,
				updatedAt TEXT NOT NULL,
				establishmentId TEXT
			);
			CREATE TABLE IF NOT EXISTS sales (
				id TEXT PRIMARY KEY,
				date TEXT NOT NULL,
				dueDate TEXT,
				total REAL NOT NULL,
				profit REAL,
				type TEXT NOT NULL,
				clientId TEXT,
				clientName TEXT,
				observations TEXT,
				externalReference TEXT,
				paymentMethod TEXT,
				status TEXT NOT NULL,
				establishmentId TEXT
			);
			CREATE TABLE IF NOT EXISTS sale_items (
				id TEXT PRIMARY KEY,
				sale_id TEXT NOT NULL,
				productId TEXT NOT NULL,
				productName TEXT NOT NULL,
				quantity INTEGER NOT NULL,
				price REAL NOT NULL,
				purchasePrice REAL NOT NULL
			);
			CREATE TABLE IF NOT EXISTS financial_transactions (
				id TEXT PRIMARY KEY,
				type TEXT NOT NULL,
				description TEXT NOT NULL,
				amount REAL NOT NULL,
				date TEXT NOT NULL,
				category TEXT,
				establishmentId TEXT
			);
			CREATE TABLE IF NOT EXISTS establishments (
				id TEXT PRIMARY KEY,
				name TEXT NOT NULL,
				document TEXT,
				phone TEXT,
				address TEXT,
				updatedAt TEXT NOT NULL
			);
		`);
		
		// 🆕 Migração: Adicionar coluna establishmentId se não existir (para tabelas existentes)
		try {
			await this.db.execute(`
				-- Adicionar establishmentId se não existir (SQLite não suporta IF NOT EXISTS em ALTER TABLE)
				-- Vamos tentar adicionar e ignorar erro se já existir
			`);
			
			// Tentar adicionar colunas (pode falhar se já existirem, mas isso é OK)
			const tables = ['products', 'clients', 'sales', 'financial_transactions'];
			for (const table of tables) {
				try {
					await this.db.run(`ALTER TABLE ${table} ADD COLUMN establishmentId TEXT`);
					console.log(`✅ SQLite: Coluna establishmentId adicionada em ${table}`);
				} catch (e: any) {
					// Erro esperado se coluna já existe
					if (e.message?.includes('duplicate column') || e.message?.includes('already exists')) {
						console.log(`ℹ️ SQLite: Coluna establishmentId já existe em ${table}`);
					} else {
						console.warn(`⚠️ SQLite: Erro ao adicionar establishmentId em ${table}:`, e);
					}
				}
			}
		} catch (e) {
			console.warn('⚠️ SQLite: Erro na migração de establishmentId:', e);
		}
	}

	async getProducts(): Promise<Product[]> {
		if (!this.db) {
			console.warn('⚠️ SQLite: DB não inicializado, retornando array vazio');
			return [];
		}
		try {
			// 🆕 OBTER establishment_id DO USUÁRIO
			const establishmentId = await getUserEstablishmentId();
			if (!establishmentId) {
				console.warn('⚠️ SQLite getProducts: Usuário sem establishment_id, retornando array vazio');
				return [];
			}
			
			console.log('📦 SQLite: Carregando produtos...');
			console.log('🔒 SQLite: Filtrando por establishmentId:', establishmentId);
			
			// 🆕 FILTRAR POR establishmentId
			const res = await this.db.query(
				'SELECT * FROM products WHERE establishmentId = ? ORDER BY updatedAt DESC',
				[establishmentId]
			);
			const products = (res.values ?? []) as unknown as Product[];
			console.log(`✅ SQLite: ${products.length} produtos carregados (filtrados por establishmentId)`);
			return products;
		} catch (error) {
			console.error('❌ SQLite: Erro ao carregar produtos:', error);
			return [];
		}
	}
	async upsertProduct(product: Product): Promise<void> {
		if (!this.db) return;
		try {
			// 🆕 OBTER establishmentId DO PRODUTO OU DO USUÁRIO
			const establishmentId = (product as any).establishmentId || await getUserEstablishmentId();
			
			console.log('💾 SQLite: Salvando produto:', product.id, product.name);
			console.log('🏢 SQLite: establishmentId:', establishmentId);
			
			await this.db.run(
				`INSERT INTO products
				(id,name,price,purchasePrice,category,unit,quantity,qrCode,createdAt,updatedAt,image,establishmentId)
				VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
				ON CONFLICT(id) DO UPDATE SET
					name=excluded.name, price=excluded.price, purchasePrice=excluded.purchasePrice,
					category=excluded.category, unit=excluded.unit, quantity=excluded.quantity, qrCode=excluded.qrCode,
					createdAt=excluded.createdAt, updatedAt=excluded.updatedAt, image=excluded.image,
					establishmentId=excluded.establishmentId`,
				[
					product.id, product.name, product.price, product.purchasePrice, product.category, product.unit ?? null,
					product.quantity, product.qrCode, product.createdAt, product.updatedAt, product.image ?? null,
					establishmentId
				]
			);
			// Forçar commit
			await this.saveToStore();
			console.log('✅ SQLite: Produto salvo e commitado');
		} catch (error) {
			console.error('❌ Erro ao salvar produto no SQLite:', error);
			throw error;
		}
	}
	async deleteProduct(productId: string): Promise<void> {
		if (!this.db) return;
		await this.db.run('DELETE FROM products WHERE id = ?', [productId]);
	}

	async getClients(): Promise<Client[]> {
		if (!this.db) {
			console.warn('⚠️ SQLite: DB não inicializado, retornando array vazio');
			return [];
		}
		try {
			// 🆕 OBTER establishment_id DO USUÁRIO
			const establishmentId = await getUserEstablishmentId();
			if (!establishmentId) {
				console.warn('⚠️ SQLite getClients: Usuário sem establishment_id, retornando array vazio');
				return [];
			}
			
			console.log('📦 SQLite: Carregando clientes...');
			console.log('🔒 SQLite: Filtrando por establishmentId:', establishmentId);
			
			// 🆕 FILTRAR POR establishmentId
			const res = await this.db.query(
				'SELECT * FROM clients WHERE establishmentId = ? ORDER BY updatedAt DESC',
				[establishmentId]
			);
			const clients = (res.values ?? []) as unknown as Client[];
			console.log(`✅ SQLite: ${clients.length} clientes carregados (filtrados por establishmentId)`);
			return clients;
		} catch (error) {
			console.error('❌ SQLite: Erro ao carregar clientes:', error);
			return [];
		}
	}
	async upsertClient(client: Client): Promise<void> {
		if (!this.db) return;
		try {
			// 🆕 OBTER establishmentId DO CLIENTE OU DO USUÁRIO
			const establishmentId = (client as any).establishmentId || await getUserEstablishmentId();
			
			console.log('💾 SQLite: Salvando cliente:', client.id, client.name);
			console.log('🏢 SQLite: establishmentId:', establishmentId);
			
			await this.db.run(
				`INSERT INTO clients (id,name,phone,address,nif,createdAt,updatedAt,establishmentId)
				 VALUES (?,?,?,?,?,?,?,?)
				 ON CONFLICT(id) DO UPDATE SET
				  name=excluded.name, phone=excluded.phone, address=excluded.address, nif=excluded.nif,
				  createdAt=excluded.createdAt, updatedAt=excluded.updatedAt, establishmentId=excluded.establishmentId`,
				[
					client.id, client.name, client.phone, client.address, client.nif, client.createdAt, client.updatedAt,
					establishmentId
				]
			);
			await this.saveToStore();
			console.log('✅ SQLite: Cliente salvo e commitado');
		} catch (error) {
			console.error('❌ Erro ao salvar cliente no SQLite:', error);
			throw error;
		}
	}

	async getSales(): Promise<Sale[]> {
		if (!this.db) {
			console.warn('⚠️ SQLite: DB não inicializado, retornando array vazio');
			return [];
		}
		try {
			// 🆕 OBTER establishment_id DO USUÁRIO
			const establishmentId = await getUserEstablishmentId();
			if (!establishmentId) {
				console.warn('⚠️ SQLite getSales: Usuário sem establishment_id, retornando array vazio');
				return [];
			}
			
			console.log('📦 SQLite: Carregando vendas...');
			console.log('🔒 SQLite: Filtrando por establishmentId:', establishmentId);
			
			// 🆕 FILTRAR POR establishmentId
			const res = await this.db.query(
				'SELECT * FROM sales WHERE establishmentId = ? ORDER BY date DESC',
				[establishmentId]
			);
			const sales = (res.values ?? []) as unknown as Sale[];
			
			console.log(`📦 SQLite: ${sales.length} vendas encontradas`);
			
			// Load items e mapear corretamente os campos
			for (const s of sales) {
				console.log(`🔍 SQLite: Buscando itens para venda ${s.id}...`);
				const itemsRes = await this.db.query('SELECT * FROM sale_items WHERE sale_id = ? ORDER BY rowid ASC', [s.id]);
				const rawItems = (itemsRes.values ?? []) as any[];
				
				console.log(`📦 SQLite: Venda ${s.id} → ${rawItems.length} itens no banco`);
				
				// Mapear snake_case para camelCase, incluindo o ID do item
				s.items = rawItems.map((item: any) => {
					const mapped = {
						id: item.id, // Incluir o ID do sale_item
						productId: item.productId || item.product_id,
						productName: item.productName || item.product_name,
						quantity: item.quantity,
						price: item.price,
						purchasePrice: item.purchasePrice || item.purchase_price
					};
					console.log(`  - Item ${mapped.id}: ${mapped.productName} (qty: ${mapped.quantity}, price: ${mapped.price})`);
					return mapped;
				});
				
				console.log(`✅ SQLite: Venda ${s.id} com ${s.items.length} itens mapeados`);
			}
			
			console.log(`✅ SQLite: ${sales.length} vendas carregadas no total`);
			return sales;
		} catch (error) {
			console.error('❌ SQLite: Erro ao carregar vendas:', error);
			return [];
		}
	}
	async addSale(sale: Sale): Promise<void> {
		if (!this.db) return;
		
		// 🆕 OBTER establishmentId DA VENDA OU DO USUÁRIO
		const establishmentId = (sale as any).establishmentId || await getUserEstablishmentId();
		
		console.log('💾 SQLite: Salvando venda:', sale.id);
		console.log('🏢 SQLite: establishmentId:', establishmentId);
		
		await this.db.execute('BEGIN');
		try {
			await this.db.run(
				`INSERT OR REPLACE INTO sales
				(id,date,dueDate,total,profit,type,clientId,clientName,observations,externalReference,paymentMethod,status,establishmentId)
				VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
				[
					sale.id, sale.date, sale.dueDate ?? null, sale.total, sale.profit ?? null, sale.type,
					sale.clientId ?? null, sale.clientName ?? null, sale.observations ?? null,
					sale.externalReference ?? null, sale.paymentMethod ?? null, sale.status,
					establishmentId
				]
			);
			if (sale.items?.length) {
				for (let i = 0; i < sale.items.length; i++) {
					const it = sale.items[i];
					// Usar o ID do item se existir, caso contrário gerar um UUID
					const itemId = it.id || this.generateUuid();
					console.log(`💾 SQLite: Salvando sale_item ${i}: id=${itemId}`);
					await this.db.run(
						`INSERT OR REPLACE INTO sale_items
						(id, sale_id, productId, productName, quantity, price, purchasePrice)
						VALUES (?,?,?,?,?,?,?)`,
						[itemId, sale.id, it.productId, it.productName, it.quantity, it.price, it.purchasePrice]
					);
				}
			}
			await this.db.execute('COMMIT');
			await this.saveToStore();
			console.log('✅ SQLite: Venda salva e commitada');
		} catch (e) {
			await this.db.execute('ROLLBACK');
			console.error('❌ Erro ao salvar venda no SQLite:', e);
			throw e;
		}
	}

	async getTransactions(): Promise<FinancialTransaction[]> {
		if (!this.db) return [];
		
		// 🆕 OBTER establishment_id DO USUÁRIO
		const establishmentId = await getUserEstablishmentId();
		if (!establishmentId) {
			console.warn('⚠️ SQLite getTransactions: Usuário sem establishment_id, retornando array vazio');
			return [];
		}
		
		console.log('📦 SQLite: Carregando transações...');
		console.log('🔒 SQLite: Filtrando por establishmentId:', establishmentId);
		
		// 🆕 FILTRAR POR establishmentId
		const res = await this.db.query(
			'SELECT * FROM financial_transactions WHERE establishmentId = ? ORDER BY date DESC',
			[establishmentId]
		);
		const transactions = (res.values ?? []) as unknown as FinancialTransaction[];
		console.log(`✅ SQLite: ${transactions.length} transações carregadas (filtradas por establishmentId)`);
		return transactions;
	}
	async addTransaction(tx: FinancialTransaction): Promise<void> {
		if (!this.db) return;
		try {
			// 🆕 OBTER establishmentId DA TRANSAÇÃO OU DO USUÁRIO
			const establishmentId = (tx as any).establishmentId || await getUserEstablishmentId();
			
			console.log('💾 SQLite: Salvando transação:', tx.id);
			console.log('🏢 SQLite: establishmentId:', establishmentId);
			
			await this.db.run(
				`INSERT OR REPLACE INTO financial_transactions (id,type,description,amount,date,category,establishmentId)
				 VALUES (?,?,?,?,?,?,?)`,
			 [tx.id, tx.type, tx.description, tx.amount, tx.date, tx.category ?? null, establishmentId]
			);
			await this.saveToStore();
			console.log('✅ SQLite: Transação salva e commitada');
		} catch (error) {
			console.error('❌ Erro ao salvar transação no SQLite:', error);
			throw error;
		}
	}

	async getEstablishment(): Promise<Establishment | null> {
		if (!this.db) return null;
		const res = await this.db.query('SELECT * FROM establishments LIMIT 1');
		const row = (res.values ?? [])[0] as any;
		return row ? (row as Establishment) : null;
	}
	async upsertEstablishment(est: Establishment): Promise<void> {
		if (!this.db) return;
		await this.db.run(
			`INSERT OR REPLACE INTO establishments (id,name,document,phone,address,updatedAt)
			 VALUES (?,?,?,?,?,?)`,
			[est.id, est.name, est.document ?? null, est.phone ?? null, est.address ?? null, est.updatedAt]
		);
	}

	async clearAll(): Promise<void> {
		if (!this.db) {
			console.warn('⚠️ SQLite: DB não inicializado, não é possível limpar dados');
			return;
		}
		try {
			console.log('🗑️ SQLite: Iniciando limpeza completa de dados...');
			await this.db.execute('BEGIN');
			
			// Deletar todos os dados de todas as tabelas
			await this.db.run('DELETE FROM sale_items');
			await this.db.run('DELETE FROM sales');
			await this.db.run('DELETE FROM products');
			await this.db.run('DELETE FROM clients');
			await this.db.run('DELETE FROM financial_transactions');
			await this.db.run('DELETE FROM establishments');
			
			await this.db.execute('COMMIT');
			await this.saveToStore();
			
			console.log('✅ SQLite: Todos os dados foram limpos com sucesso');
		} catch (error) {
			if (this.db) {
				await this.db.execute('ROLLBACK');
			}
			console.error('❌ SQLite: Erro ao limpar dados:', error);
			throw error;
		}
	}
}


