import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search, Filter, Calendar, ExternalLink,
  ArrowUp, ArrowDown, ArrowRight, ChevronLeft, ChevronRight, MoreHorizontal,
} from 'lucide-react';
import AnimatedPage from '../../components/layout/AnimatedPage';
import '../../styles/support.css';

// ── Mock data ────────────────────────────────────────────────────────
const TICKETS = [
  { id: 'SOP-2841', tipo: 'Funcional',   titulo: 'Error al registrar préstamo de libro: ISBN no válido',            estado: 'Abierto',   prioridad: 'Alta',  solicitante: 'Laura Méndez',  solicitanteRol: 'Zacatenco', agente: 'María Velázquez', creado: 'Hoy 09:14',    actualizado: 'hace 12 min', tiempo: '2h 15m', sla: 0.6  },
  { id: 'SOP-2840', tipo: 'Visual',      titulo: 'La tabla de inventario se desborda en pantallas pequeñas',        estado: 'Pendiente', prioridad: 'Media', solicitante: 'Diego Vázquez', solicitanteRol: 'Culhuacán', agente: 'María Velázquez', creado: 'Ayer 16:02',   actualizado: 'hace 3h',     tiempo: '0h 45m', sla: 0.85 },
  { id: 'SOP-2839', tipo: 'Rendimiento', titulo: 'Listado de usuarios tarda más de 8s en cargar',                   estado: 'Nuevo',     prioridad: 'Alta',  solicitante: 'Laura Méndez',  solicitanteRol: 'Zacatenco', agente: null,              creado: 'Hoy 11:38',    actualizado: 'hace 1h',     tiempo: '—',      sla: 0.4  },
  { id: 'SOP-2838', tipo: 'Funcional',   titulo: 'No se puede subir comprobante PDF mayor a 2 MB',                  estado: 'En espera', prioridad: 'Media', solicitante: 'Sofía Ortiz',   solicitanteRol: 'Tepepan',   agente: 'Iván Ramírez',   creado: 'Ayer 10:25',   actualizado: 'hace 5h',     tiempo: '1h 10m', sla: 0.92 },
  { id: 'SOP-2837', tipo: 'Funcional',   titulo: 'Botón "Aprobar solicitud" no responde tras pulsar',               estado: 'Resuelto',  prioridad: 'Alta',  solicitante: 'Diego Vázquez', solicitanteRol: 'Culhuacán', agente: 'Iván Ramírez',   creado: '6 may 09:00',  actualizado: 'hace 1d',     tiempo: '3h 50m', sla: 0.55 },
  { id: 'SOP-2836', tipo: 'Visual',      titulo: 'Texto del modal de confirmación queda cortado',                   estado: 'Cerrado',   prioridad: 'Baja',  solicitante: 'Sofía Ortiz',   solicitanteRol: 'Tepepan',   agente: 'Carlos Núñez',   creado: '5 may 14:30',  actualizado: 'hace 2d',     tiempo: '0h 25m', sla: 1.0  },
  { id: 'SOP-2835', tipo: 'Rendimiento', titulo: 'Exportar Excel con +5,000 filas se queda colgado',                estado: 'Abierto',   prioridad: 'Media', solicitante: 'Laura Méndez',  solicitanteRol: 'Zacatenco', agente: 'Carlos Núñez',   creado: '5 may 11:10',  actualizado: 'hace 4h',     tiempo: '5h 30m', sla: 0.7  },
];

const PALETTE = ['#176d5a', '#c46f21', '#0284c7', '#8b5cf6', '#dc4c3f', '#1f9d74'];

function Avatar({ name }) {
  const initials = name.split(' ').map(s => s[0]).slice(0, 2).join('');
  const bg = PALETTE[name.charCodeAt(0) % PALETTE.length];
  return <div className="sup-avatar sup-avatar-sm" style={{ background: bg }}>{initials}</div>;
}

function EstadoBadge({ estado }) {
  const map = {
    Nuevo: 'sup-estado-nuevo', Abierto: 'sup-estado-abierto',
    Pendiente: 'sup-estado-pendiente', 'En espera': 'sup-estado-espera',
    Resuelto: 'sup-estado-resuelto', Cerrado: 'sup-estado-cerrado',
  };
  return <span className={`sup-badge sup-badge--dot ${map[estado] ?? 'sup-badge-neutral'}`}>{estado}</span>;
}

