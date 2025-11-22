
import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useLocation, Link } from 'react-router-dom';
import { CubeIcon, ShoppingCartIcon, ChartBarIcon, DocumentTextIcon, UsersIcon, BellIcon, UserCircleIcon, LogoutIcon, ArrowUpTrayIcon } from './Icons';
import { useData } from '../context/DataContext';
import { usePermissions } from '../context/PermissionsContext';
import PageTransition from './PageTransition';
import { API_URL } from '../lib/api';

const navItems = [
  { path: '/pos', label: 'Vendas', icon: <ShoppingCartIcon />, permission: 'canAccessPOS' },
  { path: '/products', label: 'Produtos', icon: <CubeIcon />, permission: 'canAccessProducts' },
  { path: '/documents', label: 'Documentos', icon: <DocumentTextIcon />, permission: 'canAccessDocuments' },
  { path: '/clients', label: 'Clientes', icon: <UsersIcon />, permission: 'canAccessClients' },
  { path: '/reports', label: 'Relatórios', icon: <ChartBarIcon />, permission: 'canAccessReports' },
];

const getPageTitle = (pathname: string) => {
  if (pathname.startsWith('/products')) return 'Gestão de Produtos';
  if (pathname.startsWith('/pos')) return 'Ponto de Venda';
  if (pathname.startsWith('/reports')) return 'Relatórios de Vendas';
  if (pathname.startsWith('/documents')) return 'Documentos';
  if (pathname.startsWith('/clients')) return 'Gestão de Clientes';
  if (pathname.startsWith('/print-labels')) return 'Imprimir Etiquetas QR';
  if (pathname.startsWith('/store')) return 'Dados da Loja';
  if (pathname.startsWith('/user')) return 'Dados do Usuário';
  if (pathname.startsWith('/settings')) return 'Definições';
  if (pathname.startsWith('/finances')) return 'Gestão Financeira';
  if (pathname.startsWith('/stock-control')) return 'Controle de Estoque';
  if (pathname.startsWith('/employees')) return 'Gestão de Funcionários';
  return 'QR Sales Manager';
};

const ProfileDropdown: React.FC<{ onClose: () => void; onInstallClick: () => void; isInstallable: boolean }> = ({ onClose, onInstallClick, isInstallable }) => {
  const permissions = usePermissions();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);
  return (
    <div
      className={`absolute top-12 right-0 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 border dark:border-gray-700 transform transition-all duration-150 ease-out origin-top-right ${visible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-1'}`}
    >
      {isInstallable && <button onClick={() => { onInstallClick(); onClose(); }} className="block text-left w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 font-semibold text-brand-600 dark:text-brand-400">Instalar App</button>}
      {permissions.canAccessStockControl && <Link to="/stock-control" onClick={onClose} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Controle de Estoque</Link>}
      {permissions.canAccessFinances && <Link to="/finances" onClick={onClose} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Gestão Financeira</Link>}
      {permissions.canManageEmployees && <Link to="/employees" onClick={onClose} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Funcionários</Link>}
      {permissions.canManageStore && <Link to="/store" onClick={onClose} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Dados da Loja</Link>}
      <Link to="/user" onClick={onClose} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Dados do Usuário</Link>
      {permissions.canAccessSettings && <Link to="/settings" onClick={onClose} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Definições</Link>}
    </div>
  );
};

const NotificationsDropdown: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { products } = useData();
  const lowStockProducts = products.filter(p => p.quantity < 10);

  return (
    <div className="absolute top-12 right-0 w-64 bg-white dark:bg-gray-800 rounded-md shadow-lg z-50 border dark:border-gray-700">
      <div className="p-2 font-bold text-sm border-b dark:border-gray-700">Notificações</div>
      <div className="py-1 max-h-60 overflow-y-auto">
        {lowStockProducts.length > 0 ? lowStockProducts.map(p => (
          <Link to="/products" onClick={onClose} key={p.id} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
            <p><span className="font-bold">{p.name}</span> está com stock baixo ({p.quantity}).</p>
          </Link>
        )) : (
          <p className="px-4 py-3 text-sm text-gray-500">Nenhuma notificação.</p>
        )}
      </div>
    </div>
  );
}

