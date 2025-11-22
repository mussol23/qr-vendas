// src/pages/Sales.tsx
import { useEffect, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { supabase } from '../lib/supabase';
import { DataTable } from '../components/DataTable';
import { ActionsDropdown, ActionItem } from '../components/ActionsDropdown';
import toast, { Toaster } from 'react-hot-toast';

// Definir o tipo para os dados de venda
export type Sale = {
  id: string;
  number: number | null;
  date: string;
  total: number;
  payment_method: string;
  status: string;
  client_name: string;
  establishment_name: string;
};

// Componente para o menu de ações
const ActionsCell = ({ sale }: { sale: Sale }) => {
    const saleActions: ActionItem[] = [
        {
            label: 'Ver Detalhes',
            onClick: () => toast.success(`Visualizando detalhes da venda #${sale.number || sale.id.substring(0,6)}`),
        },
        {
            label: 'Imprimir Recibo',
            onClick: () => toast('Funcionalidade de impressão a ser implementada.'),
        },
        {
            label: 'Cancelar Venda',
            onClick: () => {
                if(window.confirm(`Tem a certeza que quer cancelar a venda #${sale.number || sale.id.substring(0,6)}?`)) {
                    toast.error(`Cancelando venda (Demonstração)`);
                }
            },
            isDestructive: true,
        }
    ];

    return <ActionsDropdown items={saleActions} />;
};

// Definição das colunas para a tabela de vendas
export const columns: ColumnDef<Sale>[] = [
  {
    accessorKey: 'number',
    header: 'Nº Venda',
    cell: ({ row }) => <span className="font-mono text-xs">#{row.original.number || row.original.id.substring(0, 6)}</span>
  },
  {
    accessorKey: 'date',
    header: 'Data',
    cell: ({ row }) => new Date(row.original.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
  },
  {
    accessorKey: 'establishment_name',
    header: 'Estabelecimento',
    cell: ({ row }) => <div className="font-semibold">{row.original.establishment_name}</div>
  },
  {
    accessorKey: 'client_name',
    header: 'Cliente',
  },
  {
    accessorKey: 'total',
    header: 'Total',
    cell: ({ row }) => (
      <div className="font-mono text-right">
        {`€${row.original.total.toFixed(2)}`}
      </div>
    )
  },
  {
    accessorKey: 'payment_method',
    header: 'Pagamento',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
        row.original.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
        row.original.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      }`}>
        {row.original.status}
      </span>
    )
  },
  {
    id: 'actions',
    header: 'Ações',
    cell: ({ row }) => <ActionsCell sale={row.original} />,
  },
];

export default function Sales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSales() {
      setLoading(true);
      const { data, error } = await supabase
        .from('sales')
        .select(`
          id,
          number,
          date,
          total,
          payment_method,
          status,
          client_name,
          establishments ( name )
        `)
        .order('date', { ascending: false })
        .limit(1000); // Limitar para evitar sobrecarga inicial

      if (error) {
        console.error('Error fetching sales:', error);
        setSales([]);
      } else if (data) {
        const formattedData = data.map(sale => ({
          ...sale,
          establishment_name: Array.isArray(sale.establishments) 
            ? sale.establishments[0]?.name || 'N/A' 
            : sale.establishments?.name || 'N/A',
          client_name: sale.client_name || 'N/A',
        }));
        setSales(formattedData as Sale[]);
      }
      setLoading(false);
    }

    fetchSales();
  }, []);

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            📈 Vendas
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
            Vendas consolidadas de todos os estabelecimentos.
            </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800/50 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
        <DataTable columns={columns} data={sales} isLoading={loading} exportingTableName="Vendas" />
      </div>
    </div>
  );
}
