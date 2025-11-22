import type { Product, Client, FinancialTransaction, Sale } from '../types';

export const fromDbProduct = (row: any): Product => ({
	id: row.id,
	name: row.name,
	price: Number(row.price),
	purchasePrice: Number(row.purchase_price ?? row.purchasePrice ?? 0),
	category: row.category ?? '',
	quantity: Number(row.quantity ?? 0),
	qrCode: row.qr_code ?? row.qrCode ?? '',
	unit: row.unit ?? undefined,
	image: row.image_url ?? row.image ?? '',
	createdAt: row.created_at ?? row.createdAt,
	updatedAt: row.updated_at ?? row.updatedAt,
});

export const toDbProduct = (p: Product) => ({
	id: p.id,
	name: p.name,
	price: p.price,
	purchase_price: p.purchasePrice,
	category: p.category,
	quantity: p.quantity,
	qr_code: p.qrCode,
	unit: p.unit ?? null,
	image_url: p.image ?? null,
	created_at: p.createdAt,
	updated_at: p.updatedAt,
});

export const fromDbClient = (row: any): Client => ({
	id: row.id,
	name: row.name,
	phone: row.phone ?? '',
	address: row.address ?? '',
	nif: row.nif ?? '',
	createdAt: row.created_at ?? row.createdAt,
	updatedAt: row.updated_at ?? row.updatedAt,
});

export const toDbClient = (c: Client) => ({
	id: c.id,
	name: c.name,
	phone: c.phone,
	address: c.address,
	nif: c.nif,
	created_at: c.createdAt,
	updated_at: c.updatedAt,
});

export const fromDbTx = (row: any): FinancialTransaction => ({
	id: row.id,
	type: row.type,
	description: row.description,
	amount: Number(row.amount),
	date: row.date,
	category: row.category ?? undefined,
});

export const toDbTx = (t: FinancialTransaction) => ({
	id: t.id,
	type: t.type,
	description: t.description,
	amount: t.amount,
	date: t.date,
	category: t.category ?? null,
});

export const toDbSale = (s: Sale) => ({
	id: s.id,
	number: s.number ?? null,
	date: s.date,
	due_date: s.dueDate ?? null,
	total: s.total,
	profit: s.profit ?? null,
	type: s.type,
	client_id: s.clientId ?? null,
	observations: s.observations ?? null,
	external_reference: s.externalReference ?? null,
	payment_method: s.paymentMethod ?? null,
	status: s.status,
	// created_at / updated_at handled by DB defaults/triggers
});


