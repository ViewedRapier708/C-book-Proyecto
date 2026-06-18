import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard, BookOpen, Users,
  FileText, ClipboardList, LogOut,
  FileBarChart, UserCircle,
  ChevronDown, GraduationCap, Headphones, ClipboardCheck, MoreHorizontal,
} from 'lucide-react';
import { isSupportAdmin, isSupportRole } from '../../utils/authRoutes';
import Modal from '../ui/Modal';
import { openSatisfactionSurvey } from '../../constants/survey';

const adminLinks = [
  { section: 'General' },
  { to: '/admin', icon: LayoutDashboard, label: 'Inicio', end: true },
  { to: '/admin/reportes', icon: FileBarChart, label: 'Reportes' },
  { section: 'Altas' },
  { to: '/admin/alumnos', icon: GraduationCap, label: 'Alumnos' },
  { to: '/admin/libros', icon: BookOpen, label: 'Libros' },
  { section: 'Gestion' },
  { to: '/admin/usuarios', icon: Users, label: 'Usuarios' },
  { to: '/admin/documentos', icon: FileText, label: 'Documentos' },
  { to: '/admin/solicitudes-libros', icon: ClipboardList, label: 'Solicitudes de libros' },
  { to: '/admin/prestamos-libros', icon: BookOpen, label: 'Prestamos de libros activos' },
];

const userLinks = [
  { section: 'General' },
  { to: '/user', icon: LayoutDashboard, label: 'Inicio', end: true },
  { section: 'Servicios' },
  { to: '/user/libros', icon: BookOpen, label: 'Libros' },
  { section: 'Mis Solicitudes' },
  { to: '/user/mis-solicitudes-libros', icon: BookOpen, label: 'Mis solicitudes de libros' },
  { section: 'Cuenta' },
  { to: '/user/perfil', icon: UserCircle, label: 'Mi Perfil' },
];

const LOGO_SRC = '/images/cbook-logo.jpeg';
const MOBILE_PRIMARY_LINKS = 4;

