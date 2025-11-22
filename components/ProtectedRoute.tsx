// components/ProtectedRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions } from '../context/PermissionsContext';
import type { UserPermissions } from '../types';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredPermission: keyof UserPermissions;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredPermission }) => {
    const permissions = usePermissions();

    if (!permissions[requiredPermission]) {
        // Redirecionar para POS se não tiver permissão
        console.warn(`⚠️ Acesso negado: ${requiredPermission} = false, redirecionando para /pos`);
        return <Navigate to="/pos" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
