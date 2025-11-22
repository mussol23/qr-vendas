import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const UserDataPage: React.FC = () => {
    const { user } = useAuth();
    const [fullName, setFullName] = useState<string>('');
    const [phone, setPhone] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setEmail(user?.email ?? '');
        // Tenta carregar dados do perfil no Supabase (opcional)
        (async () => {
            if (!user) return;
            const { data } = await supabase.from('profiles').select('full_name, phone').eq('user_id', user.id).maybeSingle();
            if (data) {
                setFullName(data.full_name ?? '');
                setPhone(data.phone ?? '');
            }
        })();
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSaving(true);
        await supabase.from('profiles').upsert({
            user_id: user.id,
            full_name: fullName,
            phone: phone,
        }, { onConflict: 'user_id' });
        setSaving(false);
        alert('Dados do usuário salvos.');
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">Dados do Usuário</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="userName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome Completo</label>
                            <input type="text" id="userName" value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm" />
                        </div>
                        <div>
                            <label htmlFor="userEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email de Acesso</label>
                            <input type="email" id="userEmail" value={email} readOnly className="mt-1 block w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 sm:text-sm" />
                        </div>
                    </div>
                     <div>
                        <label htmlFor="userPhone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Telefone</label>
                        <input type="tel" id="userPhone" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm" />
                    </div>
                     <div className="pt-4 flex justify-end">
                        <button type="submit" disabled={saving} className="px-6 py-2 bg-brand-600 text-white font-semibold rounded-lg shadow-md hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-60">
                            {saving ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">Alterar Senha</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                     <div>
                        <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Senha Atual</label>
                        <input type="password" id="currentPassword" className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nova Senha</label>
                            <input type="password" id="newPassword" className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm" />
                        </div>
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirmar Nova Senha</label>
                            <input type="password" id="confirmPassword" className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm" />
                        </div>
                    </div>
                     <div className="pt-4 flex justify-end">
                        <button type="submit" className="px-6 py-2 bg-brand-600 text-white font-semibold rounded-lg shadow-md hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500">
                            Alterar Senha
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserDataPage;