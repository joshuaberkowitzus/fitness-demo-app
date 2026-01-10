/**
 * Protected Route Component (T051)
 * 
 * Wrapper that redirects to login if user is not authenticated.
 */

import { Navigate, useLocation } from 'react-router-dom';
import { LoadingSpinner } from './index';
import { useAuthContext } from '../../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuthContext();
  const location = useLocation();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    // Redirect to login, preserving the intended destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return <>{children}</>;
}

export default ProtectedRoute;
