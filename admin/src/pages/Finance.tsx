// src/pages/Finance.tsx
import { useEffect, useState, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { DataTable } from '../components/DataTable';
import { ActionsDropdown, ActionItem } from '../components/ActionsDropdown';
import toast, { Toaster } from 'react-hot-toast';

// Definir o tipo para os dados da transação
export type Transaction = {
  id: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  date: string;
  establishment_name: string;
};

// Componente para o menu de ações
const ActionsCell = ({ transaction }: { transaction: Transaction }) => {
    const transactionActions: ActionItem[] = [
        {
            label: 'Ver Detalhes',
            onClick: () => toast.success(`Visualizando transação ${transaction.id.substring(0,6)}`),
        },
        {
            label: 'Editar',
            onClick: () => toast('Funcionalidade de edição a ser implementada.'),
        },
        {
            label: 'Reembolsar',
            onClick: () => toast.error('Funcionalidade de reembolso a ser implementada.'),
            isDestructive: true,
        }
    ];

    return <ActionsDropdown items={transactionActions} />;
};

// Definição das colunas para a tabela de transações
export const columns: ColumnDef<Transaction>[] = [
  {
    accessorKey: 'type',
    header: 'Tipo',
    cell: ({ row }) => (
      <div className={`flex items-center gap-2 font-semibold ${row.original.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
        {row.original.type === 'income' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
        <span>{row.original.type === 'income' ? 'Receita' : 'Despesa'}</span>
      </div>
    ),
  },
  {
    accessorKey: 'description',
    header: 'Descrição',
  },
  {
    accessorKey: 'establishment_name',
    header: 'Estabelecimento',
  },
  {
    accessorKey: 'amount',
    header: 'Valor',
    cell: ({ row }) => (
      <div className={`font-mono text-right font-semibold ${row.original.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
        {row.original.type === 'income' ? '+' : '-'} €{row.original.amount.toFixed(2)}
      </div>
    )
  },
  {
    accessorKey: 'date',
    header: 'Data',
    cell: ({ row }) => new Date(row.original.date).toLocaleDateString('pt-BR'),
  },
  {
    id: 'actions',
    header: 'Ações',
    cell: ({ row }) => <ActionsCell transaction={row.original} />,
  },
];

const KpiCard = ({ title, value, colorClass, isLoading }: { title: string; value: string; colorClass: string; isLoading: boolean; }) => (
    <div className="bg-white dark:bg-gray-800/50 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2">{title}</h3>
        {isLoading ? 
            <div className="h-9 w-3/4 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-md" /> :
            <p className={`text-3xl font-bold ${colorClass}`}>{value}</p>
        }
    </div>
);


export default function Finance() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTransactions() {
      setLoading(true);
      const { data, error } = await supabase
        .from('financial_transactions')
        .select(`
          id,
          type,
          description,
          amount,
          date,
          establishments ( name )
        `)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching transactions:', error);
        setTransactions([]);
      } else if (data) {
        const formattedData = data.map(tx => ({
          ...tx,
          establishment_name: Array.isArray(tx.establishments) 
            ? tx.establishments[0]?.name || 'N/A' 
            : tx.establishments?.name || 'N/A',
        }));
        setTransactions(formattedData as Transaction[]);
      }
      setLoading(false);
    }

    fetchTransactions();
  }, []);

  const { totalIncome, totalExpenses, netProfit } = useMemo(() => {
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    const netProfit = totalIncome - totalExpenses;
    return { totalIncome, totalExpenses, netProfit };
  }, [transactions]);

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          💰 Análise Financeira
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Visão geral das receitas e despesas de todos os estabelecimentos.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard title="Receitas" value={`€${totalIncome.toFixed(2)}`} colorClass="text-green-600" isLoading={loading} />
        <KpiCard title="Despesas" value={`€${totalExpenses.toFixed(2)}`} colorClass="text-red-600" isLoading={loading} />
        <KpiCard title="Lucro" value={`€${netProfit.toFixed(2)}`} colorClass="text-blue-600" isLoading={loading} />
      </div>

      <div className="bg-white dark:bg-gray-800/50 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Histórico de Transações</h2>
        <DataTable columns={columns} data={transactions} isLoading={loading} exportingTableName="Transações Financeiras" />
      </div>
    </div>
  );
}
