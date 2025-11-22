// Utilitários para manipulação de datas e períodos

export type PeriodType = 'day' | 'week' | 'month' | 'year' | 'custom';

export interface Period {
    type: PeriodType;
    start: Date;
    end: Date;
}

/**
 * Obtém o início do dia (00:00:00)
 */
export const getStartOfDay = (date: Date): Date => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
};

/**
 * Obtém o fim do dia (23:59:59)
 */
export const getEndOfDay = (date: Date): Date => {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
};

/**
 * Obtém o início da semana (segunda-feira)
 */
export const getStartOfWeek = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajustar para segunda-feira
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
};

/**
 * Obtém o fim da semana (domingo)
 */
export const getEndOfWeek = (date: Date): Date => {
    const d = getStartOfWeek(date);
    d.setDate(d.getDate() + 6);
    d.setHours(23, 59, 59, 999);
    return d;
};

/**
 * Obtém o início do mês
 */
export const getStartOfMonth = (date: Date): Date => {
    const d = new Date(date);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
};

/**
 * Obtém o fim do mês
 */
export const getEndOfMonth = (date: Date): Date => {
    const d = new Date(date);
    d.setMonth(d.getMonth() + 1);
    d.setDate(0);
    d.setHours(23, 59, 59, 999);
    return d;
};

/**
 * Obtém o início do ano
 */
export const getStartOfYear = (date: Date): Date => {
    const d = new Date(date);
    d.setMonth(0);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
};

/**
 * Obtém o fim do ano
 */
export const getEndOfYear = (date: Date): Date => {
    const d = new Date(date);
    d.setMonth(11);
    d.setDate(31);
    d.setHours(23, 59, 59, 999);
    return d;
};

/**
 * Obtém o período baseado no tipo
 */
export const getPeriod = (type: PeriodType, customStart?: Date, customEnd?: Date): Period => {
    const now = new Date();

    switch (type) {
        case 'day':
            return {
                type,
                start: getStartOfDay(now),
                end: getEndOfDay(now)
            };
        case 'week':
            return {
                type,
                start: getStartOfWeek(now),
                end: getEndOfWeek(now)
            };
        case 'month':
            return {
                type,
                start: getStartOfMonth(now),
                end: getEndOfMonth(now)
            };
        case 'year':
            return {
                type,
                start: getStartOfYear(now),
                end: getEndOfYear(now)
            };
        case 'custom':
            return {
                type,
                start: customStart || getStartOfMonth(now),
                end: customEnd || getEndOfMonth(now)
            };
        default:
            return {
                type: 'month',
                start: getStartOfMonth(now),
                end: getEndOfMonth(now)
            };
    }
};

/**
 * Obtém o período anterior (para comparação)
 */
export const getPreviousPeriod = (period: Period): Period => {
    const duration = period.end.getTime() - period.start.getTime();

    return {
        type: period.type,
        start: new Date(period.start.getTime() - duration),
        end: new Date(period.end.getTime() - duration)
    };
};

/**
 * Obtém array de dias entre duas datas
 */
export const getDaysInPeriod = (start: Date, end: Date): Date[] => {
    const days: Date[] = [];
    const current = new Date(start);

    while (current <= end) {
        days.push(new Date(current));
        current.setDate(current.getDate() + 1);
    }

    return days;
};

/**
 * Obtém nome do dia da semana
 */
export const getWeekdayName = (date: Date): string => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return days[date.getDay()];
};

/**
 * Obtém nome completo do dia da semana
 */
export const getWeekdayFullName = (dayIndex: number): string => {
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return days[dayIndex];
};

/**
 * Obtém hora da data (0-23)
 */
export const getHourFromDate = (date: Date): number => {
    return new Date(date).getHours();
};

/**
 * Formata data para exibição
 */
export const formatDate = (date: Date, format: 'short' | 'long' = 'short'): string => {
    if (format === 'short') {
        return new Date(date).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });
    }
    return new Date(date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' });
};

/**
 * Verifica se uma data está dentro de um período
 */
export const isDateInPeriod = (date: Date | string, period: Period): boolean => {
    const d = new Date(date);
    return d >= period.start && d <= period.end;
};

/**
 * Calcula diferença percentual
 */
export const calculatePercentChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
};
