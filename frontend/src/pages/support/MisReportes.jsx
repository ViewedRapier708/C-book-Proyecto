import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, ChevronRight, RefreshCcw, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import CollapsibleText from '../../components/ui/CollapsibleText';
import Modal from '../../components/ui/Modal';
import AnimatedPage from '../../components/layout/AnimatedPage';
import { useAuth } from '../../context/AuthContext';
import { soporteApi } from '../../api/soporte';
import { isSupportRole } from '../../utils/authRoutes';
import '../../styles/support.css';

const ESTADOS_FILTRO = ['Todos', 'Nuevo', 'Abierto', 'Pendiente', 'En espera', 'Resuelto', 'Cerrado'];

function EstadoBadge({ estado }) {
  const map = { Nuevo: 'sup-estado-nuevo', Abierto: 'sup-estado-abierto', Pendiente: 'sup-estado-pendiente', 'En espera': 'sup-estado-espera', Resuelto: 'sup-estado-resuelto', Cerrado: 'sup-estado-cerrado' };
  return <span className={`sup-badge sup-badge--dot ${map[estado] ?? 'sup-badge-neutral'}`}>{estado}</span>;
}

function TipoBadge({ tipo }) {
  const map = { Funcional: 'sup-badge-funcional', Visual: 'sup-badge-visual', Rendimiento: 'sup-badge-rendimiento', Datos: 'sup-badge-datos', Acceso: 'sup-badge-acceso' };
  return <span className={`sup-badge ${map[tipo] ?? 'sup-badge-neutral'}`}>{tipo}</span>;
}

function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export default function MisReportes() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [estadoFiltro, setEstadoFiltro] = useState('Todos');
  const [busqueda, setBusqueda] = useState('');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reopenTarget, setReopenTarget] = useState(null);
  const [reopenReason, setReopenReason] = useState('');
  const [reopening, setReopening] = useState(false);

  const detailBase = isSupportRole(user?.rol)
    ? '/soporte/tickets'
    : user?.rol === 'Admin'
      ? '/admin/soporte/mis-reportes'
      : '/user/soporte/mis-reportes';
  const reportPath = isSupportRole(user?.rol) ? '/soporte/reportar' : '/user/soporte/reportar';

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await soporteApi.getMyTickets({ estado: estadoFiltro, q: busqueda });
      setTickets(data.tickets || []);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar tus reportes');
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    load();
  }, [estadoFiltro]);

  const filtered = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return tickets;
    return tickets.filter((t) => [t.folio, t.titulo, t.tipo, t.modulo].some((v) => String(v || '').toLowerCase().includes(q)));
  }, [tickets, busqueda]);

  const abiertos = tickets.filter((t) => ['Nuevo', 'Abierto', 'Pendiente', 'En espera'].includes(t.estado)).length;

  return (
    <AnimatedPage>
      <div className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#e89a4f' }}>Mis reportes</p>
            <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight mb-1">Mis reportes</h1>
            <p className="text-sm text-[var(--text-muted)]">{tickets.length} reportes enviados - {abiertos} en proceso</p>
          </div>
          <div className="flex gap-2">
            <button className="p-2 rounded-lg bg-[var(--bg-glass)] border border-[var(--border-color)] text-[var(--text-secondary)]" onClick={load} disabled={loading}>
              <RefreshCcw size={15} />
            </button>
            <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: '#c46f21' }} onClick={() => navigate(reportPath)}>
              <Plus size={14} /> Nuevo reporte
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { lbl: 'Total', val: tickets.length, color: '#e89a4f' },
            { lbl: 'Abiertos', val: tickets.filter((t) => t.estado === 'Abierto').length, color: '#fbbf24' },
            { lbl: 'Resueltos', val: tickets.filter((t) => t.estado === 'Resuelto').length, color: '#1f9d74' },
            { lbl: 'Cerrados', val: tickets.filter((t) => t.estado === 'Cerrado').length, color: '#738296' },
          ].map((s, i) => (
            <motion.div key={s.lbl} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">{s.lbl}</div>
              <div className="text-2xl font-extrabold" style={{ color: s.color }}>{s.val}</div>
            </motion.div>
          ))}
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4 space-y-3">
          <div className="relative max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input className="w-full pl-9 pr-3 py-2 bg-[var(--bg-glass)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#e89a4f]" placeholder="Buscar por folio, titulo o modulo..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ESTADOS_FILTRO.map((s) => (
              <button key={s} onClick={() => setEstadoFiltro(s)} className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${estadoFiltro === s ? 'bg-[#c46f21] text-white border-[#c46f21]' : 'bg-[var(--bg-glass)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {loading && <div className="text-center py-12 text-sm text-[var(--text-muted)]">Cargando reportes...</div>}
          {!loading && filtered.map((t, i) => (
            <motion.div key={t.id} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4 cursor-pointer hover:border-[var(--border-glow)] transition-all group" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} onClick={() => navigate(`${detailBase}/${t.id}`)}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="sup-ticket-id text-xs">{t.folio}</span>
                    <EstadoBadge estado={t.estado} />
                    <TipoBadge tipo={t.tipo} />
                  </div>
                  <CollapsibleText text={t.titulo} maxLength={40} className="text-sm font-medium text-[var(--text-primary)] mb-1.5 leading-snug block" />
                  <div className="flex flex-wrap gap-2 text-xs text-[var(--text-muted)]">
                    <span>{t.modulo}</span>
                    <span>-</span>
                    <span>Creado {formatDate(t.creado)}</span>
                    {t.agente && <><span>-</span><span>Agente: <strong className="text-[var(--text-secondary)]">{t.agente}</strong></span></>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 mt-1">
                  {['Resuelto', 'Cerrado'].includes(t.estado) && (
                    <button
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold"
                      style={{ background: '#2563eb', color: '#fff' }}
                      onClick={(e) => { e.stopPropagation(); setReopenTarget(t); setReopenReason(''); }}
                    >
                      <RefreshCcw size={12} /> Reabrir
                    </button>
                  )}
                  <ChevronRight size={16} className="text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors" />
                </div>
              </div>
            </motion.div>
          ))}

          {!loading && filtered.length === 0 && (
            <div className="text-center py-12 text-sm text-[var(--text-muted)]">No se encontraron reportes con los filtros seleccionados.</div>
          )}
        </div>
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
            Estas seguro de reabrir este ticket? Indica la razon por la que solicita la reapertura.
          </p>
          <textarea
            className="w-full px-3 py-2.5 bg-[var(--bg-glass)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none resize-none min-h-[120px] disabled:opacity-60"
            placeholder="Describe por que necesitas reabrir este ticket."
            value={reopenReason}
            onChange={(e) => setReopenReason(e.target.value)}
            disabled={reopening}
          />
        </div>
      </Modal>
    </AnimatedPage>
  );
}
