import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { ArrowPathIcon, MagnifyingGlassIcon, CalendarIcon, XMarkIcon, ChevronLeftIcon } from '../components/Icons';

interface StockEntry {
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    type: 'entry' | 'exit';
    date: string;
    reason?: string;
}

const StockEntriesHistoryPage: React.FC = () => {
    const { products } = useData();
    const navigate = useNavigate();
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    // Simular histórico de entradas (em produção, isso viria do backend)
    const stockEntries = useMemo((): StockEntry[] => {
        // Por enquanto, vamos simular entradas baseadas na data de criação dos produtos
        return products.map(product => ({
            id: `entry-${product.id}`,
            productId: product.id,
            productName: product.name,
            quantity: product.quantity,
            type: 'entry' as const,
            date: product.createdAt,
            reason: 'Cadastro inicial'
        }));
    }, [products]);

    // Filtrar entradas
    const filteredEntries = useMemo(() => {
        let filtered = [...stockEntries];

        // Filtro de busca
        if (searchTerm) {
            filtered = filtered.filter(entry =>
                entry.productName.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filtro de data
        if (startDate) {
            filtered = filtered.filter(entry => new Date(entry.date) >= new Date(startDate));
        }
        if (endDate) {
            filtered = filtered.filter(entry => new Date(entry.date) <= new Date(endDate));
        }

        return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [stockEntries, searchTerm, startDate, endDate]);

    // Paginação
    const totalPages = Math.ceil(filteredEntries.length / itemsPerPage);
    const paginatedEntries = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredEntries.slice(start, start + itemsPerPage);
    }, [filteredEntries, currentPage]);

    // Estatísticas
    const stats = useMemo(() => {
        const total = filteredEntries.reduce((sum, entry) => sum + entry.quantity, 0);
        return {
            count: filteredEntries.length,
            total
        };
    }, [filteredEntries]);

    const clearFilters = () => {
        setSearchTerm('');
        setStartDate('');
        setEndDate('');
        setCurrentPage(1);
    };

    return (
        <div className="space-y-4">
            {/* Back Button + Header */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => navigate('/stock-control')}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Voltar"
                >
                    <ChevronLeftIcon className="h-6 w-6" />
                </button>
                <ArrowPathIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                <h1 className="text-2xl font-bold">Histórico de Entradas</h1>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Total de Entradas</p>
                    <p className="text-xl font-bold mt-1">{stats.count}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Itens Adicionados</p>
                    <p className="text-xl font-bold mt-1 text-green-600">{stats.total}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5 text-gray-500" />
                        <h3 className="font-semibold">Filtros</h3>
                    </div>
                    {(searchTerm || startDate || endDate) && (
                        <button
                            onClick={clearFilters}
                            className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 flex items-center gap-1"
                        >
                            <XMarkIcon className="h-4 w-4" />
                            Limpar
                        </button>
                    )}
                </div>

                {/* Search */}
                <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                    </span>
                    <input
                        type="text"
                        placeholder="Buscar por produto..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-2 pl-10 border rounded-lg bg-white text-gray-900 dark:text-white dark:bg-gray-700 dark:border-gray-600"
                    />
                </div>

                {/* Date Filters */}
                <div className="grid grid-cols-2 gap-2">
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        placeholder="Data Início"
                        className="p-2 border rounded-lg bg-white text-gray-900 dark:text-white dark:bg-gray-700 dark:border-gray-600"
                    />
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        placeholder="Data Fim"
                        className="p-2 border rounded-lg bg-white text-gray-900 dark:text-white dark:bg-gray-700 dark:border-gray-600"
                    />
                </div>
            </div>

            {/* Entries Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-4 py-3">Data</th>
                                <th scope="col" className="px-4 py-3">Produto</th>
                                <th scope="col" className="px-4 py-3 text-center">Quantidade</th>
                                <th scope="col" className="px-4 py-3">Motivo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedEntries.length > 0 ? (
                                paginatedEntries.map(entry => (
                                    <tr key={entry.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-4 py-3">{new Date(entry.date).toLocaleDateString('pt-PT')}</td>
                                        <td className="px-4 py-3 font-medium">{entry.productName}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded font-bold">
                                                +{entry.quantity}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{entry.reason || '-'}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                                        Nenhuma entrada encontrada
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700 border-t dark:border-gray-600">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 text-sm font-medium rounded bg-white dark:bg-gray-800 border dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-600"
                        >
                            ← Anterior
                        </button>
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                            Página {currentPage} de {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 text-sm font-medium rounded bg-white dark:bg-gray-800 border dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-600"
                        >
                            Próxima →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StockEntriesHistoryPage;
