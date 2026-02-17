import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useCloudAuthStore } from '@/stores/cloudAuthStore';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
}

export const ProtectedRoute = ({ children, adminOnly = false }: ProtectedRouteProps) => {
  const { isAuthenticated: legacyAuth, user: legacyUser } = useAuthStore();
  const { isAuthenticated: cloudAuth, user: cloudUser, isLoading } = useCloudAuthStore();
  const location = useLocation();

  // Consider authenticated if either legacy or cloud auth is active
  const isAuthenticated = legacyAuth || cloudAuth;
  
  // Show nothing while checking auth
  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    // Redirect to login page if not authenticated
    return <Navigate to="/account" state={{ from: location }} replace />;
  }

  // Check admin status from either auth system
  const isLegacyAdmin = ['admin', 'manager', 'founder & owner'].includes(legacyUser?.role?.toLowerCase() || '');
  const isCloudAdmin = cloudUser?.isAdmin;
  
  const isAdmin = isLegacyAdmin || isCloudAdmin;

  if (adminOnly && !isAdmin) {
    // Redirect to home if trying to access admin page without admin privileges
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
