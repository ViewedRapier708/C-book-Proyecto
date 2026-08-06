import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search, Filter, RefreshCcw,
  ArrowUp, ArrowDown, ArrowRight, ChevronRight, MoreHorizontal, AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import CollapsibleText from '../../components/ui/CollapsibleText';
import Modal from '../../components/ui/Modal';
import AnimatedPage from '../../components/layout/AnimatedPage';
import { soporteApi } from '../../api/soporte';
import { useAuth } from '../../context/AuthContext';
import { isSupportAdmin } from '../../utils/authRoutes';
import '../../styles/support.css';

const ESTADOS_FILTRO = ['Todos', 'Nuevo', 'Abierto', 'Pendiente', 'En espera', 'Resuelto', 'Cerrado'];
const PRIORIDADES = ['Todos', 'Alta', 'Media', 'Baja', 'Urgente'];

function EstadoBadge({ estado }) {
  const map = { Nuevo: 'sup-estado-nuevo', Abierto: 'sup-estado-abierto', Pendiente: 'sup-estado-pendiente', 'En espera': 'sup-estado-espera', Resuelto: 'sup-estado-resuelto', Cerrado: 'sup-estado-cerrado' };
  return <span className={`sup-badge sup-badge--dot ${map[estado] ?? 'sup-badge-neutral'}`}>{estado}</span>;
}

function TipoBadge({ tipo }) {
  const map = { Funcional: 'sup-badge-funcional', Visual: 'sup-badge-visual', Rendimiento: 'sup-badge-rendimiento', Datos: 'sup-badge-datos', Acceso: 'sup-badge-acceso' };
  return <span className={`sup-badge ${map[tipo] ?? 'sup-badge-neutral'}`}>{tipo}</span>;
}

function PrioCell({ prioridad }) {
  const cls = prioridad === 'Alta' || prioridad === 'Urgente' ? 'sup-prio-alta' : prioridad === 'Media' ? 'sup-prio-media' : 'sup-prio-baja';
  const Icon = prioridad === 'Alta' || prioridad === 'Urgente' ? ArrowUp : prioridad === 'Media' ? ArrowRight : ArrowDown;
  return <span className={`flex items-center gap-1 text-xs font-bold ${cls}`}><Icon size={12} />{prioridad}</span>;
}