function TipoBadge({ tipo }) {
  const map = {
    Funcional: 'sup-badge-funcional', Visual: 'sup-badge-visual',
    Rendimiento: 'sup-badge-rendimiento', Datos: 'sup-badge-datos', Acceso: 'sup-badge-acceso',
  };
  return <span className={`sup-badge ${map[tipo] ?? 'sup-badge-neutral'}`}>{tipo}</span>;
}

function PrioCell({ prioridad }) {
  const cls = prioridad === 'Alta' ? 'sup-prio-alta' : prioridad === 'Media' ? 'sup-prio-media' : 'sup-prio-baja';
  const Icon = prioridad === 'Alta' ? ArrowUp : prioridad === 'Media' ? ArrowRight : ArrowDown;
  return (
    <span className={`flex items-center gap-1 text-xs font-bold ${cls}`}>
      <Icon size={12} />{prioridad}
    </span>
  );
}

const ESTADOS_FILTRO = ['Todos', 'Nuevo', 'Abierto', 'Pendiente', 'En espera', 'Resuelto', 'Cerrado'];

export default function BandejaTickets() {
  const navigate = useNavigate();
  const [estadoFiltro, setEstadoFiltro] = useState('Todos');
  const [tipoFiltro, setTipoFiltro] = useState('Todos');
  const [prioFiltro, setPrioFiltro] = useState('Todos');
  const [busqueda, setBusqueda] = useState('');

  const filtered = TICKETS.filter(t => {
    const matchEstado = estadoFiltro === 'Todos' || t.estado === estadoFiltro;
    const matchTipo = tipoFiltro === 'Todos' || t.tipo === tipoFiltro;
    const matchPrio = prioFiltro === 'Todos' || t.prioridad === prioFiltro;
    const matchBusqueda = busqueda === '' || t.titulo.toLowerCase().includes(busqueda.toLowerCase()) || t.id.toLowerCase().includes(busqueda.toLowerCase()) || t.solicitante.toLowerCase().includes(busqueda.toLowerCase());
    return matchEstado && matchTipo && matchPrio && matchBusqueda;
  });

  return (
    <AnimatedPage>
      <div className="space-y-5">

        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#e89a4f' }}>CU-S03 · RF-04</p>
            <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight mb-1">Bandeja de tickets</h1>
            <p className="text-sm text-[var(--text-muted)]">{TICKETS.length} tickets registrados · filtra por estado, tipo, prioridad o rango de fechas</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--bg-glass)] border border-[var(--border-color)] text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all">
              <ExternalLink size={14} /> Exportar
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--bg-glass)] border border-[var(--border-color)] text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all">
              <Filter size={14} /> Filtros avanzados
            </button>
          </div>
        </div>

        {/* Filters bar */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                className="w-full pl-9 pr-3 py-2 bg-[var(--bg-glass)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#e89a4f] transition-colors"
                placeholder="Buscar por ID, título o solicitante..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
              />
            </div>
            {/* Tipo */}
            <select
              className="px-3 py-2 bg-[var(--bg-glass)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#e89a4f] transition-colors"
              value={tipoFiltro}
              onChange={e => setTipoFiltro(e.target.value)}
            >
              <option value="Todos">Tipo: Todos</option>
              {['Funcional', 'Visual', 'Rendimiento', 'Datos', 'Acceso'].map(t => <option key={t}>{t}</option>)}
            </select>
            {/* Prioridad */}
            <select
              className="px-3 py-2 bg-[var(--bg-glass)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#e89a4f] transition-colors"
              value={prioFiltro}
              onChange={e => setPrioFiltro(e.target.value)}
            >
              <option value="Todos">Prioridad: Todas</option>
              {['Alta', 'Media', 'Baja'].map(p => <option key={p}>{p}</option>)}
            </select>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--bg-glass)] border border-[var(--border-color)] text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all">
              <Calendar size={14} /> Fechas
            </button>
          </div>
          {/* Estado chips */}
          <div className="flex flex-wrap gap-1.5">
            {ESTADOS_FILTRO.map(s => (
              <button
                key={s}
                onClick={() => setEstadoFiltro(s)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${estadoFiltro === s ? 'bg-[#c46f21] text-white border-[#c46f21]' : 'bg-[var(--bg-glass)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <motion.div
          className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-color)]" style={{ background: 'rgba(0,0,0,0.25)' }}>
                  <th className="w-10 px-3 py-3"><input type="checkbox" className="accent-[#c46f21]" /></th>
                  <th className="text-left px-3 py-3 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] w-24">ID</th>
                  <th className="text-left px-3 py-3 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Asunto</th>
                  <th className="text-left px-3 py-3 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] w-28">Tipo</th>
                  <th className="text-left px-3 py-3 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] w-28">Estado</th>
                  <th className="text-left px-3 py-3 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] w-24">Prioridad</th>
                  <th className="text-left px-3 py-3 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] w-36">Solicitante</th>
                  <th className="text-left px-3 py-3 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] w-36">Asignado</th>
                  <th className="text-left px-3 py-3 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] w-24">SLA</th>
                  <th className="text-left px-3 py-3 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] w-28">Actualizado</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr
                    key={t.id}
                    className="border-b border-[var(--border-color)] hover:bg-[var(--bg-glass)] cursor-pointer transition-colors"
                    onClick={() => navigate(`/admin/soporte/tickets/${t.id}`)}
                  >
                    <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" className="accent-[#c46f21]" />
                    </td>
                    <td className="px-3 py-3">
                      <span className="sup-ticket-id">{t.id}</span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-medium text-[var(--text-primary)] line-clamp-1">{t.titulo}</div>
                      <div className="text-xs text-[var(--text-muted)] mt-0.5">creado {t.creado}</div>
                    </td>
                    <td className="px-3 py-3"><TipoBadge tipo={t.tipo} /></td>
                    <td className="px-3 py-3"><EstadoBadge estado={t.estado} /></td>
                    <td className="px-3 py-3"><PrioCell prioridad={t.prioridad} /></td>
                    <td className="px-3 py-3">
                      <div className="text-xs font-medium text-[var(--text-primary)]">{t.solicitante}</div>
                      <div className="text-xs text-[var(--text-muted)]">{t.solicitanteRol}</div>
                    </td>
                    <td className="px-3 py-3">
                      {t.agente ? (
                        <div className="flex items-center gap-2">
                          <Avatar name={t.agente} />
                          <span className="text-xs text-[var(--text-secondary)]">{t.agente.split(' ')[0]}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-[var(--text-muted)] italic">Sin asignar</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="sup-sla-bar w-20">
                        <div className="sup-sla-fill" style={{ width: `${t.sla * 100}%`, background: t.sla > 0.85 ? '#dc4c3f' : t.sla > 0.6 ? '#d97706' : '#1f9d74' }} />
                      </div>
                      <div className="text-xs text-[var(--text-muted)] mt-0.5">{t.tiempo}</div>
                    </td>
                    <td className="px-3 py-3 text-xs text-[var(--text-muted)]">{t.actualizado}</td>
                    <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                      <button className="p-1.5 rounded-lg hover:bg-[var(--bg-glass-strong)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                        <MoreHorizontal size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={11} className="px-4 py-12 text-center text-sm text-[var(--text-muted)]">
                      No se encontraron tickets con los filtros seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Pagination */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-[var(--text-muted)] text-xs">
            Mostrando 1–{filtered.length} de {TICKETS.length}
          </span>
          <div className="flex items-center gap-1">
            <button className="p-1.5 rounded-lg bg-[var(--bg-glass)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              <ChevronLeft size={14} />
            </button>
            {[1, 2, 3].map(n => (
              <button key={n} className={`w-8 h-8 rounded-lg text-xs font-semibold border transition-all ${n === 1 ? 'bg-[#c46f21] text-white border-[#c46f21]' : 'bg-[var(--bg-glass)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
                {n}
              </button>
            ))}
            <button className="p-1.5 rounded-lg bg-[var(--bg-glass)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

      </div>
    </AnimatedPage>
  );
}
