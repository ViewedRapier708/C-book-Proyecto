import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Search, LayoutDashboard, BookOpen, Monitor, PenTool, Users,
  FileText, ClipboardList, BookCheck, Package, BarChart3, Settings
} from 'lucide-react';

const allCommands = [
  // Admin
  { label: 'Inicio', to: '/admin', icon: LayoutDashboard, role: 'Admin' },
  { label: 'Analytics', to: '/admin/analytics', icon: BarChart3, role: 'Admin' },
  { label: 'Libros (Alta)', to: '/admin/libros', icon: BookOpen, role: 'Admin' },
  { label: 'Computadoras (Alta)', to: '/admin/computadoras', icon: Monitor, role: 'Admin' },
  { label: 'Restiradores (Alta)', to: '/admin/restiradores', icon: PenTool, role: 'Admin' },
  { label: 'Usuarios', to: '/admin/usuarios', icon: Users, role: 'Admin' },
  { label: 'Documentos', to: '/admin/documentos', icon: FileText, role: 'Admin' },
  { label: 'Solicitudes Libros', to: '/admin/solicitudes-libros', icon: ClipboardList, role: 'Admin' },
  { label: 'Préstamos Libros', to: '/admin/prestamos-libros', icon: BookCheck, role: 'Admin' },
  { label: 'Reportes', to: '/admin/reportes', icon: FileText, role: 'Admin' },
  // User
  { label: 'Inicio', to: '/user', icon: LayoutDashboard, role: 'alumno' },
  { label: 'Computadoras', to: '/user/computadoras', icon: Monitor, role: 'alumno' },
  { label: 'Libros', to: '/user/libros', icon: BookOpen, role: 'alumno' },
  { label: 'Restiradores', to: '/user/restiradores', icon: PenTool, role: 'alumno' },
  { label: 'Mis Solicitudes', to: '/user/mis-solicitudes', icon: Package, role: 'alumno' },
  { label: 'Solicitudes Libros', to: '/user/mis-solicitudes-libros', icon: BookOpen, role: 'alumno' },
  { label: 'Mi Perfil', to: '/user/perfil', icon: Settings, role: 'alumno' },
];

export default function CommandPalette({ open, onClose }) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const location = useLocation();

  const commands = useMemo(() => {
    if (!user) return [];
    const roleCommands = allCommands.filter(c => c.role === user.rol);
    if (!query.trim()) return roleCommands;
    const q = query.toLowerCase();
    return roleCommands.filter(c => c.label.toLowerCase().includes(q));
  }, [user, query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setSelected(0);
  }, [query]);

  const go = (to) => {
    navigate(to);
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected(s => Math.min(s + 1, commands.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected(s => Math.max(s - 1, 0));
    } else if (e.key === 'Enter' && commands[selected]) {
      go(commands[selected].to);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="cmd-palette-overlay" onClick={onClose}>
      <div className="cmd-palette" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0 1.25rem' }}>
          <Search size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            className="cmd-palette-input"
            style={{ paddingLeft: 0, borderBottom: 'none' }}
            placeholder="Buscar páginas y acciones..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <span className="cmd-palette-kbd">ESC</span>
        </div>
        <div style={{ borderTop: '1px solid var(--border-color)' }} />
        <div className="cmd-palette-results">
          {commands.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No se encontraron resultados
            </div>
          ) : (
            commands.map((cmd, i) => (
              <div
                key={cmd.to}
                className={`cmd-palette-item ${i === selected ? 'selected' : ''}`}
                onClick={() => go(cmd.to)}
                onMouseEnter={() => setSelected(i)}
              >
                <cmd.icon size={18} />
                <span>{cmd.label}</span>
                {location.pathname === cmd.to && (
                  <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--accent-primary)' }}>actual</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
