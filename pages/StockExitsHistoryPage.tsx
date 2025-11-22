import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { ArrowPathIcon, MagnifyingGlassIcon, CalendarIcon, XMarkIcon, ChevronLeftIcon } from '../components/Icons';

interface StockExit {
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    type: 'sale' | 'loss' | 'adjustment';
    date: string;
    reason?: string;
}

const StockExitsHistoryPage: React.FC = () => {
    const { sales } = useData();
    const navigate = useNavigate();
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    // Gerar histórico de saídas baseado nas vendas
    const stockExits = useMemo((): StockExit[] => {
        const exits: StockExit[] = [];

        sales.forEach(sale => {
            sale.items?.forEach(item => {
                exits.push({
                    id: `exit-${sale.id}-${item.productId}`,
                    productId: item.productId,
                    productName: item.productName,
                    quantity: item.quantity,
                    type: 'sale',
                    date: sale.date,
                    reason: `Venda #${sale.id.substring(0, 8)}`
                });
            });
        });

        return exits;
    }, [sales]);

    // Filtrar saídas
    const filteredExits = useMemo(() => {
        let filtered = [...stockExits];

        // Filtro de busca
        if (searchTerm) {
            filtered = filtered.filter(exit =>
                exit.productName.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filtro de data
        if (startDate) {
            filtered = filtered.filter(exit => new Date(exit.date) >= new Date(startDate));
        }
        if (endDate) {
            filtered = filtered.filter(exit => new Date(exit.date) <= new Date(endDate));
        }

        return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [stockExits, searchTerm, startDate, endDate]);

    // Paginação
    const totalPages = Math.ceil(filteredExits.length / itemsPerPage);
    const paginatedExits = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredExits.slice(start, start + itemsPerPage);
    }, [filteredExits, currentPage]);

    // Estatísticas
    const stats = useMemo(() => {
        const total = filteredExits.reduce((sum, exit) => sum + exit.quantity, 0);
        return {
            count: filteredExits.length,
            total
        };
    }, [filteredExits]);

    const clearFilters = () => {
        setSearchTerm('');
        setStartDate('');
        setEndDate('');
        setCurrentPage(1);
    };

    const getTypeBadge = (type: string) => {
        const badges = {
            sale: { label: 'Venda', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
            loss: { label: 'Perda', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
            adjustment: { label: 'Ajuste', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' }
        };
        const badge = badges[type as keyof typeof badges] || badges.sale;
        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge.color}`}>
                {badge.label}
            </span>
        );
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
                <ArrowPathIcon className="h-6 w-6 text-red-600 dark:text-red-400 rotate-180" />
                <h1 className="text-2xl font-bold">Histórico de Saídas</h1>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Total de Saídas</p>
                    <p className="text-xl font-bold mt-1">{stats.count}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Itens Removidos</p>
                    <p className="text-xl font-bold mt-1 text-red-600">{stats.total}</p>
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

            {/* Exits Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-4 py-3">Data</th>
                                <th scope="col" className="px-4 py-3">Produto</th>
                                <th scope="col" className="px-4 py-3 text-center">Quantidade</th>
                                <th scope="col" className="px-4 py-3">Tipo</th>
                                <th scope="col" className="px-4 py-3">Motivo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedExits.length > 0 ? (
                                paginatedExits.map(exit => (
                                    <tr key={exit.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-4 py-3">{new Date(exit.date).toLocaleDateString('pt-PT')}</td>
                                        <td className="px-4 py-3 font-medium">{exit.productName}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded font-bold">
                                                -{exit.quantity}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">{getTypeBadge(exit.type)}</td>
                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">{exit.reason || '-'}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                        Nenhuma saída encontrada
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

export default StockExitsHistoryPage;
