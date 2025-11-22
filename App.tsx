import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PermissionsProvider } from './context/PermissionsContext';
import { useData } from './context/DataContext';
import { ToastProvider } from './context/ToastContext';
import Loader from './components/Loader';
import SplashScreen from './components/SplashScreen';
import LoginPage from './pages/LoginPage';
import RegistrationPage from './pages/RegistrationPage';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import ProductsPage from './pages/ProductsPage';
import POSPage from './pages/POSPage';
import ReportsPage from './pages/ReportsPage';
import PrintLabelsPage from './pages/PrintLabelsPage';
import DocumentsPage from './pages/DocumentsPage';
import ClientsPage from './pages/ClientsPage';
import StoreDataPage from './pages/StoreDataPage';
import UserDataPage from './pages/UserDataPage';
import SettingsPage from './pages/SettingsPage';
import LandingPage from './pages/LandingPage';
import FinancesPage from './pages/FinancesPage';
import DocumentDetailPage from './pages/DocumentDetailPage';
import DocumentsHistoryPage from './pages/DocumentsHistoryPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import StockControlPage from './pages/StockControlPage';
import StockEntriesHistoryPage from './pages/StockEntriesHistoryPage';
import StockExitsHistoryPage from './pages/StockExitsHistoryPage';
import SuccessPage from './pages/SuccessPage';
import EmployeesPage from './pages/EmployeesPage';

function AppRoutes() {
    const { user, signOut, loading: authLoading } = useAuth();
    const { isLoaded } = useData();

    useEffect(() => {
        // Apply theme on initial load
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);

    if (authLoading || !isLoaded) {
        return <Loader fullscreen label="A preparar a aplicação..." />;
    }
    return (
        <HashRouter>
            <Routes>
                {user ? (
                    <Route path="/" element={<Layout onLogout={signOut} />}>
                        <Route index element={<Navigate to="/pos" replace />} />
                        <Route path="pos" element={<POSPage />} /> {/* POS sempre acessível */}
                        <Route path="products" element={<ProtectedRoute requiredPermission="canAccessProducts"><ProductsPage /></ProtectedRoute>} />
                        <Route path="reports" element={<ProtectedRoute requiredPermission="canAccessReports"><ReportsPage /></ProtectedRoute>} />
                        <Route path="documents" element={<ProtectedRoute requiredPermission="canAccessDocuments"><DocumentsPage /></ProtectedRoute>} />
                        <Route path="documents/history" element={<ProtectedRoute requiredPermission="canAccessDocuments"><DocumentsHistoryPage /></ProtectedRoute>} />
                        <Route path="documents/:id" element={<ProtectedRoute requiredPermission="canAccessDocuments"><DocumentDetailPage /></ProtectedRoute>} />
                        <Route path="clients" element={<ProtectedRoute requiredPermission="canAccessClients"><ClientsPage /></ProtectedRoute>} />
                        <Route path="print-labels" element={<ProtectedRoute requiredPermission="canAccessProducts"><PrintLabelsPage /></ProtectedRoute>} />
                        <Route path="store" element={<ProtectedRoute requiredPermission="canManageStore"><StoreDataPage /></ProtectedRoute>} />
                        <Route path="user" element={<UserDataPage />} /> {/* Dados do usuário sempre acessível */}
                        <Route path="settings" element={<ProtectedRoute requiredPermission="canAccessSettings"><SettingsPage /></ProtectedRoute>} />
                        <Route path="finances" element={<ProtectedRoute requiredPermission="canAccessFinances"><FinancesPage /></ProtectedRoute>} />
                        <Route path="stock-control" element={<ProtectedRoute requiredPermission="canAccessStockControl"><StockControlPage /></ProtectedRoute>} />
                        <Route path="stock-control/entries" element={<ProtectedRoute requiredPermission="canAccessStockControl"><StockEntriesHistoryPage /></ProtectedRoute>} />
                        <Route path="stock-control/exits" element={<ProtectedRoute requiredPermission="canAccessStockControl"><StockExitsHistoryPage /></ProtectedRoute>} />
                        <Route path="employees" element={<ProtectedRoute requiredPermission="canManageEmployees"><EmployeesPage /></ProtectedRoute>} />
                        {/* Redirect any other authenticated path to POS */}
                        <Route path="*" element={<Navigate to="/pos" replace />} />
                    </Route>
                ) : (
                    <>
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegistrationPage />} />
                        <Route path="/success" element={<SuccessPage />} />
                        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </>
                )}
            </Routes>
        </HashRouter>
    );
}

function App() {
    const [showSplash, setShowSplash] = useState(true);

    useEffect(() => {
        // Apply theme on initial load
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);

    // Mostrar splash apenas na primeira vez
    if (showSplash) {
        return (
            <SplashScreen
                duration={5000}
                onComplete={() => setShowSplash(false)}
            />
        );
    }

    return (
        <AuthProvider>
            <PermissionsProvider>
                <ToastProvider>
                    <DataProvider>
                        <AppRoutes />
                    </DataProvider>
                </ToastProvider>
            </PermissionsProvider>
        </AuthProvider>
    );
}

export default App;
