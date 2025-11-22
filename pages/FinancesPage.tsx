import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { FinancialTransaction } from '../types';
import { PlusIcon, BanknotesIcon, TrendingUpIcon, TrendingDownIcon, ScaleIcon, MagnifyingGlassIcon, CalendarDaysIcon } from '../components/Icons';

const TransactionFormModal = ({ onClose }: { onClose: () => void }) => {
    const { addTransaction } = useData();
    const [type, setType] = useState<'revenue' | 'expense'>('expense');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [category, setCategory] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const parsedAmount = parseFloat(amount);
        if (!description || isNaN(parsedAmount) || parsedAmount <= 0) {
            alert("Por favor, preencha os campos corretamente.");
            return;
        }
        addTransaction({ type, description, amount: parsedAmount, date: new Date(date).toISOString(), category });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4">Adicionar Transação</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de Transação</label>
                        <select value={type} onChange={(e) => setType(e.target.value as any)} className="mt-1 block w-full p-2 border rounded bg-white text-gray-900 dark:text-white dark:bg-gray-700 dark:border-gray-600">
                            <option value="expense">Despesa</option>
                            <option value="revenue">Receita</option>
                        </select>
                    </div>
                    <input type="text" placeholder="Descrição" value={description} onChange={e => setDescription(e.target.value)} required className="w-full p-2 border rounded bg-white text-gray-900 dark:text-white dark:bg-gray-700 dark:border-gray-600"/>
                    <input type="number" step="0.01" placeholder="Valor (AOA)" value={amount} onChange={e => setAmount(e.target.value)} required className="w-full p-2 border rounded bg-white text-gray-900 dark:text-white dark:bg-gray-700 dark:border-gray-600"/>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="w-full p-2 border rounded bg-white text-gray-900 dark:text-white dark:bg-gray-700 dark:border-gray-600"/>
                    <input type="text" placeholder="Categoria (Opcional)" value={category} onChange={e => setCategory(e.target.value)} className="w-full p-2 border rounded bg-white text-gray-900 dark:text-white dark:bg-gray-700 dark:border-gray-600"/>
                    <div className="flex justify-end space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const FilterModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onApply: (filters: { startDate: string, endDate: string }) => void;
}> = ({ isOpen, onClose, onApply }) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    if (!isOpen) return null;

    const handleApply = () => {
        onApply({ startDate, endDate });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 transition-opacity duration-300" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold p-4 border-b dark:border-gray-700">Filtrar por Data</h2>
                <div className="p-4 space-y-4">
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="text-sm font-medium">De</label>
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 w-full p-2 border rounded bg-white text-gray-900 dark:text-white dark:bg-gray-700 dark:border-gray-600"/>
                        </div>
                        <div className="flex-1">
                             <label className="text-sm font-medium">Até</label>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 w-full p-2 border rounded bg-white text-gray-900 dark:text-white dark:bg-gray-700 dark:border-gray-600"/>
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 flex justify-end gap-2 rounded-b-lg">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg">Cancelar</button>
                    <button onClick={handleApply} className="px-4 py-2 bg-brand-600 text-white rounded-lg">Aplicar Filtro</button>
                </div>
            </div>
            <style>{`
                @keyframes fade-in-scale {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in-scale { animation: fade-in-scale 0.3s forwards cubic-bezier(0.16, 1, 0.3, 1); }
            `}</style>
        </div>
    );
}

