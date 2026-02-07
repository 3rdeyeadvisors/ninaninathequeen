import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore, ADMIN_EMAIL } from '@/stores/authStore';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
}

export const ProtectedRoute = ({ children, adminOnly = false }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to login page if not authenticated
    return <Navigate to="/account" state={{ from: location }} replace />;
  }

  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() ||
                  ['admin', 'manager', 'founder & owner'].includes(user?.role?.toLowerCase() || '');

  if (adminOnly && !isAdmin) {
    // Redirect to home if trying to access admin page without admin privileges
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
