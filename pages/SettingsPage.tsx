import React, { useState } from 'react';

const SettingsPage: React.FC = () => {
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

    const toggleDarkMode = (enabled: boolean) => {
        setDarkMode(enabled);
        if (enabled) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">Aparência</h2>
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-medium">Modo Escuro</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Reduza o brilho e dê um descanso aos seus olhos.</p>
                    </div>
                    <label htmlFor="dark-mode-toggle" className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" id="dark-mode-toggle" className="sr-only peer" checked={darkMode} onChange={(e) => toggleDarkMode(e.target.checked)} />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 dark:peer-focus:ring-brand-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-600"></div>
                    </label>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">Notificações</h2>
                 <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-medium">Notificações de Stock Baixo</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Receba um alerta quando um produto estiver acabando.</p>
                    </div>
                     <label htmlFor="stock-alert-toggle" className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" id="stock-alert-toggle" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 dark:peer-focus:ring-brand-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-600"></div>
                    </label>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;