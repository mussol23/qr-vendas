// src/pages/Establishments.tsx
import { useEffect, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { supabase } from '../lib/supabase';
import { DataTable } from '../components/DataTable';
import { ActionsDropdown, ActionItem } from '../components/ActionsDropdown';
import toast, { Toaster } from 'react-hot-toast';

// Definir o tipo para os dados do estabelecimento
export type Establishment = {
  id: string;
  name: string;
  document: string | null;
  phone: string | null;
  active: boolean;
  created_at: string;
};

// Componente para o menu de ações
const ActionsCell = ({ establishment }: { establishment: Establishment }) => {
    const establishmentActions: ActionItem[] = [
        {
            label: 'Ver Painel',
            onClick: () => toast.success(`Navegando para o painel de ${establishment.name}`),
        },
        {
            label: 'Editar Dados',
            onClick: () => toast('Funcionalidade de edição a ser implementada.'),
        },
        {
            label: establishment.active ? 'Desativar' : 'Ativar',
            onClick: () => {
                const action = establishment.active ? 'Desativando' : 'Ativando';
                toast.success(`${action} ${establishment.name} (Demonstração)`);
            },
        },
        {
            label: 'Deletar',
            onClick: () => {
                if(window.confirm(`Tem a certeza que quer deletar o estabelecimento ${establishment.name}?`)) {
                    toast.error(`Deletando ${establishment.name} (Demonstração)`);
                }
            },
            isDestructive: true,
        }
    ];

    return <ActionsDropdown items={establishmentActions} />;
};

// Definição das colunas para a tabela de estabelecimentos
export const columns: ColumnDef<Establishment>[] = [
  {
    accessorKey: 'name',
    header: 'Nome do Estabelecimento',
    cell: ({ row }) => (
        <div className="font-bold text-gray-900 dark:text-white">{row.original.name}</div>
    ),
  },
  {
    accessorKey: 'document',
    header: 'Documento (NIF)',
  },
  {
    accessorKey: 'phone',
    header: 'Telefone',
  },
  {
    accessorKey: 'active',
    header: 'Status',
    cell: ({ row }) => (
      <span className={`px-3 py-1 text-xs font-medium rounded-full ${row.original.active 
        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
        {row.original.active ? 'Ativo' : 'Inativo'}
      </span>
    )
  },
  {
    accessorKey: 'created_at',
    header: 'Data de Criação',
    cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString('pt-BR'),
  },
  {
    id: 'actions',
    header: 'Ações',
    cell: ({ row }) => <ActionsCell establishment={row.original} />,
  },
];

export default function Establishments() {
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEstablishments() {
      setLoading(true);
      const { data, error } = await supabase
        .from('establishments')
        .select('*');

      if (error) {
        console.error('Error fetching establishments:', error);
        setEstablishments([]);
      } else if (data) {
        setEstablishments(data as Establishment[]);
      }
      setLoading(false);
    }

    fetchEstablishments();
  }, []);

  return (
    <div className="space-y-6">
        <Toaster position="top-right" />
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            🏪 Estabelecimentos
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gerenciar todos os estabelecimentos do sistema.
            </p>
        </div>
        <button className="px-4 py-2 bg-brand-600 text-white font-semibold rounded-lg shadow-md hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-opacity-75">
            Adicionar Estabelecimento
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800/50 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
        <DataTable columns={columns} data={establishments} isLoading={loading} exportingTableName="Estabelecimentos" />
      </div>
    </div>
  );
}
