import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { apiPost } from '../lib/api';
import { getStorage } from '../storage';

const StoreDataPage: React.FC = () => {
    const [storeData, setStoreData] = useState({
        storeName: '',
        storeNif: '',
        storeAddress: '',
        storePhone: '',
        storeEmail: '',
        storeLogo: '',
    });
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Try load from Supabase profile.establishment_id -> establishments
        (async () => {
            try {
                // Try local storage first (offline)
                const storage = await getStorage();
                const localEst = await storage.getEstablishment().catch(() => null);
                if (localEst) {
                    setStoreData(prev => ({
                        ...prev,
                        storeName: localEst.name ?? '',
                        storeNif: localEst.document ?? '',
                        storeAddress: localEst.address ?? '',
                        storePhone: localEst.phone ?? '',
                    }));
                    setLoading(false);
                    return;
                }
                const { data: { session } } = await supabase.auth.getSession();
                const user = session?.user;
                if (!user) {
                    setLoading(false);
                    return;
                }
                const { data: prof } = await supabase
                    .from('profiles')
                    .select('establishment_id')
                    .eq('user_id', user.id)
                    .maybeSingle();
                if (prof?.establishment_id) {
                    const { data: est } = await supabase
                        .from('establishments')
                        .select('*')
                        .eq('id', prof.establishment_id)
                        .maybeSingle();
                    if (est) {
                        setStoreData({
                            storeName: est.name ?? '',
                            storeNif: est.document ?? '',
                            storeAddress: est.address ?? '',
                            storePhone: est.phone ?? '',
                            storeEmail: localStorage.getItem('storeEmail') || '',
                            storeLogo: localStorage.getItem('storeLogo') || '',
                        });
                        // Cache offline
                        await storage.upsertEstablishment({
                            id: est.id,
                            name: est.name,
                            document: est.document ?? undefined,
                            phone: est.phone ?? undefined,
                            address: est.address ?? undefined,
                            updatedAt: est.updated_at,
                        });
                        setLoading(false);
                        return;
                    }
                }
                // Fallback to local
                setStoreData({
                    storeName: localStorage.getItem('storeName') || '',
                    storeNif: localStorage.getItem('storeNif') || '',
                    storeAddress: localStorage.getItem('storeAddress') || '',
                    storePhone: localStorage.getItem('storePhone') || '',
                    storeEmail: localStorage.getItem('storeEmail') || '',
                    storeLogo: localStorage.getItem('storeLogo') || '',
                });
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setStoreData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            // Save locally for offline use
            Object.entries(storeData).forEach(([key, value]) => {
                localStorage.setItem(key, value as string);
            });
            // Save in Supabase via backend (service role), link profile.establishment_id
            await apiPost('/user/establishment', {
                name: storeData.storeName,
                document: storeData.storeNif || null,
                phone: storeData.storePhone || null,
                address: storeData.storeAddress || null,
            }, (await supabase.auth.getSession()).data.session?.access_token);
            // Save snapshot offline
            const storage = await getStorage();
            await storage.upsertEstablishment({
                id: 'current', // placeholder if backend creates; will be replaced on next pull
                name: storeData.storeName,
                document: storeData.storeNif || undefined,
                phone: storeData.storePhone || undefined,
                address: storeData.storeAddress || undefined,
                updatedAt: new Date().toISOString(),
            });
            alert('Dados da loja salvos com sucesso!');
        } catch (err: any) {
            console.error(err);
            alert('Falha ao salvar no servidor. Os dados foram salvos localmente.');
        } finally {
            setSaving(false);
        }
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setStoreData(prev => ({...prev, storeLogo: base64String}));
                // Also save immediately for better UX
                localStorage.setItem('storeLogo', base64String);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">Dados da Loja</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="storeName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome da Loja</label>
                            <input type="text" id="storeName" value={storeData.storeName} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm" />
                        </div>
                        <div>
                            <label htmlFor="storeNif" className="block text-sm font-medium text-gray-700 dark:text-gray-300">NIF</label>
                            <input type="text" id="storeNif" value={storeData.storeNif} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm" />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="storeAddress" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Endereço</label>
                        <input type="text" id="storeAddress" value={storeData.storeAddress} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm" />
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="storePhone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Telefone</label>
                            <input type="tel" id="storePhone" value={storeData.storePhone} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm" />
                        </div>
                        <div>
                            <label htmlFor="storeEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email da Loja</label>
                            <input type="email" id="storeEmail" value={storeData.storeEmail} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm" />
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Logo da Loja</label>
                        {storeData.storeLogo && <img src={storeData.storeLogo} alt="Logo da loja" className="h-24 w-auto object-contain my-2 bg-gray-100 dark:bg-gray-700 p-1 rounded" />}
                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 dark:file:bg-brand-900/50 dark:file:text-brand-300 dark:hover:file:bg-brand-900"/>
                    </div>
                    <div className="pt-4 flex justify-end">
                        <button type="submit" disabled={saving} className="px-6 py-2 bg-brand-600 text-white font-semibold rounded-lg shadow-md hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-60">
                            {saving ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StoreDataPage;