interface LayoutProps {
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ onLogout }) => {
  const location = useLocation();
  const pageTitle = getPageTitle(location.pathname);
  const { products, isSyncing, syncNow } = useData();
  const permissions = usePermissions();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);
  const [showApiWarning, setShowApiWarning] = useState(!API_URL);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    // Smooth scroll to top on route change
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      window.scrollTo(0, 0);
    }
  }, [location.pathname]);

  const handleInstallClick = () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    installPrompt.userChoice.then(() => {
      setInstallPrompt(null);
    });
  };

  const lowStockCount = products.filter(p => p.quantity < 10).length;

  const toggleProfile = () => {
    setProfileOpen(!profileOpen);
    setNotificationsOpen(false);
  }
  const toggleNotifications = () => {
    setNotificationsOpen(!notificationsOpen);
    setProfileOpen(false);
  }
  useEffect(() => {
    const onDocClick = (e: MouseEvent | TouchEvent) => {
      if (!profileOpen) return;
      const target = e.target as Node;
      if (profileRef.current && !profileRef.current.contains(target)) {
        setProfileOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setProfileOpen(false);
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('touchstart', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('touchstart', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [profileOpen]);

  return (
    <div className="flex flex-col h-screen font-sans text-gray-800 dark:text-gray-200">
      {/* Warning Banner quando API não está configurada */}
      {showApiWarning && (
        <div className="bg-yellow-500 dark:bg-yellow-600 text-black dark:text-white p-3 flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="text-sm">
              <strong>Sincronização Desativada:</strong> Configure VITE_API_URL no arquivo .env para sincronizar com o servidor.
              Os dados estão sendo salvos apenas localmente.
            </div>
          </div>
          <button
            onClick={() => setShowApiWarning(false)}
            className="ml-4 p-1 hover:bg-yellow-600 dark:hover:bg-yellow-700 rounded"
            title="Fechar aviso"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}
      <header className="bg-white dark:bg-gray-800 shadow-md p-4 flex justify-between items-center z-10">
        <h1 className="text-xl font-bold text-brand-600 dark:text-brand-400">{pageTitle}</h1>
        <div className="flex items-center gap-4">
          {isSyncing && (
            <div className="flex items-center gap-2 text-sm text-gray-500 animate-pulse" title="A sincronizar dados com a nuvem...">
              <ArrowUpTrayIcon className="h-5 w-5" />
            </div>
          )}
          {syncNow && (
            <button
              onClick={syncNow}
              disabled={isSyncing}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Sincronizar com servidor"
            >
              <ArrowUpTrayIcon className="h-5 w-5" />
            </button>
          )}
          <div className="relative">
            <button onClick={toggleNotifications} className="relative text-gray-600 dark:text-gray-300">
              <BellIcon />
              {lowStockCount > 0 && <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">{lowStockCount}</span>}
            </button>
            {notificationsOpen && <NotificationsDropdown onClose={() => setNotificationsOpen(false)} />}
          </div>
          <div className="relative" ref={profileRef}>
            <button onClick={toggleProfile} className="h-8 w-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition-colors">
              <UserCircleIcon />
            </button>
            {profileOpen && (
              <button
                aria-hidden="true"
                onClick={() => setProfileOpen(false)}
                className="fixed inset-0 z-40 bg-transparent cursor-default"
              />
            )}
            {profileOpen && <ProfileDropdown onClose={() => setProfileOpen(false)} onInstallClick={handleInstallClick} isInstallable={!!installPrompt} />}
          </div>
          <button onClick={onLogout} className="text-gray-600 dark:text-gray-300" title="Sair">
            <LogoutIcon />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-brand-950">
        <PageTransition id={(location as any).key ?? (location.pathname + location.search)}>
          <Outlet />
        </PageTransition>
      </main>

      <footer className="bg-white dark:bg-gray-800 shadow-[0_-2px_5px_-1px_rgba(0,0,0,0.1)] sticky bottom-0">
        <nav className="flex justify-around items-center p-2">
          {navItems
            .filter((item) => permissions[item.permission as keyof typeof permissions])
            .map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center w-full p-2 rounded-lg transition-colors duration-200 ${isActive ? 'text-brand-600 dark:text-brand-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`
                }
              >
                {item.icon}
                <span className="text-xs mt-1">{item.label}</span>
              </NavLink>
            ))}
        </nav>

        {/* Links para download do app - apenas na web */}
        {typeof window !== 'undefined' && !(window as any).Capacitor && (
          <div className="border-t dark:border-gray-700 py-3 px-4">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Baixe o app:</span>
              <div className="flex gap-3">
                <a
                  href="https://apps.apple.com/app/qr-vendas"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-xs"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 22C7.79 22.05 6.8 20.68 5.96 19.47C4.25 17 2.94 12.45 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5M13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z" />
                  </svg>
                  <span>App Store</span>
                </a>
                <a
                  href="https://play.google.com/store/apps/details?id=com.qrvendas.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-xs"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                  </svg>
                  <span>Google Play</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </footer>
    </div>
  );
};

export default Layout;
