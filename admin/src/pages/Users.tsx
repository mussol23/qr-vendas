// src/pages/Users.tsx
import { useEffect, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { supabase } from '../lib/supabase';
import { DataTable } from '../components/DataTable';
import { ActionsDropdown, ActionItem } from '../components/ActionsDropdown';
import toast, { Toaster } from 'react-hot-toast';

// Definir o tipo para os dados do usuário que vamos buscar
export type UserProfile = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
  establishment_name: string;
};

// Componente para o menu de ações, agora usando o ActionsDropdown
const ActionsCell = ({ user }: { user: UserProfile }) => {
    const userActions: ActionItem[] = [
        {
            label: 'Ver Detalhes',
            onClick: () => toast.success(`Visualizando detalhes de ${user.full_name}`),
        },
        {
            label: 'Editar Usuário',
            onClick: () => toast('Funcionalidade de edição a ser implementada.'),
        },
        {
            label: 'Resetar Senha',
            onClick: () => toast('Funcionalidade de reset de senha a ser implementada.'),
        },
        {
            label: 'Deletar Usuário',
            onClick: () => {
                if(window.confirm(`Tem a certeza que quer deletar ${user.full_name}?`)) {
                    toast.error(`Deletando ${user.full_name} (Demonstração)`);
                }
            },
            isDestructive: true,
        }
    ];

  return <ActionsDropdown items={userActions} />;
};

// Definição das colunas para a tabela de usuários
export const columns: ColumnDef<UserProfile>[] = [
  {
    accessorKey: 'full_name',
    header: 'Nome',
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full">
            <span className="font-semibold text-gray-600 dark:text-gray-300">
                {row.original.full_name?.charAt(0).toUpperCase() || '?'}
            </span>
        </div>
        <div>
            <div className="font-bold text-gray-900 dark:text-white">{row.original.full_name}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{row.original.email}</div>
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'establishment_name',
    header: 'Estabelecimento',
  },
  {
    accessorKey: 'role',
    header: 'Função',
    cell: ({ row }) => (
      <span className={`px-3 py-1 text-xs font-medium rounded-full ${row.original.role === 'admin' 
        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
        {row.original.role}
      </span>
    )
  },
  {
    accessorKey: 'created_at',
    header: 'Data de Cadastro',
    cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString('pt-BR'),
  },
  {
    id: 'actions',
    header: 'Ações',
    cell: ({ row }) => <ActionsCell user={row.original} />,
  },
];

export default function Users() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          role,
          created_at,
          establishments ( name )
        `);

      if (error) {
        console.error('Error fetching users:', error);
        setUsers([]);
      } else if (data) {
        const formattedData = data.map(profile => ({
          ...profile,
          establishment_name: Array.isArray(profile.establishments) 
            ? profile.establishments[0]?.name || 'N/A' 
            : profile.establishments?.name || 'N/A',
          full_name: profile.full_name || 'Usuário sem nome',
          email: profile.email || 'N/A'
        }));
        setUsers(formattedData as UserProfile[]);
      }
      setLoading(false);
    }

    fetchUsers();
  }, []);

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            👥 Usuários
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gerenciar todos os usuários registrados no sistema.
            </p>
        </div>
        <button className="px-4 py-2 bg-brand-600 text-white font-semibold rounded-lg shadow-md hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-opacity-75">
            Adicionar Usuário
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800/50 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
        <DataTable columns={columns} data={users} isLoading={loading} exportingTableName="Usuários" />
      </div>
    </div>
  );
}