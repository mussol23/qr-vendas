// src/pages/UsersOnline.tsx
import { useEffect, useState, useCallback } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { supabase } from '../lib/supabase';
import { DataTable } from '../components/DataTable';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Definir o tipo para os dados que vamos buscar
export type OnlineUser = {
  user_id: string;
  last_seen: string;
  profile: {
    full_name: string;
    email: string;
    establishment: {
      name: string;
    } | null;
  } | null;
};

// Formatar dados para a tabela
const formatDataForTable = (data: any[]) => {
  return data.map(presence => ({
    user_id: presence.user_id,
    last_seen: presence.last_seen,
    full_name: presence.profiles?.full_name || 'Usuário Desconhecido',
    email: presence.profiles?.email || 'N/A',
    establishment_name: presence.profiles?.establishments?.name || 'N/A',
  }));
}

// Colunas da Tabela
export const columns: ColumnDef<any>[] = [
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
    accessorKey: 'last_seen',
    header: 'Visto por último',
    cell: ({ row }) => formatDistanceToNow(new Date(row.original.last_seen), { addSuffix: true, locale: ptBR }),
  },
];

export default function UsersOnlinePage() {
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchOnlineUsers = useCallback(async () => {
    // Apenas mostra o loading na primeira vez
    if (onlineUsers.length === 0) setLoading(true);

    const { data, error } = await supabase
      .from('user_presence')
      .select(`
        user_id,
        last_seen,
        profiles (
          full_name,
          email,
          establishments ( name )
        )
      `)
      .eq('status', 'online');

    if (error) {
      console.error('Error fetching online users:', error);
      setOnlineUsers([]);
    } else if (data) {
      setOnlineUsers(formatDataForTable(data));
      setLastUpdated(new Date());
    }
    setLoading(false);
  }, [onlineUsers.length]);

  useEffect(() => {
    fetchOnlineUsers(); // Busca inicial
    const interval = setInterval(() => {
      fetchOnlineUsers();
    }, 15000); // Atualiza a cada 15 segundos

    return () => clearInterval(interval); // Limpa o intervalo ao desmontar o componente
  }, [fetchOnlineUsers]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            🟢 Usuários Online
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
            Monitoramento em tempo real de usuários conectados.
            </p>
        </div>
         <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
            <span>Atualizando a cada 15s</span>
            <span>(Última: {lastUpdated.toLocaleTimeString()})</span>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800/50 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
        <DataTable columns={columns} data={onlineUsers} isLoading={loading} />
      </div>
    </div>
  );
}