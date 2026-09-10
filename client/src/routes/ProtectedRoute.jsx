import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from '../components/LoadingScreen';

export default function ProtectedRoute({ children, roles }) {
  const { status, hasRole } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <LoadingScreen />;
  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (roles && roles.length > 0 && !roles.some((r) => hasRole(r))) {
    return <Navigate to="/app" replace />;
  }
  return children;
}
