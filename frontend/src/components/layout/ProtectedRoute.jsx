import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getHomePath } from '../../utils/authRoutes';

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
  const allowedRoles = Array.isArray(role) ? role : role ? [role] : [];
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.rol)) {
    return <Navigate to={getHomePath(user)} replace />;
  }

  return children;
}
