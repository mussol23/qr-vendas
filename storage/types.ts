import type { Product, Client, Sale, FinancialTransaction, Establishment } from '../types';

export interface StorageProvider {
	init(): Promise<void>;

	// Products
	getProducts(): Promise<Product[]>;
	upsertProduct(product: Product): Promise<void>;
	deleteProduct(productId: string): Promise<void>;

	// Clients
	getClients(): Promise<Client[]>;
	upsertClient(client: Client): Promise<void>;

	// Sales
	getSales(): Promise<Sale[]>;
	addSale(sale: Sale): Promise<void>;

	// Transactions
	getTransactions(): Promise<FinancialTransaction[]>;
	addTransaction(tx: FinancialTransaction): Promise<void>;

	// Establishment (single for current user/tenant)
	getEstablishment(): Promise<Establishment | null>;
	upsertEstablishment(est: Establishment): Promise<void>;

	// Clear all data (for logout)
	clearAll(): Promise<void>;
}


