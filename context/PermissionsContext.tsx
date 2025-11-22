// context/PermissionsContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import type { UserPermissions } from '../types';

const PermissionsContext = createContext<UserPermissions | undefined>(undefined);

const getRolePermissions = (role: string, isSuperAdmin: boolean): UserPermissions => {
    // Super Admin tem acesso a tudo
    if (isSuperAdmin) {
        return {
            canAccessPOS: true,
            canAccessProducts: true,
            canAccessClients: true,
            canAccessDocuments: true,
            canAccessReports: true,
            canAccessFinances: true,
            canAccessStockControl: true,
            canAccessSettings: true,
            canManageEmployees: true,
            canManageStore: true,
            isSuperAdmin: true,
        };
    }

    switch (role) {
        case 'operator': // Vendedor
            return {
                canAccessPOS: true,
                canAccessProducts: false,
                canAccessClients: false,
                canAccessDocuments: false,
                canAccessReports: false,
                canAccessFinances: false,
                canAccessStockControl: false,
                canAccessSettings: false,
                canManageEmployees: false,
                canManageStore: false,
                isSuperAdmin: false,
            };

        case 'manager': // Gerente
            return {
                canAccessPOS: true,
                canAccessProducts: true,
                canAccessClients: true,
                canAccessDocuments: true,
                canAccessReports: true,
                canAccessFinances: true,
                canAccessStockControl: true,
                canAccessSettings: true,
                canManageEmployees: true,
                canManageStore: false, // Gerente NÃO pode alterar dados da loja
                isSuperAdmin: false,
            };

        case 'owner': // Dono
            return {
                canAccessPOS: true,
                canAccessProducts: true,
                canAccessClients: true,
                canAccessDocuments: true,
                canAccessReports: true,
                canAccessFinances: true,
                canAccessStockControl: true,
                canAccessSettings: true,
                canManageEmployees: true,
                canManageStore: true, // Dono pode alterar dados da loja
                isSuperAdmin: false,
            };

        default:
            // Permissões padrão (acesso total para compatibilidade com usuários antigos)
            return {
                canAccessPOS: true,
                canAccessProducts: true,
                canAccessClients: true,
                canAccessDocuments: true,
                canAccessReports: true,
                canAccessFinances: true,
                canAccessStockControl: true,
                canAccessSettings: true,
                canManageEmployees: true,
                canManageStore: true,
                isSuperAdmin: false,
            };
    }
};

export const PermissionsProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
    const { user } = useAuth();
    const [permissions, setPermissions] = useState<UserPermissions>(getRolePermissions('owner', false));

    useEffect(() => {
        if (!user) {
            // Sem usuário, usar permissões padrão
            setPermissions(getRolePermissions('owner', false));
            return;
        }

        const fetchUserRole = async () => {
            try {
                // 1. Verificar se é super admin (profiles.role = 'admin')
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (profile?.role === 'admin') {
                    console.log('🔐 Permissions: Super Admin detectado');
                    setPermissions(getRolePermissions('admin', true));
                    return;
                }

                // 2. Buscar role do user_establishments
                const { data: userEst } = await supabase
                    .from('user_establishments')
                    .select('role')
                    .eq('user_id', user.id)
                    .maybeSingle();

                const role = userEst?.role || 'owner'; // Default: owner para compatibilidade
                console.log(`🔐 Permissions: Role = ${role}`);
                setPermissions(getRolePermissions(role, false));
            } catch (error) {
                console.error('❌ Erro ao buscar permissões:', error);
                // Em caso de erro, dar permissões padrão
                setPermissions(getRolePermissions('owner', false));
            }
        };

        fetchUserRole();
    }, [user]);

    return (
        <PermissionsContext.Provider value={permissions}>
            {children}
        </PermissionsContext.Provider>
    );
};

export const usePermissions = () => {
    const ctx = useContext(PermissionsContext);
    if (!ctx) throw new Error('usePermissions must be used within PermissionsProvider');
    return ctx;
};
