import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="spinner-container" style={{ minHeight: '100vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;
  if (role && user.rol !== role) {
    return <Navigate to={user.rol === 'Admin' ? '/admin' : '/user'} replace />;
  }

  return children;
}
