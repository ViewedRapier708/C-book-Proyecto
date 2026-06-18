import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Search, LayoutDashboard, BookOpen, Users,
  FileText, ClipboardList, BookCheck, Settings, Headphones,
} from 'lucide-react';

const allCommands = [
  { label: 'Inicio', to: '/admin', icon: LayoutDashboard, role: 'Admin' },
  { label: 'Libros (Alta)', to: '/admin/libros', icon: BookOpen, role: 'Admin' },
  { label: 'Usuarios', to: '/admin/usuarios', icon: Users, role: 'Admin' },
  { label: 'Documentos', to: '/admin/documentos', icon: FileText, role: 'Admin' },
  { label: 'Solicitudes de libros', to: '/admin/solicitudes-libros', icon: ClipboardList, role: 'Admin' },
  { label: 'Prestamos Libros', to: '/admin/prestamos-libros', icon: BookCheck, role: 'Admin' },
  { label: 'Reportar error', to: '/admin/soporte/reportar', icon: Headphones, role: 'Admin' },
  { label: 'Mis reportes', to: '/admin/soporte/mis-reportes', icon: ClipboardList, role: 'Admin' },

  { label: 'Inicio', to: '/user', icon: LayoutDashboard, role: 'alumno' },
  { label: 'Libros', to: '/user/libros', icon: BookOpen, role: 'alumno' },
  { label: 'Mis solicitudes de libros', to: '/user/mis-solicitudes-libros', icon: BookOpen, role: 'alumno' },
  { label: 'Mi Perfil', to: '/user/perfil', icon: Settings, role: 'alumno' },
  { label: 'Reportar error', to: '/user/soporte/reportar', icon: Headphones, role: 'alumno' },
  { label: 'Mis reportes', to: '/user/soporte/mis-reportes', icon: ClipboardList, role: 'alumno' },

  { label: 'Dashboard soporte', to: '/soporte', icon: LayoutDashboard, role: 'support_admin' },
  { label: 'Tickets', to: '/soporte/tickets', icon: ClipboardList, role: 'support_admin' },
  { label: 'Configuracion', to: '/soporte/config', icon: Settings, role: 'support_admin' },
  { label: 'Reportar error', to: '/soporte/reportar', icon: Headphones, role: 'support_admin' },
  { label: 'Dashboard soporte', to: '/soporte', icon: LayoutDashboard, role: 'support_agent' },
  { label: 'Tickets', to: '/soporte/tickets', icon: ClipboardList, role: 'support_agent' },
  { label: 'Reportar error', to: '/soporte/reportar', icon: Headphones, role: 'support_agent' },
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
            placeholder="Buscar paginas y acciones..."
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
                key={`${cmd.role}-${cmd.to}`}
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
