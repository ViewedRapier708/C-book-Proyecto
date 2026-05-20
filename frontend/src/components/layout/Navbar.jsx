import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard, BookOpen, Users,
  FileText, ClipboardList, LogOut, Package,
  BarChart3, FileBarChart, UserCircle, Settings,
  ChevronDown, Menu, X, GraduationCap, Headphones,
} from 'lucide-react';
import { isSupportAdmin, isSupportRole } from '../../utils/authRoutes';

const adminLinks = [
  { section: 'General' },
  { to: '/admin', icon: LayoutDashboard, label: 'Inicio', end: true },
  { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/admin/reportes', icon: FileBarChart, label: 'Reportes' },
  { section: 'Altas' },
  { to: '/admin/alumnos', icon: GraduationCap, label: 'Alumnos' },
  { to: '/admin/libros', icon: BookOpen, label: 'Libros' },
  { section: 'Gestion' },
  { to: '/admin/usuarios', icon: Users, label: 'Usuarios' },
  { to: '/admin/documentos', icon: FileText, label: 'Documentos' },
  { to: '/admin/solicitudes-libros', icon: ClipboardList, label: 'Solicitudes Libros' },
  { to: '/admin/prestamos-libros', icon: BookOpen, label: 'Prestamos Libros' },
];

const userLinks = [
  { section: 'General' },
  { to: '/user', icon: LayoutDashboard, label: 'Inicio', end: true },
  { section: 'Servicios' },
  { to: '/user/libros', icon: BookOpen, label: 'Libros' },
  { section: 'Mis Solicitudes' },
  { to: '/user/mis-solicitudes', icon: Package, label: 'Solicitudes' },
  { to: '/user/mis-solicitudes-libros', icon: BookOpen, label: 'Solicitudes Libros' },
  { section: 'Cuenta' },
  { to: '/user/perfil', icon: UserCircle, label: 'Mi Perfil' },
  { to: '/user/cuenta', icon: Settings, label: 'Cambiar Contrasena' },
];

function supportLinks(role) {
  return [
    { section: 'Soporte' },
    { to: '/soporte', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/soporte/tickets', icon: ClipboardList, label: 'Tickets' },
    { to: '/soporte/reportar', icon: Headphones, label: 'Reportar error' },
    ...(isSupportAdmin(role) ? [{ section: 'Administracion' }, { to: '/soporte/config', icon: Settings, label: 'Configuracion' }] : []),
  ];
}

function getLinks(user) {
  if (user?.rol === 'Admin') return adminLinks;
  if (isSupportRole(user?.rol)) return supportLinks(user.rol);
  return userLinks;
}

function getRoleLabel(user) {
  if (user?.rol === 'Admin') return 'Admin biblioteca';
  if (user?.rol === 'support_admin') return 'Admin soporte';
  if (user?.rol === 'support_agent') return 'Agente soporte';
  return 'Alumno';
}

function DropdownMenu({ section, items, onClose }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-glass-strong)] hover:text-[var(--text-primary)] transition-all"
      >
        {section}
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 min-w-[200px] bg-[var(--bg-card)] backdrop-blur-xl border border-[var(--border-color)] rounded-lg shadow-xl py-1 z-50">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[var(--button-primary-bg)] text-white'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-glass-strong)] hover:text-[var(--text-primary)]'
                }`
              }
              onClick={() => {
                setIsOpen(false);
                onClose?.();
              }}
            >
              <item.icon size={16} />
              {item.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

function UserMenu({ user, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const label = user?.boleta || user?.email || user?.correo || 'Usuario';

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[var(--bg-glass-strong)] transition-all"
      >
        <div className="w-8 h-8 rounded-full bg-[image:var(--gradient-primary)] flex items-center justify-center text-xs font-bold text-white">
          {String(label).slice(0, 2).toUpperCase()}
        </div>
        <div className="hidden md:block text-left">
          <strong className="block text-xs text-[var(--text-primary)]">{label}</strong>
          <span className="block text-[0.65rem] text-[var(--text-muted)]">{getRoleLabel(user)}</span>
        </div>
        <ChevronDown size={14} className={`hidden md:block text-[var(--text-muted)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-64 bg-[var(--bg-card)] backdrop-blur-xl border border-[var(--border-color)] rounded-lg shadow-xl py-2 z-50">
          <div className="px-3 py-2 border-b border-[var(--border-color)]">
            <strong className="block text-sm text-[var(--text-primary)]">{label}</strong>
            <span className="block text-xs text-[var(--text-muted)] truncate">{user?.correo || user?.email || getRoleLabel(user)}</span>
          </div>
          {!isSupportRole(user?.rol) && (
            <>
              <div className="px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-widest text-[var(--text-muted)] border-b border-[var(--border-color)]">Soporte</div>
              <NavLink
                to={user?.rol === 'Admin' ? '/admin/soporte/reportar' : '/user/soporte/reportar'}
                className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-glass-strong)] hover:text-[var(--text-primary)] transition-all"
                onClick={() => setIsOpen(false)}
              >
                <Headphones size={16} />
                Reportar error
              </NavLink>
              {user?.rol !== 'Admin' && (
                <NavLink
                  to="/user/soporte/mis-reportes"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-glass-strong)] hover:text-[var(--text-primary)] transition-all"
                  onClick={() => setIsOpen(false)}
                >
                  <ClipboardList size={16} />
                  Mis reportes
                </NavLink>
              )}
            </>
          )}
          <button
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-glass-strong)] hover:text-[var(--text-primary)] transition-all"
            onClick={() => {
              setIsOpen(false);
              onLogout();
            }}
          >
            <LogOut size={16} />
            Cerrar Sesion
          </button>
        </div>
      )}
    </div>
  );
}

