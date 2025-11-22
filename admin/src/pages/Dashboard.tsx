import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { format, subDays, startOfMonth, eachDayOfInterval, lastDayOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChartCard } from '../components/ChartCard';

// Interfaces para os dados
interface Metrics {
  totalEstablishments: number;
  totalUsers: number;
  totalSales: number;
  totalRevenue: number;
  onlineUsers: number;
}

interface SalesChartData {
  name: string;
  Vendas: number;
}

interface UsersChartData {
    name: string;
    NovosUsuários: number;
}


// Componente Principal do Dashboard
export default function Dashboard() {
  const [metrics, setMetrics] = useState<Metrics>({
    totalEstablishments: 0,
    totalUsers: 0,
    totalSales: 0,
    totalRevenue: 0,
    onlineUsers: 0,
  });
  const [salesChartData, setSalesChartData] = useState<SalesChartData[]>([]);
  const [usersChartData, setUsersChartData] = useState<UsersChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAllData = async () => {
      try {
        setLoading(true);
        // Roda todas as buscas em paralelo para mais performance
        await Promise.all([
          loadMetrics(),
          loadSalesChartData(),
          loadUsersChartData()
        ]);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadAllData();
  }, []);

  const loadMetrics = async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
    const { count: establishmentsCount } = await supabase.from('establishments').select('*', { count: 'exact', head: true }).eq('active', true);
    const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: salesCount, data: salesData } = await supabase.from('sales').select('total').gte('date', thirtyDaysAgo.toISOString());
    const totalRevenue = salesData?.reduce((sum, sale) => sum + Number(sale.total), 0) || 0;
    const { count: onlineCount } = await supabase.from('user_presence').select('*', { count: 'exact', head: true }).eq('status', 'online');

    setMetrics({
      totalEstablishments: establishmentsCount || 0,
      totalUsers: usersCount || 0,
      totalSales: salesCount || 0,
      totalRevenue,
      onlineUsers: onlineCount || 0,
    });
  };

  const loadSalesChartData = async () => {
    const today = new Date();
    const last7Days = eachDayOfInterval({ start: subDays(today, 6), end: today });
    
    const { data, error } = await supabase
      .from('sales')
      .select('date, total')
      .gte('date', subDays(today, 7).toISOString());

    if (error) {
      console.error("Error fetching sales data for chart:", error);
      return;
    }

    const chartData = last7Days.map(day => {
      const dayString = format(day, 'yyyy-MM-dd');
      const total = data
        .filter(sale => format(new Date(sale.date), 'yyyy-MM-dd') === dayString)
        .reduce((sum, sale) => sum + sale.total, 0);
      
      return {
        name: format(day, 'dd/MM'),
        Vendas: parseFloat(total.toFixed(2)),
      };
    });

    setSalesChartData(chartData);
  };

    const loadUsersChartData = async () => {
        const { data, error } = await supabase.rpc('get_monthly_user_signups');

        if (error) {
            console.error("Error fetching user signup data for chart:", error);
            // Em caso de erro, preenche com dados vazios para os últimos 6 meses
            const fallbackData = Array.from({ length: 6 }).map((_, i) => {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                return { name: format(d, 'MMM/yy', { locale: ptBR }), NovosUsuários: 0 };
            }).reverse();
            setUsersChartData(fallbackData);
            return;
        }

        setUsersChartData(data.map((d: any) => ({
            ...d,
            name: format(new Date(d.name), 'MMM/yy', { locale: ptBR })
        })));
    };

  const MetricCard = ({ title, value, icon, color = 'blue' }: { title: string; value: string | number; icon: string; color?: 'blue' | 'green' | 'purple' | 'orange'; }) => {
    const colorClasses = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      purple: 'from-purple-500 to-purple-600',
      orange: 'from-orange-500 to-orange-600',
    };
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {loading ? <div className="w-20 h-8 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" /> : value}
            </p>
          </div>
          <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center text-3xl shadow-md`}>
            {icon}
          </div>
        </div>
      </div>
    );
  };



  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Visão geral do sistema QR Vendas.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Estabelecimentos" value={metrics.totalEstablishments} icon="🏪" color="blue" />
        <MetricCard title="Usuários" value={metrics.totalUsers} icon="👥" color="green" />
        <MetricCard title="Vendas (30 dias)" value={metrics.totalSales} icon="📈" color="purple" />
        <MetricCard title="Receita (30 dias)" value={`€${metrics.totalRevenue.toFixed(2)}`} icon="💰" color="orange" />
      </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
            <div className="lg:col-span-4">
                <ChartCard title="Vendas nos últimos 7 dias">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={salesChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="name" stroke="rgb(156 163 175)" />
                            <YAxis stroke="rgb(156 163 175)" />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1f2937',
                                    borderColor: '#374151',
                                    borderRadius: '0.75rem'
                                }}
                            />
                            <Legend />
                            <Bar dataKey="Vendas" fill="#38bdf8" />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>
            <div className="lg:col-span-3">
                 <ChartCard title="Novos usuários (6 meses)">
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={usersChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="name" stroke="rgb(156 163 175)" />
                            <YAxis stroke="rgb(156 163 175)" />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1f2937',
                                    borderColor: '#374151',
                                    borderRadius: '0.75rem'
                                }}
                            />
                            <Legend />
                            <Line type="monotone" dataKey="NovosUsuários" stroke="#34d399" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Usuários Online</h2>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-green-600 dark:text-green-400">{loading ? '...' : metrics.onlineUsers} online</span>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            {metrics.onlineUsers === 0 ? 'Nenhum usuário online no momento.' : `${metrics.onlineUsers} usuário(s) conectado(s) agora.`}
          </p>
        </div>

        <Link to="/users" className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow cursor-pointer text-left block">
          <div className="flex items-center gap-4">
            <span className="text-4xl">👥</span>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Gerenciar Usuários</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Ver, criar e editar usuários</p>
            </div>
          </div>
        </Link>

        <Link to="/reports" className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow cursor-pointer text-left block">
          <div className="flex items-center gap-4">
            <span className="text-4xl">📊</span>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Ver Relatórios</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Relatórios e análises detalhadas</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}