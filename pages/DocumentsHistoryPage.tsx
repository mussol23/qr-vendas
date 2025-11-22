import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { DocumentTextIcon, MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from '../components/Icons';

const DocumentsHistoryPage: React.FC = () => {
    const { sales } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [minValue, setMinValue] = useState('');
    const [maxValue, setMaxValue] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    // Filtrar documentos
    const filteredDocuments = useMemo(() => {
        let filtered = [...sales];

        // Filtro de busca (ID ou cliente)
        if (searchTerm) {
            filtered = filtered.filter(sale =>
                sale.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                sale.clientName?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filtro de tipo
        if (typeFilter !== 'all') {
            filtered = filtered.filter(sale => sale.type === typeFilter);
        }

        // Filtro de data
        if (startDate) {
            filtered = filtered.filter(sale => new Date(sale.date) >= new Date(startDate));
        }
        if (endDate) {
            filtered = filtered.filter(sale => new Date(sale.date) <= new Date(endDate));
        }

        // Filtro de valor
        if (minValue) {
            filtered = filtered.filter(sale => sale.total >= parseFloat(minValue));
        }
        if (maxValue) {
            filtered = filtered.filter(sale => sale.total <= parseFloat(maxValue));
        }

        return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [sales, searchTerm, typeFilter, startDate, endDate, minValue, maxValue]);

    // Paginação
    const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);
    const paginatedDocuments = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredDocuments.slice(start, start + itemsPerPage);
    }, [filteredDocuments, currentPage]);

    // Estatísticas
    const stats = useMemo(() => {
        const total = filteredDocuments.reduce((sum, sale) => sum + sale.total, 0);
        const max = filteredDocuments.length > 0 ? Math.max(...filteredDocuments.map(s => s.total)) : 0;
        const min = filteredDocuments.length > 0 ? Math.min(...filteredDocuments.map(s => s.total)) : 0;
        return {
            count: filteredDocuments.length,
            total,
            max,
            min
        };
    }, [filteredDocuments]);

    const clearFilters = () => {
        setSearchTerm('');
        setTypeFilter('all');
        setStartDate('');
        setEndDate('');
        setMinValue('');
        setMaxValue('');
        setCurrentPage(1);
    };

    const formatCurrency = (value: number) => {
        return value.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });
    };

    const getTypeBadge = (type: string) => {
        const badges = {
            invoice: { label: 'Fatura', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
            receipt: { label: 'Recibo', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
            'invoice-receipt': { label: 'Fatura/Recibo', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' }
        };
        const badge = badges[type as keyof typeof badges] || badges.invoice;
        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge.color}`}>
                {badge.label}
            </span>
        );
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2">
                <DocumentTextIcon className="h-6 w-6 text-brand-600 dark:text-brand-400" />
                <h1 className="text-2xl font-bold">Histórico de Documentos</h1>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Total de Docs</p>
                    <p className="text-xl font-bold mt-1">{stats.count}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Valor Total</p>
                    <p className="text-sm sm:text-base font-bold mt-1">{formatCurrency(stats.total)}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Maior Valor</p>
                    <p className="text-sm sm:text-base font-bold mt-1">{formatCurrency(stats.max)}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Menor Valor</p>
                    <p className="text-sm sm:text-base font-bold mt-1">{formatCurrency(stats.min)}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <FunnelIcon className="h-5 w-5 text-gray-500" />
                        <h3 className="font-semibold">Filtros</h3>
                    </div>
                    {(searchTerm || typeFilter !== 'all' || startDate || endDate || minValue || maxValue) && (
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
                        placeholder="Buscar por ID ou cliente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-2 pl-10 border rounded-lg bg-white text-gray-900 dark:text-white dark:bg-gray-700 dark:border-gray-600"
                    />
                </div>

                {/* Type and Date Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="p-2 border rounded-lg bg-white text-gray-900 dark:text-white dark:bg-gray-700 dark:border-gray-600"
                    >
                        <option value="all">Todos os Tipos</option>
                        <option value="invoice">Fatura</option>
                        <option value="receipt">Recibo</option>
                        <option value="invoice-receipt">Fatura/Recibo</option>
                    </select>
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

                {/* Value Filters */}
                <div className="grid grid-cols-2 gap-2">
                    <input
                        type="number"
                        value={minValue}
                        onChange={(e) => setMinValue(e.target.value)}
                        placeholder="Valor Mínimo"
                        className="p-2 border rounded-lg bg-white text-gray-900 dark:text-white dark:bg-gray-700 dark:border-gray-600"
                    />
                    <input
                        type="number"
                        value={maxValue}
                        onChange={(e) => setMaxValue(e.target.value)}
                        placeholder="Valor Máximo"
                        className="p-2 border rounded-lg bg-white text-gray-900 dark:text-white dark:bg-gray-700 dark:border-gray-600"
                    />
                </div>
            </div>

            {/* Documents Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-4 py-3">ID</th>
                                <th scope="col" className="px-4 py-3">Tipo</th>
                                <th scope="col" className="px-4 py-3">Data</th>
                                <th scope="col" className="px-4 py-3">Cliente</th>
                                <th scope="col" className="px-4 py-3 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedDocuments.length > 0 ? (
                                paginatedDocuments.map(sale => (
                                    <tr key={sale.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-4 py-3 font-mono text-xs">{sale.id.substring(0, 8)}...</td>
                                        <td className="px-4 py-3">{getTypeBadge(sale.type)}</td>
                                        <td className="px-4 py-3">{new Date(sale.date).toLocaleDateString('pt-PT')}</td>
                                        <td className="px-4 py-3">{sale.clientName || '-'}</td>
                                        <td className="px-4 py-3 font-medium text-right">{formatCurrency(sale.total)}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                        Nenhum documento encontrado
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

export default DocumentsHistoryPage;