const FinancesPage: React.FC = () => {
    const { sales, transactions } = useData();
    const [isFormOpen, setFormOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isFilterModalOpen, setFilterModalOpen] = useState(false);
    const [dateFilter, setDateFilter] = useState<{ startDate: string, endDate: string }>({ startDate: '', endDate: '' });

    const formatCurrency = (value: number) => value.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });

    const allTransactions = useMemo(() => {
        const salesAsTransactions: FinancialTransaction[] = sales.map(sale => ({
            id: `sale-${sale.id}`,
            type: 'revenue',
            description: `Venda - ${sale.id}`,
            amount: sale.total,
            date: sale.date,
            category: 'Vendas'
        }));
        return [...salesAsTransactions, ...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [sales, transactions]);

    const filteredTransactions = useMemo(() => {
        let filtered = allTransactions;

        if (searchTerm) {
            filtered = filtered.filter(t => t.description.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        if (dateFilter.startDate) {
            const startDate = new Date(dateFilter.startDate);
            startDate.setHours(0, 0, 0, 0);
            filtered = filtered.filter(t => new Date(t.date) >= startDate);
        }

        if (dateFilter.endDate) {
            const endDate = new Date(dateFilter.endDate);
            endDate.setHours(23, 59, 59, 999);
            filtered = filtered.filter(t => new Date(t.date) <= endDate);
        }
        
        return filtered;
    }, [allTransactions, searchTerm, dateFilter]);

    const totalRevenue = useMemo(() => filteredTransactions.filter(t => t.type === 'revenue').reduce((sum, t) => sum + t.amount, 0), [filteredTransactions]);
    const totalExpenses = useMemo(() => filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0), [filteredTransactions]);
    const netBalance = totalRevenue - totalExpenses;


    return (
        <div className="relative space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                <div className="bg-white dark:bg-gray-800 p-2 sm:p-3 rounded-lg shadow">
                    <TrendingUpIcon className="h-5 w-5 mx-auto text-green-500" />
                    <p className="text-xs sm:text-sm font-semibold mt-1 text-gray-500 dark:text-gray-400">Receitas</p>
                    <p className="text-sm sm:text-lg font-bold">{formatCurrency(totalRevenue)}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-2 sm:p-3 rounded-lg shadow">
                    <TrendingDownIcon className="h-5 w-5 mx-auto text-red-500" />
                    <p className="text-xs sm:text-sm font-semibold mt-1 text-gray-500 dark:text-gray-400">Despesas</p>
                    <p className="text-sm sm:text-lg font-bold">{formatCurrency(totalExpenses)}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-2 sm:p-3 rounded-lg shadow">
                    <ScaleIcon className="h-5 w-5 mx-auto text-blue-500" />
                    <p className="text-xs sm:text-sm font-semibold mt-1 text-gray-500 dark:text-gray-400">Saldo</p>
                    <p className={`text-sm sm:text-lg font-bold ${netBalance >= 0 ? 'text-gray-800 dark:text-gray-100' : 'text-orange-500'}`}>{formatCurrency(netBalance)}</p>
                </div>
            </div>

            {/* Transactions List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                 <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-4">
                    <h3 className="font-bold text-lg">Histórico de Transações</h3>
                     <div className="flex gap-2 items-center">
                        <div className="relative flex-1">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                            </span>
                            <input
                                type="text"
                                placeholder="Pesquisar por descrição..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full p-2 pl-10 border rounded-lg bg-white text-gray-900 dark:text-white dark:bg-gray-700 dark:border-gray-600 focus:ring-brand-500 focus:border-brand-500"
                            />
                        </div>
                        <button onClick={() => setFilterModalOpen(true)} className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                            <CalendarDaysIcon className="h-6 w-6"/>
                        </button>
                    </div>
                </div>
                
                <ul className="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
                    {filteredTransactions.length > 0 ? filteredTransactions.map(t => (
                        <li key={t.id} className="p-4 flex justify-between items-center">
                            <div>
                                <p className="font-semibold">{t.description}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(t.date).toLocaleDateString('pt-AO')} - <span className="text-xs italic">{t.category}</span></p>
                            </div>
                            <p className={`font-bold ${t.type === 'revenue' ? 'text-green-600' : 'text-red-500'}`}>
                                {t.type === 'expense' ? '-' : ''}{formatCurrency(t.amount)}
                            </p>
                        </li>
                    )) : (
                        <p className="text-center text-gray-500 py-8">Nenhuma transação encontrada.</p>
                    )}
                </ul>
            </div>
            
             <div className="fixed bottom-20 right-4 z-20">
                <button onClick={() => setFormOpen(true)} className="bg-brand-600 text-white p-4 rounded-full shadow-lg hover:bg-brand-700 transition-transform transform hover:scale-110">
                    <PlusIcon />
                </button>
            </div>
            
            {isFormOpen && <TransactionFormModal onClose={() => setFormOpen(false)} />}
            <FilterModal isOpen={isFilterModalOpen} onClose={() => setFilterModalOpen(false)} onApply={setDateFilter} />
        </div>
    );
}

export default FinancesPage;