
export interface Product {
  id: string;
  name: string;
  price: number;
  purchasePrice: number;
  unit?: string;
  category: string;
  quantity: number;
  qrCode: string;
  createdAt: string;
  updatedAt: string;
  image?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  address: string;
  nif: string;
  createdAt: string;
  updatedAt: string;
}

export interface Sale {
  id: string;
  number?: string;
  date: string;
  dueDate?: string;
  total: number;
  profit?: number;
  type: 'receipt' | 'invoice' | 'invoice-receipt';
  clientId?: string;
  clientName?: string;
  items: {
    id?: string; // UUID do sale_item (gerado ao criar a venda)
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    purchasePrice: number;
  }[];
  observations?: string;
  externalReference?: string;
  paymentMethod?: string;
  status: 'pending' | 'paid';
}

export interface FinancialTransaction {
  id: string;
  type: 'revenue' | 'expense';
  description: string;
  amount: number;
  date: string;
  category?: string;
}

export interface Establishment {
  id: string;
  name: string;
  document?: string;
  phone?: string;
  address?: string;
  updatedAt: string;
}

export interface Employee {
  id: string;
  user_id?: string;
  establishment_id: string;
  full_name: string;
  email?: string;
  phone?: string;
  role: 'operator' | 'manager' | 'owner';
  active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface UserPermissions {
  canAccessPOS: boolean;
  canAccessProducts: boolean;
  canAccessClients: boolean;
  canAccessDocuments: boolean;
  canAccessReports: boolean;
  canAccessFinances: boolean;
  canAccessStockControl: boolean;
  canAccessSettings: boolean;
  canManageEmployees: boolean;
  canManageStore: boolean;
  isSuperAdmin: boolean;
}

export interface DataContextType {
  products: Product[];
  sales: Sale[];
  cart: CartItem[];
  clients: Client[];
  transactions: FinancialTransaction[];
  isLoaded: boolean;
  addProduct: (product: Omit<Product, 'id' | 'qrCode' | 'createdAt' | 'updatedAt'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  addClient: (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => Client;
  updateClient: (client: Client) => void;
  deleteClient: (clientId: string) => void;
  updateStock: (productId: string, newQuantity: number) => void;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  checkout: (clientId?: string, paymentMethod?: string) => Sale | undefined;
  createDocument: (docData: {
    items: { product: Product; quantity: number }[];
    clientId: string;
    dueDate?: string;
    type: Sale['type'];
    observations?: string;
    externalReference?: string;
    paymentMethod?: string;
  }) => Sale | undefined;
  addTransaction: (transaction: Omit<FinancialTransaction, 'id'>) => void;
  isSyncing: boolean;
  syncNow?: () => void;
}
