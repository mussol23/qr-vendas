// src/components/ChartCard.tsx
import React from 'react';

interface ChartCardProps {
    title: string;
    description?: string;
    isLoading: boolean;
    children: React.ReactNode;
}

export const ChartCard: React.FC<ChartCardProps> = ({ title, description, isLoading, children }) => (
    <div className="bg-white dark:bg-gray-800/50 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
        {description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">{description}</p>}
        <div className="mt-4">
            {isLoading ? (
                <div className="w-full h-[300px] bg-gray-200 dark:bg-gray-700 animate-pulse rounded-md flex items-center justify-center">
                    <p className="text-gray-500">Carregando dados do gráfico...</p>
                </div>
            ) : children}
        </div>
    </div>
);