export default function Navbar({ onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = getLinks(user);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const sections = [];
  let currentSection = null;

  links.forEach((item) => {
    if (item.section) {
      currentSection = { name: item.section, items: [] };
      sections.push(currentSection);
    } else if (currentSection) {
      currentSection.items.push(item);
    }
  });

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    onClose?.();
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-[99] transition-opacity duration-300 lg:hidden ${
          mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileMenuOpen(false)}
      />

      <div
        className={`fixed top-0 right-0 bottom-0 w-[280px] bg-[var(--bg-sidebar)] backdrop-blur-xl border-l border-[var(--border-color)] z-[100] transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-y-auto lg:hidden ${
          mobileMenuOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 h-16 border-b border-[var(--border-color)]">
          <h2 className="text-lg font-bold text-[var(--accent-primary)]">C-Book</h2>
          <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-lg hover:bg-[var(--bg-glass-strong)] transition-colors">
            <X size={20} />
          </button>
        </div>

        <nav className="p-3">
          {sections.map((section) => (
            <div key={section.name} className="mb-4">
              <div className="text-[0.65rem] font-bold uppercase tracking-widest text-[var(--text-muted)] px-2 pb-2">
                {section.name}
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-[var(--button-primary-bg)] text-white shadow-lg'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-glass-strong)] hover:text-[var(--text-primary)]'
                      }`
                    }
                    onClick={closeMobileMenu}
                  >
                    <item.icon size={18} />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </div>

      <nav className="fixed top-0 left-0 right-0 h-16 bg-[var(--bg-sidebar)] backdrop-blur-xl border-b border-[var(--border-color)] z-[100] px-4 md:px-6">
        <div className="h-full flex items-center justify-between gap-4 max-w-[1600px] mx-auto">
          <div className="flex-shrink-0">
            <h2 className="text-lg font-bold text-[var(--accent-primary)]">C-Book</h2>
            <small className="text-[0.6rem] text-[var(--text-muted)] uppercase tracking-widest hidden sm:block">
              {getRoleLabel(user)}
            </small>
          </div>

          <div className="hidden lg:flex items-center gap-1 flex-1 justify-center">
            {sections.map((section) => (
              <DropdownMenu key={section.name} section={section.name} items={section.items} onClose={onClose} />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden lg:block">
              <UserMenu user={user} onLogout={handleLogout} />
            </div>
            <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-[var(--bg-glass-strong)] transition-colors">
              <Menu size={22} />
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
