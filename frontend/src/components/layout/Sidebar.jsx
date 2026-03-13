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
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-[99] transition-opacity duration-300 md:hidden ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      <aside className={`fixed top-0 left-0 bottom-0 w-[260px] bg-[var(--bg-sidebar)] backdrop-blur-xl border-r border-[var(--border-color)] flex flex-col z-[100] transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-y-auto md:translate-x-0 ${open ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
        {/* Brand */}
        <div className="px-5 pt-6 pb-4 border-b border-[var(--border-color)]">
          <h2 className="text-xl font-bold bg-gradient-to-r from-primary-500 via-purple-500 to-accent-500 bg-clip-text text-transparent">
            📚 C-Book
          </h2>
          <small className="text-[0.7rem] text-[var(--text-muted)] uppercase tracking-widest mt-1 block">
            {isAdmin ? 'Panel Administrador' : 'Panel Alumno'}
          </small>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 flex flex-col gap-0.5">
          {links.map((item, i) =>
            item.section ? (
              <div key={`s-${i}`} className="text-[0.65rem] font-bold uppercase tracking-widest text-[var(--text-muted)] px-2 pt-4 pb-1.5">
                {item.section}
              </div>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative overflow-hidden ${
                    isActive
                      ? 'bg-gradient-to-r from-primary-500 to-purple-500 text-white shadow-lg shadow-primary-500/25'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-glass-strong)] hover:text-[var(--text-primary)]'
                  }`
                }
                onClick={onClose}
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            )
          )}
        </nav>

        {/* Footer */}
        <div className="p-5 border-t border-[var(--border-color)]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {user?.boleta?.slice(0, 2) || '??'}
            </div>
            <div className="overflow-hidden">
              <strong className="block text-sm text-[var(--text-primary)] truncate">{user?.boleta}</strong>
              <span className="block text-xs text-[var(--text-muted)] truncate">{user?.correo || ''}</span>
            </div>
          </div>
          <button
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/20 text-white/80 hover:text-white hover:bg-white/10 transition-all text-sm font-medium"
            onClick={handleLogout}
          >
            <LogOut size={16} /> Cerrar Sesión
          </button>
        </div>
      </aside>
    </>
  );
}