function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export default function BandejaTickets() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [estadoFiltro, setEstadoFiltro] = useState('Todos');
  const [tipoFiltro, setTipoFiltro] = useState('Todos');
  const [prioFiltro, setPrioFiltro] = useState('Todos');
  const [busqueda, setBusqueda] = useState('');
  const [tickets, setTickets] = useState([]);
  const [tipos, setTipos] = useState(['Todos']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reopenTarget, setReopenTarget] = useState(null);
  const [reopenReason, setReopenReason] = useState('');
  const [reopening, setReopening] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [{ tickets: rows }, typeData] = await Promise.all([
        soporteApi.getTickets({ estado: estadoFiltro, tipo: tipoFiltro, prioridad: prioFiltro, q: busqueda }),
        soporteApi.getTypes().catch(() => ({ tipos: [] })),
      ]);
      setTickets(rows || []);
      setTipos(['Todos', ...(typeData.tipos || []).filter((t) => t.is_active !== false).map((t) => t.name)]);
    } catch (err) {
      setError(err.message || 'No se pudo cargar la bandeja');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [estadoFiltro, tipoFiltro, prioFiltro]);

  const handleReopen = async () => {
    if (!reopenTarget) return;
    setReopening(true);
    setError('');
    try {
      await soporteApi.reopenTicket(reopenTarget.id, reopenReason.trim());
      toast.success(`Ticket ${reopenTarget.folio} reabierto`);
      setReopenTarget(null);
      setReopenReason('');
      load();
    } catch (err) {
      setError(err.message || 'No se pudo reabrir el ticket');
    } finally {
      setReopening(false);
    }
  };

  const filtered = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return tickets;
    return tickets.filter((t) => [t.folio, t.titulo, t.solicitante, t.modulo].some((v) => String(v || '').toLowerCase().includes(q)));
  }, [tickets, busqueda]);

  return (
    <AnimatedPage>
      <div className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#e89a4f' }}>Soporte C-Book</p>
            <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight mb-1">Bandeja de tickets</h1>
            <p className="text-sm text-[var(--text-muted)]">{filtered.length} tickets encontrados en Supabase</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--bg-glass)] border border-[var(--border-color)] text-sm font-medium text-[var(--text-secondary)]" onClick={load}>
              <RefreshCcw size={14} /> Actualizar
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--bg-glass)] border border-[var(--border-color)] text-sm font-medium text-[var(--text-secondary)]">
              <Filter size={14} /> Filtros
            </button>
          </div>
        </div>

        {error && <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"><AlertCircle size={16} /> {error}</div>}

        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input className="w-full pl-9 pr-3 py-2 bg-[var(--bg-glass)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#e89a4f]" placeholder="Buscar por folio, titulo o solicitante..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} />
            </div>
            <select className="px-3 py-2 bg-[var(--bg-glass)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#e89a4f]" value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value)}>
              {tipos.map((t) => <option key={t} value={t}>{t === 'Todos' ? 'Tipo: Todos' : t}</option>)}
            </select>
            <select className="px-3 py-2 bg-[var(--bg-glass)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#e89a4f]" value={prioFiltro} onChange={(e) => setPrioFiltro(e.target.value)}>
              {PRIORIDADES.map((p) => <option key={p} value={p}>{p === 'Todos' ? 'Prioridad: Todas' : p}</option>)}
            </select>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ESTADOS_FILTRO.map((s) => (
              <button key={s} onClick={() => setEstadoFiltro(s)} className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${estadoFiltro === s ? 'bg-[#c46f21] text-white border-[#c46f21]' : 'bg-[var(--bg-glass)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>{s}</button>
            ))}
          </div>
        </div>

        <motion.div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-color)]" style={{ background: 'rgba(0,0,0,0.25)' }}>
                  <th className="text-left px-3 py-3 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Folio</th>
                  <th className="text-left px-3 py-3 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Asunto</th>
                  <th className="text-left px-3 py-3 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Tipo</th>
                  <th className="text-left px-3 py-3 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Estado</th>
                  <th className="text-left px-3 py-3 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Prioridad</th>
                  <th className="text-left px-3 py-3 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Solicitante</th>
                  <th className="text-left px-3 py-3 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Asignado</th>
                  <th className="text-left px-3 py-3 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Actualizado</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={9} className="px-4 py-12 text-center text-sm text-[var(--text-muted)]">Cargando tickets...</td></tr>}
                {!loading && filtered.map((t) => (
                  <tr
                    key={t.id}
                    className={`border-b border-[var(--border-color)] transition-colors ${(!t.agente || t.agente === user?.nombre || isSupportAdmin(user?.rol)) ? 'hover:bg-[var(--bg-glass)] cursor-pointer' : 'opacity-70 cursor-not-allowed'}`}
                    onClick={() => {
                      if (!t.agente || t.agente === user?.nombre || isSupportAdmin(user?.rol)) {
                        navigate(`/soporte/tickets/${t.id}`);
                      }
                    }}
                  >
                    <td className="px-3 py-3"><span className="sup-ticket-id">{t.folio}</span></td>
                    <td className="px-3 py-3">
                      <CollapsibleText text={t.titulo} maxLength={40} className="font-medium text-[var(--text-primary)]" />
                      <div className="text-xs text-[var(--text-muted)] mt-0.5">{t.modulo}</div>
                    </td>
                    <td className="px-3 py-3"><TipoBadge tipo={t.tipo} /></td>
                    <td className="px-3 py-3"><EstadoBadge estado={t.estado} /></td>
                    <td className="px-3 py-3"><PrioCell prioridad={t.prioridad} /></td>
                    <td className="px-3 py-3">
                      <div className="text-xs font-medium text-[var(--text-primary)]">{t.solicitante}</div>
                      <div className="text-xs text-[var(--text-muted)]">{t.solicitanteBoleta || t.solicitanteRol}</div>
                    </td>
                    <td className="px-3 py-3 text-xs text-[var(--text-secondary)]">{t.agente || 'Sin asignar'}</td>
                    <td className="px-3 py-3 text-xs text-[var(--text-muted)]">{formatDate(t.actualizado)}</td>
                    <td className="px-3 py-3">
                      {['Resuelto', 'Cerrado'].includes(t.estado) ? (
                        <button
                          className="flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold text-white"
                          style={{ background: '#2563eb' }}
                          onClick={(e) => { e.stopPropagation(); setReopenTarget(t); setReopenReason(''); }}
                        >
                          <RefreshCcw size={12} /> Reabrir
                        </button>
                      ) : (
                        <ChevronRight size={15} className="text-[var(--text-muted)]" />
                      )}
                    </td>
                  </tr>
                ))}
                {!loading && filtered.length === 0 && <tr><td colSpan={9} className="px-4 py-12 text-center text-sm text-[var(--text-muted)]">No se encontraron tickets con los filtros seleccionados.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="md:hidden space-y-3 p-3">
            {loading && <div className="px-4 py-10 text-center text-sm text-[var(--text-muted)]">Cargando tickets...</div>}
            {!loading && filtered.map((t) => {
              const canOpen = !t.agente || t.agente === user?.nombre || isSupportAdmin(user?.rol);
              return (
                <div
                  key={t.id}
                  className={`glass-card ${canOpen ? 'cursor-pointer' : 'opacity-70 cursor-not-allowed'}`}
                  onClick={() => {
                    if (canOpen) navigate(`/soporte/tickets/${t.id}`);
                  }}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="sup-ticket-id">{t.folio}</span>
                    <EstadoBadge estado={t.estado} />
                  </div>
                  <CollapsibleText text={t.titulo} maxLength={40} className="font-medium text-[var(--text-primary)] mb-1 block" />
                  <div className="text-xs text-[var(--text-muted)] mb-3">{t.modulo}</div>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <TipoBadge tipo={t.tipo} />
                    <PrioCell prioridad={t.prioridad} />
                  </div>
                  <div className="grid gap-2 mt-3 pt-3 border-t border-[var(--border-color)] text-xs text-[var(--text-muted)]">
                    <div className="flex justify-between gap-3">
                      <span>Solicitante</span>
                      <span className="text-right text-[var(--text-secondary)]">{t.solicitante}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span>Asignado</span>
                      <span className="text-right text-[var(--text-secondary)]">{t.agente || 'Sin asignar'}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span>Actualizado</span>
                      <span className="text-right text-[var(--text-secondary)]">{formatDate(t.actualizado)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          {!loading && filtered.length === 0 && <div className="px-4 py-10 text-center text-sm text-[var(--text-muted)]">No se encontraron tickets con los filtros seleccionados.</div>}
          </div>
        </motion.div>
      </div>

      <Modal
        open={Boolean(reopenTarget)}
        onClose={() => { if (!reopening) setReopenTarget(null); }}
        title={`Reabrir ticket ${reopenTarget?.folio || ''}`}
        footer={(
          <>
            <button
              type="button"
              className="px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-glass)] text-sm font-medium text-[var(--text-secondary)] disabled:opacity-50"
              onClick={() => setReopenTarget(null)}
              disabled={reopening}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="px-3 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: '#2563eb' }}
              onClick={handleReopen}
              disabled={reopening || !reopenReason.trim()}
            >
              {reopening ? 'Reabriendo...' : 'Reabrir ticket'}
            </button>
          </>
        )}
      >
        <div className="space-y-3">
          <p className="text-sm text-[var(--text-secondary)]">
            Indica la razon por la que se reabre este ticket.
          </p>
          <textarea
            className="w-full px-3 py-2.5 bg-[var(--bg-glass)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none resize-none min-h-[120px] disabled:opacity-60"
            placeholder="Describe por que se reabre este ticket."
            value={reopenReason}
            onChange={(e) => setReopenReason(e.target.value)}
            disabled={reopening}
          />
        </div>
      </Modal>
    </AnimatedPage>
  );
}
