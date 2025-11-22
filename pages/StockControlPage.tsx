import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { MagnifyingGlassIcon, CubeIcon, ArrowPathIcon, XCircleIcon } from '../components/Icons';

const StockControlPage: React.FC = () => {
    const { products, updateStock, sales } = useData();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [editingQuantities, setEditingQuantities] = useState<Record<string, string>>({});
    const [showLowStockOnly, setShowLowStockOnly] = useState(false);

    const handleQuantityChange = (productId: string, value: string) => {
        setEditingQuantities(prev => ({ ...prev, [productId]: value }));
    };

    const handleSaveStock = (productId: string) => {
        const newQuantity = parseInt(editingQuantities[productId], 10);
        if (!isNaN(newQuantity) && newQuantity >= 0) {
            updateStock(productId, newQuantity);
            // Remove from editing state after saving
            const newEditing = { ...editingQuantities };
            delete newEditing[productId];
            setEditingQuantities(newEditing);
        } else {
            alert('Por favor, insira um número válido.');
        }
    };

    const filteredProducts = useMemo(() => {
        let filtered = products.filter(product =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        // Filtrar apenas estoque baixo se ativado
        if (showLowStockOnly) {
            filtered = filtered.filter(p => p.quantity < 10);
        }

        return filtered.sort((a, b) => a.quantity - b.quantity); // Sort by quantity ascending
    }, [products, searchTerm, showLowStockOnly]);

    const lowStockCount = useMemo(() => products.filter(p => p.quantity < 10).length, [products]);

    const totalStockValue = useMemo(() =>
        products.reduce((sum, p) => sum + (p.purchasePrice * p.quantity), 0),
        [products]
    );

    const { itemsAddedToday, valueAddedToday } = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const productsAddedToday = products.filter(p => p.createdAt.split('T')[0] === today);

        const itemsAdded = productsAddedToday.reduce((sum, p) => sum + p.quantity, 0);
        const valueAdded = productsAddedToday.reduce((sum, p) => sum + (p.purchasePrice * p.quantity), 0);

        return { itemsAddedToday: itemsAdded, valueAddedToday: valueAdded };
    }, [products]);

    // Calcular saídas de hoje (baseado em vendas)
    const { itemsExitedToday } = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const salesToday = sales.filter(sale => sale.date.split('T')[0] === today);

        const itemsExited = salesToday.reduce((sum, sale) => {
            const saleItems = sale.items?.reduce((itemSum, item) => itemSum + item.quantity, 0) || 0;
            return sum + saleItems;
        }, 0);

        return { itemsExitedToday: itemsExited };
    }, [sales]);

    const formatCurrency = (value: number) => value.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                {/* Card 1: Entradas Hoje - Clicável */}
                <button
                    onClick={() => navigate('/stock-control/entries')}
                    className="bg-white dark:bg-gray-800 p-2 sm:p-3 rounded-lg shadow flex flex-col justify-center hover:shadow-md transition-shadow"
                >
                    <div className="flex items-center justify-center gap-1">
                        <ArrowPathIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                        <p className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400">Entradas</p>
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-gray-400 dark:text-gray-500">Hoje</p>
                    <p className="text-base sm:text-xl font-bold mt-1">{itemsAddedToday} <span className="text-xs sm:text-sm font-normal">itens</span></p>
                    <p className="text-xs sm:text-sm font-semibold text-green-600 mt-1">{formatCurrency(valueAddedToday)}</p>
                    <p className="text-xs text-brand-600 dark:text-brand-400 mt-1">Ver histórico →</p>
                </button>

                {/* Card 2: Saídas Hoje - Clicável */}
                <button
                    onClick={() => navigate('/stock-control/exits')}
                    className="bg-white dark:bg-gray-800 p-2 sm:p-3 rounded-lg shadow flex flex-col justify-center hover:shadow-md transition-shadow"
                >
                    <div className="flex items-center justify-center gap-1">
                        <ArrowPathIcon className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 rotate-180" />
                        <p className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400">Saídas</p>
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-gray-400 dark:text-gray-500">Hoje</p>
                    <p className="text-base sm:text-xl font-bold mt-1">{itemsExitedToday} <span className="text-xs sm:text-sm font-normal">itens</span></p>
                    <p className="text-xs text-brand-600 dark:text-brand-400 mt-2">Ver histórico →</p>
                </button>

                {/* Card 3: Stock Baixo - Clicável (filtra produtos) */}
                <button
                    onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                    className={`p-2 sm:p-3 rounded-lg shadow flex flex-col justify-center transition-all ${showLowStockOnly
                        ? 'bg-red-100 dark:bg-red-900/30 ring-2 ring-red-500'
                        : 'bg-white dark:bg-gray-800 hover:shadow-md'
                        }`}
                >
                    <div className="flex items-center justify-center gap-1">
                        <XCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                        <p className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400">Stock Baixo</p>
                    </div>
                    <p className="text-base sm:text-2xl font-bold text-red-500 mt-1">{lowStockCount}</p>
                    <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">produtos</p>
                    <p className="text-xs text-brand-600 dark:text-brand-400 mt-1">
                        {showLowStockOnly ? '✓ Filtrando' : 'Clique para filtrar'}
                    </p>
                </button>
            </div>

            {/* Info sobre valor total */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CubeIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">Valor Total em Estoque:</span>
                    </div>
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatCurrency(totalStockValue)}</span>
                </div>
            </div>

            {/* Indicador de filtro ativo */}
            {showLowStockOnly && (
                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800 flex items-center justify-between">
                    <span className="text-sm font-medium text-red-900 dark:text-red-100">
                        🔍 Mostrando apenas produtos com estoque baixo ({lowStockCount})
                    </span>
                    <button
                        onClick={() => setShowLowStockOnly(false)}
                        className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 font-medium"
                    >
                        Limpar filtro
                    </button>
                </div>
            )}

            <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </span>
                <input
                    type="text"
                    placeholder="Pesquisar por nome..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-2 pl-10 border rounded-lg bg-white text-gray-900 dark:text-white dark:bg-gray-800 dark:border-gray-600 focus:ring-brand-500 focus:border-brand-500"
                />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-6 py-3">Produto</th>
                                <th scope="col" className="px-6 py-3 text-center">Stock Atual</th>
                                <th scope="col" className="px-6 py-3">Novo Stock</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.map(product => (
                                <tr key={product.id} className={`border-b dark:border-gray-700 ${product.quantity < 10 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-white dark:bg-gray-800'}`}>
                                    <td className="px-6 py-4 font-medium">{product.name}</td>
                                    <td className="px-6 py-4 text-center font-bold">{product.quantity}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                value={editingQuantities[product.id] ?? product.quantity}
                                                onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                                                className="w-24 p-1 border rounded text-center bg-white text-gray-900 dark:text-white dark:bg-gray-700 dark:border-gray-600"
                                                onFocus={(e) => e.target.select()}
                                            />
                                            <button
                                                onClick={() => handleSaveStock(product.id)}
                                                className="px-3 py-1 bg-brand-600 text-white rounded text-xs font-semibold disabled:bg-gray-400 dark:disabled:bg-gray-600 transition-colors"
                                                disabled={editingQuantities[product.id] === undefined || editingQuantities[product.id] === String(product.quantity)}
                                            >
                                                Salvar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredProducts.length === 0 && (
                        <div className="text-center py-10 text-gray-500">
                            <CubeIcon className="h-12 w-12 mx-auto text-gray-400" />
                            <p className="mt-2">Nenhum produto encontrado.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StockControlPage;
