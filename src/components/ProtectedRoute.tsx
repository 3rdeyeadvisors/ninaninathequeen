import { Navigate, useLocation } from 'react-router-dom';
import { useCloudAuthStore } from '@/stores/cloudAuthStore';
import { ReactNode } from 'react';
import { LoadingScreen } from '@/components/LoadingScreen';

interface ProtectedRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
}

export const ProtectedRoute = ({ children, adminOnly = false }: ProtectedRouteProps) => {
  const { isAuthenticated, user: cloudUser, isLoading } = useCloudAuthStore();
  const location = useLocation();

  // Show loading placeholder while checking auth
  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    // Redirect to login page if not authenticated
    return <Navigate to="/account" state={{ from: location }} replace />;
  }

  // Admin access should only be determined by cloudUser?.isAdmin
  const isAdmin = cloudUser?.isAdmin;

  if (adminOnly && !isAdmin) {
    // Redirect to home if trying to access admin page without admin privileges
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
