// src/pages/Settings.tsx
import { useState } from 'react';
import toast from 'react-hot-toast';

// Componente reutilizável para um card de seção
const SettingsCard: React.FC<React.PropsWithChildren<{ title: string; description?: string }>> = ({ title, description, children }) => (
    <div className="bg-white dark:bg-gray-800/50 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
        {description && <p className="text-gray-600 dark:text-gray-400 mt-1 mb-6">{description}</p>}
        <div className="mt-4">{children}</div>
    </div>
);

// Componente reutilizável para um campo de input
const InputField = ({ label, type = 'text', value, onChange, disabled = false, placeholder = '' }: { label: string; type?: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; disabled?: boolean; placeholder?: string }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</label>
        <input
            type={type}
            value={value}
            onChange={onChange}
            disabled={disabled}
            placeholder={placeholder}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
        />
    </div>
);

// Componente de Toggle
const Toggle = ({ label, enabled, setEnabled }: { label: string; enabled: boolean; setEnabled: (enabled: boolean) => void; }) => (
    <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <button
            onClick={() => setEnabled(!enabled)}
            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${enabled ? 'bg-brand-600' : 'bg-gray-300 dark:bg-gray-600'}`}
        >
            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
    </div>
);


export default function Settings() {
    const [generalSettings, setGeneralSettings] = useState({
        siteName: 'QR Vendas',
        maintenanceMode: false,
    });

    const [apiKeys, setApiKeys] = useState({
        stripeKey: 'pk_test_************************',
        googleMapsKey: 'AIzaSy*************************',
    });

    const handleGeneralChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setGeneralSettings(prev => ({ ...prev, [name]: value }));
    };
    
    const handleApiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setApiKeys(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveChanges = (section: string) => {
        toast.success(`${section} salvas com sucesso! (Demonstração)`);
    };

    const handleDangerAction = (action: string) => {
        if (window.confirm(`TEM A CERTEZA que pretende ${action}? Esta ação é irreversível.`)) {
            toast.success(`Ação "${action}" executada com sucesso! (Demonstração)`);
        } else {
            toast.error(`Ação "${action}" cancelada.`);
        }
    };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          ⚙️ Configurações
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Ajustes gerais, integrações e manutenção do sistema.
        </p>
      </div>

      <SettingsCard title="Configurações Gerais">
        <div className="space-y-6 max-w-lg">
            <InputField label="Nome do Sistema" value={generalSettings.siteName} onChange={e => setGeneralSettings({...generalSettings, siteName: e.target.value})} />
            <Toggle label="Modo de Manutenção" enabled={generalSettings.maintenanceMode} setEnabled={val => setGeneralSettings({...generalSettings, maintenanceMode: val})} />
            <div>
                <button onClick={() => handleSaveChanges('Configurações Gerais')} className="px-4 py-2 bg-brand-600 text-white font-semibold rounded-lg shadow-md hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500">
                    Salvar Alterações
                </button>
            </div>
        </div>
      </SettingsCard>
      
      <SettingsCard title="Chaves de API" description="Gerencie as chaves de integração para serviços externos.">
        <div className="space-y-6 max-w-lg">
            <InputField label="Stripe Public Key" value={apiKeys.stripeKey} onChange={e => setApiKeys({...apiKeys, stripeKey: e.target.value})} />
            <InputField label="Google Maps API Key" value={apiKeys.googleMapsKey} onChange={e => setApiKeys({...apiKeys, googleMapsKey: e.target.value})} />
            <div>
                <button onClick={() => handleSaveChanges('Chaves de API')} className="px-4 py-2 bg-brand-600 text-white font-semibold rounded-lg shadow-md hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500">
                    Salvar Chaves
                </button>
            </div>
        </div>
      </SettingsCard>

      <div className="bg-white dark:bg-gray-800/50 p-6 rounded-2xl shadow-lg border-2 border-red-500/50 dark:border-red-500/50">
        <h3 className="text-xl font-bold text-red-600 dark:text-red-400">Zona de Perigo</h3>
        <p className="text-gray-600 dark:text-gray-400 mt-1 mb-6">Estas ações são destrutivas e irreversíveis. Tenha muito cuidado.</p>
        <div className="space-y-4 max-w-lg">
            <div className="flex items-center justify-between">
                <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Limpar Cache da Aplicação</p>
                    <p className="text-sm text-gray-500">Força a limpeza de todos os caches de dados.</p>
                </div>
                <button onClick={() => handleDangerAction('Limpar Cache')} className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500">
                    Limpar Cache
                </button>
            </div>
             <div className="flex items-center justify-between">
                <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Desativar Todos os Usuários</p>
                    <p className="text-sm text-gray-500">Impede o login de todos os usuários exceto administradores.</p>
                </div>
                <button onClick={() => handleDangerAction('Desativar Usuários')} className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500">
                    Desativar
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}