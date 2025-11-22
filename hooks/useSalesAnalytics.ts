import { useMemo } from 'react';
import { Sale } from '../types';
import { Period, isDateInPeriod, getPreviousPeriod, getWeekdayFullName, getHourFromDate, calculatePercentChange, formatDate } from '../utils/dateUtils';

export interface SalesAnalytics {
    salesByDate: { date: string; total: number; count: number; profit: number }[];
    salesByWeekday: { day: string; dayIndex: number; total: number; count: number }[];
    salesByHour: { hour: number; total: number; count: number }[];
    comparison: {
        current: { total: number; count: number; profit: number };
        previous: { total: number; count: number; profit: number };
        percentChange: { total: number; count: number; profit: number };
    };
    stats: {
        avgTicket: number;
        margin: number;
        totalItems: number;
        avgPerDay: number;
    };
    topProducts: { name: string; quantity: number; revenue: number }[];
}

/**
 * Hook para análise de vendas baseado em período
 */
export const useSalesAnalytics = (sales: Sale[], period: Period): SalesAnalytics => {
    return useMemo(() => {
        // Filtrar vendas do período atual
        const currentSales = sales.filter(sale => isDateInPeriod(sale.date, period));

        // Filtrar vendas do período anterior (para comparação)
        const previousPeriod = getPreviousPeriod(period);
        const previousSales = sales.filter(sale => isDateInPeriod(sale.date, previousPeriod));

        // 1. Vendas por data
        const salesByDateMap = new Map<string, { total: number; count: number; profit: number }>();
        currentSales.forEach(sale => {
            const dateKey = formatDate(new Date(sale.date), 'short');
            const existing = salesByDateMap.get(dateKey);
            if (existing) {
                existing.total += sale.total;
                existing.count += 1;
                existing.profit += sale.profit || 0;
            } else {
                salesByDateMap.set(dateKey, {
                    total: sale.total,
                    count: 1,
                    profit: sale.profit || 0
                });
            }
        });
        const salesByDate = Array.from(salesByDateMap.entries())
            .map(([date, data]) => ({ date, ...data }))
            .sort((a, b) => {
                const [dayA, monthA] = a.date.split('/').map(Number);
                const [dayB, monthB] = b.date.split('/').map(Number);
                return monthA !== monthB ? monthA - monthB : dayA - dayB;
            });

        // 2. Vendas por dia da semana
        const salesByWeekdayMap = new Map<number, { total: number; count: number }>();
        for (let i = 0; i < 7; i++) {
            salesByWeekdayMap.set(i, { total: 0, count: 0 });
        }
        currentSales.forEach(sale => {
            const dayIndex = new Date(sale.date).getDay();
            const existing = salesByWeekdayMap.get(dayIndex)!;
            existing.total += sale.total;
            existing.count += 1;
        });
        const salesByWeekday = Array.from(salesByWeekdayMap.entries())
            .map(([dayIndex, data]) => ({
                day: getWeekdayFullName(dayIndex),
                dayIndex,
                ...data
            }))
            .sort((a, b) => {
                // Ordenar de segunda (1) a domingo (0)
                const orderA = a.dayIndex === 0 ? 7 : a.dayIndex;
                const orderB = b.dayIndex === 0 ? 7 : b.dayIndex;
                return orderA - orderB;
            });

        // 3. Vendas por hora
        const salesByHourMap = new Map<number, { total: number; count: number }>();
        for (let i = 0; i < 24; i++) {
            salesByHourMap.set(i, { total: 0, count: 0 });
        }
        currentSales.forEach(sale => {
            const hour = getHourFromDate(new Date(sale.date));
            const existing = salesByHourMap.get(hour)!;
            existing.total += sale.total;
            existing.count += 1;
        });
        const salesByHour = Array.from(salesByHourMap.entries())
            .map(([hour, data]) => ({ hour, ...data }))
            .filter(item => item.count > 0); // Mostrar apenas horas com vendas

        // 4. Comparação com período anterior
        const currentTotal = currentSales.reduce((sum, sale) => sum + sale.total, 0);
        const currentCount = currentSales.length;
        const currentProfit = currentSales.reduce((sum, sale) => sum + (sale.profit || 0), 0);

        const previousTotal = previousSales.reduce((sum, sale) => sum + sale.total, 0);
        const previousCount = previousSales.length;
        const previousProfit = previousSales.reduce((sum, sale) => sum + (sale.profit || 0), 0);

        const comparison = {
            current: { total: currentTotal, count: currentCount, profit: currentProfit },
            previous: { total: previousTotal, count: previousCount, profit: previousProfit },
            percentChange: {
                total: calculatePercentChange(currentTotal, previousTotal),
                count: calculatePercentChange(currentCount, previousCount),
                profit: calculatePercentChange(currentProfit, previousProfit)
            }
        };

        // 5. Estatísticas avançadas
        const totalItems = currentSales.reduce((sum, sale) => {
            return sum + (sale.items?.reduce((itemSum, item) => itemSum + item.quantity, 0) || 0);
        }, 0);

        const avgTicket = currentCount > 0 ? currentTotal / currentCount : 0;
        const margin = currentTotal > 0 ? (currentProfit / currentTotal) * 100 : 0;

        // Calcular dias únicos no período
        const daysInPeriod = Math.ceil((period.end.getTime() - period.start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const avgPerDay = daysInPeriod > 0 ? currentTotal / daysInPeriod : 0;

        const stats = {
            avgTicket,
            margin,
            totalItems,
            avgPerDay
        };

        // 6. Top produtos
        const productSalesMap = new Map<string, { name: string; quantity: number; revenue: number }>();
        currentSales.forEach(sale => {
            (sale.items || []).forEach(item => {
                const existing = productSalesMap.get(item.productId);
                if (existing) {
                    existing.quantity += item.quantity;
                    existing.revenue += item.price * item.quantity;
                } else {
                    productSalesMap.set(item.productId, {
                        name: item.productName,
                        quantity: item.quantity,
                        revenue: item.price * item.quantity
                    });
                }
            });
        });
        const topProducts = Array.from(productSalesMap.values())
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10);

        return {
            salesByDate,
            salesByWeekday,
            salesByHour,
            comparison,
            stats,
            topProducts
        };
    }, [sales, period]);
};
