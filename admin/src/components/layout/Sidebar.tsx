import { NavLink } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  { name: 'Dashboard', to: '/dashboard', icon: '📊' },
  { name: 'Estabelecimentos', to: '/establishments', icon: '🏪' },
  { name: 'Usuários', to: '/users', icon: '👥' },
  { name: 'Online', to: '/users-online', icon: '🟢', badge: true },
  { name: 'Vendas', to: '/sales', icon: '📈' },
  { name: 'Relatórios', to: '/reports', icon: '📊' },
  { name: 'Finanças', to: '/finance', icon: '💰' },
  { name: 'Analytics', to: '/analytics', icon: '📉' },
  { name: 'Configurações', to: '/settings', icon: '⚙️' },
  { name: 'Logs', to: '/logs', icon: '📝' },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <QRCodeCanvas 
              value="QRVendas" 
              size={32} 
              bgColor="transparent" 
              fgColor={document.documentElement.classList.contains('dark') ? '#38bdf8' : '#0284c7'} 
            />
            <div className="flex flex-col">
              <span className="font-bold text-gray-900 dark:text-white text-sm leading-none">
                QR Vendas
              </span>
              <span className="text-xs text-brand-600 dark:text-brand-400 font-medium">
                Admin
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-4rem)]">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 font-medium'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`
              }
            >
              <span className="text-xl">{item.icon}</span>
              <span className="flex-1">{item.name}</span>
              {item.badge && (
                <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full font-medium">
                  Live
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            QR Vendas Admin v1.0.0
          </p>
        </div>
      </aside>
    </>
  );
}

