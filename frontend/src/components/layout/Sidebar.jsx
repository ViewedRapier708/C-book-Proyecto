import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, BookOpen, Monitor, PenTool, Users,
  FileText, ClipboardList, LogOut, BookCheck, Package,
  BarChart3, FileBarChart, UserCircle
} from 'lucide-react';

const adminLinks = [
  { section: 'General' },
  { to: '/admin', icon: LayoutDashboard, label: 'Inicio', end: true },
  { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/admin/reportes', icon: FileBarChart, label: 'Reportes' },
  { section: 'Altas' },
  { to: '/admin/libros', icon: BookOpen, label: 'Libros' },
  { to: '/admin/computadoras', icon: Monitor, label: 'Computadoras' },
  { to: '/admin/restiradores', icon: PenTool, label: 'Restiradores' },
  { section: 'Gestión' },
  { to: '/admin/usuarios', icon: Users, label: 'Usuarios' },
  { to: '/admin/documentos', icon: FileText, label: 'Documentos' },
  { to: '/admin/solicitudes-libros', icon: ClipboardList, label: 'Solicitudes Libros' },
  { to: '/admin/prestamos-libros', icon: BookCheck, label: 'Préstamos Libros' },
];

const userLinks = [
  { section: 'General' },
  { to: '/user', icon: LayoutDashboard, label: 'Inicio', end: true },
  { section: 'Servicios' },
  { to: '/user/computadoras', icon: Monitor, label: 'Computadoras' },
  { to: '/user/libros', icon: BookOpen, label: 'Libros' },
  { to: '/user/restiradores', icon: PenTool, label: 'Restiradores' },
  { section: 'Mis Solicitudes' },
  { to: '/user/mis-solicitudes', icon: Package, label: 'Solicitudes' },
  { to: '/user/mis-solicitudes-libros', icon: BookOpen, label: 'Solicitudes Libros' },
  { section: 'Cuenta' },
  { to: '/user/perfil', icon: UserCircle, label: 'Mi Perfil' },
];

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.rol === 'Admin';
  const links = isAdmin ? adminLinks : userLinks;

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <>
      <div className={`overlay ${open ? 'open' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <h2>📚 C-Book</h2>
          <small>{isAdmin ? 'Panel Administrador' : 'Panel Alumno'}</small>
        </div>

        <nav className="sidebar-nav">
          {links.map((item, i) =>
            item.section ? (
              <div className="sidebar-section" key={`s-${i}`}>{item.section}</div>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            )
          )}
        </nav>

        <div className="sidebar-footer">
          <div style={{ fontSize: '0.82rem', marginBottom: '0.75rem', color: 'var(--text-sidebar)' }}>
            <strong style={{ color: '#fff' }}>{user?.boleta}</strong><br />
            {user?.correo || ''}
          </div>
          <button className="btn btn-outline" style={{ width: '100%', color: '#fff', borderColor: 'rgba(255,255,255,.2)' }} onClick={handleLogout}>
            <LogOut size={16} /> Cerrar Sesión
          </button>
        </div>
      </aside>
    </>
  );
}
