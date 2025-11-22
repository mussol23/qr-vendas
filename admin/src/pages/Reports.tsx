// src/pages/Reports.tsx
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ChartCard } from '../components/ChartCard';

const COLORS = ['#0ea5e9', '#38bdf8', '#7dd3fc', '#bae6fd', '#e0f2fe'];

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
    const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));

    return (
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

export default function Reports() {
    const [loading, setLoading] = useState(true);
    const [revenueByEstablishment, setRevenueByEstablishment] = useState<any[]>([]);
    const [salesByPayment, setSalesByPayment] = useState<any[]>([]);
    const [topProducts, setTopProducts] = useState<any[]>([]);

    useEffect(() => {
        const fetchAllReportData = async () => {
            setLoading(true);
            try {
                await Promise.all([
                    fetchRevenueByEstablishment(),
                    fetchSalesByPayment(),
                    fetchTopProducts(),
                ]);
            } catch (error) {
                console.error("Failed to load report data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAllReportData();
    }, []);

    const fetchRevenueByEstablishment = async () => {
        const { data, error } = await supabase
            .from('sales')
            .select('total, establishments(name)');

        if (error) {
            console.error('Error fetching revenue by establishment:', error);
            return;
        }

        const revenueMap = new Map<string, number>();
        data.forEach(sale => {
            const establishmentName = sale.establishments?.name || 'Sem Estabelecimento';
            const currentTotal = revenueMap.get(establishmentName) || 0;
            revenueMap.set(establishmentName, currentTotal + sale.total);
        });

        setRevenueByEstablishment(Array.from(revenueMap.entries()).map(([name, total]) => ({ name, Receita: total })));
    };
    
    const fetchSalesByPayment = async () => {
        const { data, error } = await supabase
            .from('sales')
            .select('payment_method');

        if (error) {
            console.error('Error fetching sales by payment method:', error);
            return;
        }

        const paymentMap = new Map<string, number>();
        data.forEach(sale => {
            const method = sale.payment_method || 'Não especificado';
            paymentMap.set(method, (paymentMap.get(method) || 0) + 1);
        });
        
        setSalesByPayment(Array.from(paymentMap.entries()).map(([name, value]) => ({ name, value })));
    };

    const fetchTopProducts = async () => {
        const { data, error } = await supabase.rpc('get_top_selling_products', { limit_count: 7 });

        if (error) {
            console.error('Error fetching top selling products:', error);
            return;
        }
        setTopProducts(data);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    📊 Relatórios Avançados
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Análise detalhada do desempenho do seu negócio.
                </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <ChartCard title="Receita por Estabelecimento" isLoading={loading}>
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={revenueByEstablishment} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="name" stroke="rgb(156 163 175)" />
                            <YAxis stroke="rgb(156 163 175)" />
                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '0.75rem' }} />
                            <Legend />
                            <Bar dataKey="Receita" fill="#0ea5e9" />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Vendas por Método de Pagamento" isLoading={loading}>
                    <ResponsiveContainer width="100%" height={400}>
                        <PieChart>
                            <Pie
                                data={salesByPayment}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={renderCustomizedLabel}
                                outerRadius={150}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {salesByPayment.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '0.75rem' }} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            <ChartCard title="Top 7 Produtos Mais Vendidos" isLoading={loading}>
                <ResponsiveContainer width="100%" height={400}>
                    <BarChart layout="vertical" data={topProducts} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis type="number" stroke="rgb(156 163 175)" />
                        <YAxis dataKey="name" type="category" stroke="rgb(156 163 175)" width={150} />
                        <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '0.75rem' }} />
                        <Legend />
                        <Bar dataKey="total_vendido" name="Total Vendido" fill="#34d399" />
                    </BarChart>
                </ResponsiveContainer>
            </ChartCard>
        </div>
    );
}