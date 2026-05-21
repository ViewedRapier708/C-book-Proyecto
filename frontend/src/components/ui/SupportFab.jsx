import { Headphones } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { isSupportRole } from '../../utils/authRoutes';
import '../../styles/support.css';

export default function SupportFab() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const target = isSupportRole(user?.rol)
    ? '/soporte/reportar'
    : user?.rol === 'Admin'
      ? '/admin/soporte/reportar'
    : user
      ? '/user/soporte/reportar'
      : '/soporte/reportar';

  const active = location.pathname.startsWith('/admin/soporte') ||
    location.pathname.startsWith('/user/soporte') ||
    location.pathname.startsWith('/soporte');

  return (
    <button
      type="button"
      className={`support-fab ${active ? 'support-fab-active' : ''}`}
      onClick={() => navigate(target)}
      aria-label="Soporte"
      title="Soporte"
    >
      <Headphones size={18} />
      <span>Soporte</span>
    </button>
  );
}