function supportLinks(role) {
  return [
    { section: 'Soporte' },
    { to: '/soporte', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/soporte/tickets', icon: ClipboardList, label: 'Tikets' },
    ...(isSupportAdmin(role) ? [
      { section: 'Equipo' },
      { to: '/soporte/agregar-agente', icon: Users, label: 'Agregar agente de soporte' },
    ] : []),
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
        <div className="hidden md:block text-left max-w-[180px]">
          <strong className="block text-xs text-[var(--text-primary)] truncate">{label}</strong>
          <span className="block text-[0.65rem] text-[var(--text-muted)] truncate">{getRoleLabel(user)}</span>
        </div>
        <ChevronDown size={14} className={`hidden md:block text-[var(--text-muted)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="dropdown-menu absolute top-full right-0 mt-1 w-64 backdrop-blur-xl rounded-lg shadow-xl py-2 z-50">
          <div className="dropdown-header px-3 py-2">
            <strong className="block text-sm break-all">{label}</strong>
            <span className="block text-xs break-all">{user?.correo || user?.email || getRoleLabel(user)}</span>
          </div>
          {!isSupportRole(user?.rol) && (
            <>
              <div className="dropdown-section-label">Soporte</div>
              <NavLink
                to={user?.rol === 'Admin' ? '/admin/soporte/reportar' : '/user/soporte/reportar'}
                className="dropdown-item flex items-center gap-2 px-3 py-2 text-sm"
                onClick={() => setIsOpen(false)}
              >
                <Headphones size={16} />
                Reportar error
              </NavLink>
              {user?.rol !== 'Admin' && (
                <NavLink
                  to="/user/soporte/mis-reportes"
                  className="dropdown-item flex items-center gap-2 px-3 py-2 text-sm"
                  onClick={() => setIsOpen(false)}
                >
                  <ClipboardList size={16} />
                  Mis reportes
                </NavLink>
              )}
            </>
          )}
          <button
            className="dropdown-item flex items-center gap-2 px-3 py-2 text-sm"
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
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [showSurveyLogoutModal, setShowSurveyLogoutModal] = useState(false);

  const finishLogout = async () => {
    setShowSurveyLogoutModal(false);
    await logout();
    navigate('/', { replace: true });
  };

  const handleLogout = () => {
    if (user?.rol === 'alumno') {
      setShowSurveyLogoutModal(true);
      return;
    }

    finishLogout();
  };

  const handleSurveyAndLogout = async () => {
    openSatisfactionSurvey();
    await finishLogout();
  };

  const navLinks = links.filter((item) => !item.section);
  const primaryMobileLinks = navLinks.slice(0, MOBILE_PRIMARY_LINKS);
  const overflowMobileLinks = navLinks.slice(MOBILE_PRIMARY_LINKS);

  const closeMobileMore = () => {
    setMobileMoreOpen(false);
    onClose?.();
  };

  return (
    <>
      <nav className="main-nav fixed top-0 left-0 right-0 h-16 backdrop-blur-xl z-[100] px-4 md:px-6">
        <div className="h-full flex items-center justify-between gap-4 max-w-[1600px] mx-auto">
          <div className="flex-shrink-0">
            <div className="brand-mark">
              <img src={LOGO_SRC} alt="" className="brand-logo" />
              <h2 className="text-lg font-bold">C-Book</h2>
            </div>
            <small className="main-nav-label">
              {getRoleLabel(user)}
            </small>
          </div>

          <div className="hidden lg:flex items-center gap-1 flex-1 justify-center">
            {navLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `mobile-nav-link flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'active'
                      : ''
                  }`
                }
                onClick={onClose}
              >
                <item.icon size={16} />
                {item.label}
              </NavLink>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden lg:block">
              <UserMenu user={user} onLogout={handleLogout} />
            </div>
            <div className="lg:hidden">
              <UserMenu user={user} onLogout={handleLogout} />
            </div>
          </div>
        </div>
      </nav>

      <nav className="bottom-tab-bar lg:hidden" aria-label="Navegacion principal">
        {primaryMobileLinks.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `bottom-tab-link ${isActive ? 'active' : ''}`}
            onClick={closeMobileMore}
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </NavLink>
        ))}

        {overflowMobileLinks.length > 0 && (
          <div className="bottom-tab-more">
            <button
              type="button"
              className={`bottom-tab-link bottom-tab-more-btn ${mobileMoreOpen ? 'active' : ''}`}
              onClick={() => setMobileMoreOpen((open) => !open)}
              aria-expanded={mobileMoreOpen}
            >
              <MoreHorizontal size={18} />
              <span>Mas</span>
            </button>

            {mobileMoreOpen && (
              <div className="bottom-tab-overflow">
                {overflowMobileLinks.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) => `bottom-tab-overflow-link ${isActive ? 'active' : ''}`}
                    onClick={closeMobileMore}
                  >
                    <item.icon size={17} />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
                <button
                  type="button"
                  className="bottom-tab-overflow-link bottom-tab-overflow-logout"
                  onClick={() => {
                    closeMobileMore();
                    handleLogout();
                  }}
                >
                  <LogOut size={17} />
                  <span>Cerrar Sesion</span>
                </button>
              </div>
            )}
          </div>
        )}
      </nav>

      <Modal
        open={showSurveyLogoutModal}
        onClose={() => setShowSurveyLogoutModal(false)}
        title="Antes de irte"
        footer={
          <>
            <button className="btn btn-ghost" onClick={finishLogout}>
              Cerrar sesión de todas formas
            </button>
            <button className="btn btn-success" onClick={handleSurveyAndLogout}>
              <ClipboardCheck size={16} />
              Contestar encuesta
            </button>
          </>
        }
      >
        <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Gracias por usar C-Book. Antes de cerrar sesión, ¿podrías contestar nuestra encuesta de satisfacción? Tus comentarios nos ayudan a mejorar el servicio para ti y tus compañeros.
        </p>
      </Modal>
    </>
  );
}
