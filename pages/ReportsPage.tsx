import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { BanknotesIcon, DocumentTextIcon, TrendingUpIcon, ChevronLeftIcon, ChevronRightIcon, ArrowUpIcon, ArrowDownIcon, CalendarIcon } from '../components/Icons';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { getPeriod, PeriodType, Period } from '../utils/dateUtils';
import { useSalesAnalytics } from '../hooks/useSalesAnalytics';

const ReportsPage: React.FC = () => {
  const { sales } = useData();
  const navigate = useNavigate();
  const [periodType, setPeriodType] = useState<PeriodType>('month');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Calcular período
  const period = useMemo(() => {
    if (periodType === 'custom' && customStart && customEnd) {
      return getPeriod('custom', new Date(customStart), new Date(customEnd));
    }
    return getPeriod(periodType);
  }, [periodType, customStart, customEnd]);

  // Obter analytics
  const analytics = useSalesAnalytics(sales, period);

  const totalRevenue = analytics.comparison.current.total;
  const totalProfit = analytics.comparison.current.profit;
  const totalDocuments = analytics.comparison.current.count;

  const handleCarouselNav = (direction: 'prev' | 'next') => {
    const itemsPerPage = 3;
    const maxIndex = Math.max(0, analytics.topProducts.length - itemsPerPage);
    if (direction === 'prev') {
      setCarouselIndex(prev => Math.max(0, prev - 1));
    } else {
      setCarouselIndex(prev => Math.min(maxIndex, prev + 1));
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });
  };

  const formatPercent = (value: number) => {
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const getPeriodLabel = () => {
    switch (periodType) {
      case 'day': return 'Hoje';
      case 'week': return 'Esta Semana';
      case 'month': return 'Este Mês';
      case 'year': return 'Este Ano';
      case 'custom': return 'Personalizado';
      default: return 'Este Mês';
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
        <div className="bg-white dark:bg-gray-800 p-2 sm:p-3 rounded-lg shadow">
          <BanknotesIcon className="h-6 w-6 mx-auto text-green-500" />
          <p className="text-xs sm:text-sm font-semibold mt-1 text-gray-500 dark:text-gray-400">Receita Total</p>
          <p className="text-sm sm:text-lg font-bold">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-2 sm:p-3 rounded-lg shadow">
          <TrendingUpIcon className="h-6 w-6 mx-auto text-sky-500" />
          <p className="text-xs sm:text-sm font-semibold mt-1 text-gray-500 dark:text-gray-400">Lucro Total</p>
          <p className="text-sm sm:text-lg font-bold">{formatCurrency(totalProfit)}</p>
        </div>
        <button
          onClick={() => navigate('/documents/history')}
          className="bg-white dark:bg-gray-800 p-2 sm:p-3 rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <DocumentTextIcon className="h-6 w-6 mx-auto text-indigo-500" />
          <p className="text-xs sm:text-sm font-semibold mt-1 text-gray-500 dark:text-gray-400">Documentos</p>
          <p className="text-sm sm:text-lg font-bold">{totalDocuments}</p>
          <p className="text-xs text-brand-600 dark:text-brand-400 mt-1">Ver histórico →</p>
        </button>
      </div>

      {/* Period Filter */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <div className="flex items-center gap-2 mb-3">
          <CalendarIcon className="h-5 w-5 text-gray-500" />
          <h3 className="font-bold text-lg">Período: {getPeriodLabel()}</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setPeriodType('day')}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${periodType === 'day'
                ? 'bg-brand-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
          >
            Hoje
          </button>
          <button
            onClick={() => setPeriodType('week')}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${periodType === 'week'
                ? 'bg-brand-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
          >
            Semana
          </button>
          <button
            onClick={() => setPeriodType('month')}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${periodType === 'month'
                ? 'bg-brand-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
          >
            Mês
          </button>
          <button
            onClick={() => setPeriodType('year')}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${periodType === 'year'
                ? 'bg-brand-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
          >
            Ano
          </button>
          <button
            onClick={() => setPeriodType('custom')}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${periodType === 'custom'
                ? 'bg-brand-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
          >
            Personalizado
          </button>
        </div>
        {periodType === 'custom' && (
          <div className="flex gap-2 mt-3">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="flex-1 p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 text-sm"
            />
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="flex-1 p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 text-sm"
            />
          </div>
        )}
      </div>

      {/* Comparison */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow">
          <p className="text-xs text-gray-500 dark:text-gray-400">Vendas vs Anterior</p>
          <div className="flex items-center gap-2 mt-1">
            <p className={`text-lg font-bold ${analytics.comparison.percentChange.total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercent(analytics.comparison.percentChange.total)}
            </p>
            {analytics.comparison.percentChange.total >= 0 ? (
              <ArrowUpIcon className="h-4 w-4 text-green-600" />
            ) : (
              <ArrowDownIcon className="h-4 w-4 text-red-600" />
            )}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow">
          <p className="text-xs text-gray-500 dark:text-gray-400">Lucro vs Anterior</p>
          <div className="flex items-center gap-2 mt-1">
            <p className={`text-lg font-bold ${analytics.comparison.percentChange.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercent(analytics.comparison.percentChange.profit)}
            </p>
            {analytics.comparison.percentChange.profit >= 0 ? (
              <ArrowUpIcon className="h-4 w-4 text-green-600" />
            ) : (
              <ArrowDownIcon className="h-4 w-4 text-red-600" />
            )}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow">
          <p className="text-xs text-gray-500 dark:text-gray-400">Docs vs Anterior</p>
          <div className="flex items-center gap-2 mt-1">
            <p className={`text-lg font-bold ${analytics.comparison.percentChange.count >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercent(analytics.comparison.percentChange.count)}
            </p>
            {analytics.comparison.percentChange.count >= 0 ? (
              <ArrowUpIcon className="h-4 w-4 text-green-600" />
            ) : (
              <ArrowDownIcon className="h-4 w-4 text-red-600" />
            )}
          </div>
        </div>
      </div>

      {/* Sales Chart */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h3 className="font-bold text-lg mb-4">Vendas ao Longo do Tempo</h3>
        {analytics.salesByDate.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={analytics.salesByDate}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
              <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                labelStyle={{ color: '#F3F4F6' }}
              />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#10B981" strokeWidth={2} name="Receita" />
              <Line type="monotone" dataKey="profit" stroke="#3B82F6" strokeWidth={2} name="Lucro" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-gray-500 py-8">Nenhuma venda no período selecionado</p>
        )}
      </div>

      {/* Advanced Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">Ticket Médio</p>
          <p className="text-lg font-bold mt-1">{formatCurrency(analytics.stats.avgTicket)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">Margem</p>
          <p className="text-lg font-bold mt-1">{analytics.stats.margin.toFixed(1)}%</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">Itens Vendidos</p>
          <p className="text-lg font-bold mt-1">{analytics.stats.totalItems}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">Média/Dia</p>
          <p className="text-lg font-bold mt-1">{formatCurrency(analytics.stats.avgPerDay)}</p>
        </div>
      </div>

      {/* Weekday Analysis */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h3 className="font-bold text-lg mb-4">Vendas por Dia da Semana</h3>
        {analytics.salesByWeekday.some(d => d.count > 0) ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analytics.salesByWeekday}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="day" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
              <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                labelStyle={{ color: '#F3F4F6' }}
              />
              <Bar dataKey="total" fill="#10B981" name="Receita" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-gray-500 py-8">Nenhuma venda no período</p>
        )}
      </div>

      {/* Hourly Analysis */}
      {analytics.salesByHour.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="font-bold text-lg mb-4">Vendas por Hora do Dia</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analytics.salesByHour}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="hour" stroke="#9CA3AF" style={{ fontSize: '12px' }} tickFormatter={(h) => `${h}h`} />
              <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                labelStyle={{ color: '#F3F4F6' }}
                labelFormatter={(h) => `${h}:00`}
              />
              <Bar dataKey="total" fill="#3B82F6" name="Receita" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top Products */}
      <div>
        <h3 className="font-bold text-lg mb-2">Produtos Mais Vendidos ({getPeriodLabel()})</h3>
        {analytics.topProducts.length > 0 ? (
          <div className="relative">
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-300 ease-in-out"
                style={{ transform: `translateX(-${carouselIndex * (100 / 3)}%)` }}
              >
                {analytics.topProducts.map((product, index) => (
                  <div key={index} className="flex-shrink-0 p-2" style={{ width: `${100 / 3}%` }}>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg text-center h-full flex flex-col justify-center shadow">
                      <p className="font-semibold text-sm truncate">{product.name}</p>
                      <p className="text-2xl font-bold text-brand-600 dark:text-brand-400 mt-1">{product.quantity}</p>
                      <p className="text-xs text-gray-500">vendas</p>
                      <p className="text-sm font-medium mt-1">{formatCurrency(product.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {carouselIndex > 0 && (
              <button onClick={() => handleCarouselNav('prev')} className="absolute -left-2 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 p-1 rounded-full shadow-md border dark:border-gray-600 z-10 hover:bg-gray-100 dark:hover:bg-gray-700">
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
            )}
            {carouselIndex < analytics.topProducts.length - 3 && analytics.topProducts.length > 3 && (
              <button onClick={() => handleCarouselNav('next')} className="absolute -right-2 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 p-1 rounded-full shadow-md border dark:border-gray-600 z-10 hover:bg-gray-100 dark:hover:bg-gray-700">
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <p className="text-center text-gray-500 py-8">Nenhuma venda no período</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;