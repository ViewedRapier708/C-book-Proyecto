import { useState, useEffect, useMemo, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { solicitudesApi } from '../../api/recursos';
import { Spinner, EmptyState } from '../../components/ui/Feedback';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';
import {
  Search,
  XCircle,
  Clock,
  CheckCircle,
  BookOpen,
  BookCheck,
  CalendarClock,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react';
import AnimatedPage from '../../components/layout/AnimatedPage';
import {
  getSolicitudLibroEstadoId,
  getSolicitudLibroSeguimiento,
  getSolicitudLibroSortOrder,
  getSolicitudLibroStatusLabel,
} from '../../utils/solicitudesLibros';

const CARD_HEIGHT = 416;

const ESTADO_STYLE_MAP = {
  1: { badge: 'badge-warning', icon: Clock, accent: '#f59e0b' },
  2: { badge: 'badge-info', icon: CheckCircle, accent: '#3b82f6' },
  3: { badge: 'badge-danger', icon: XCircle, accent: '#ef4444' },
  4: { badge: 'badge-danger', icon: XCircle, accent: '#ef4444' },
  5: { badge: 'badge-success', icon: BookOpen, accent: '#22c55e' },
  6: { badge: 'badge-neutral', icon: BookCheck, accent: '#c46f21' },
};

function getEstado(id) {
  const state = ESTADO_STYLE_MAP[id] || { badge: 'badge-neutral', icon: Clock, accent: '#6b7280' };
  return { ...state, label: getSolicitudLibroStatusLabel(id) };
}

function fmtFecha(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function esVencida(fecha) {
  if (!fecha) return false;
  return new Date(fecha) < new Date();
}

function ProgressFlow({ estado }) {
  const steps = [
    { key: 1, label: 'Solicitado' },
    { key: 2, label: 'Aprobado' },
    { key: 5, label: 'Entregado' },
    { key: 6, label: 'Devuelto' },
  ];
  const rejected = estado === 3 || estado === 4;
  const activeIdx = rejected ? 0 : steps.findIndex((step) => step.key === estado);
  const currentIdx = activeIdx === -1 ? 0 : activeIdx;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, padding: '0.5rem 0' }}>
      {steps.map((step, i) => {
        const done = !rejected && i <= currentIdx;
        const isCurrent = !rejected && i === currentIdx;
        return (
          <div key={step.key} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none', minWidth: 0 }}>
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: done ? getEstado(estado).accent : 'var(--bg-glass-strong)',
                color: done ? '#fff' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.65rem',
                fontWeight: 700,
                border: isCurrent ? `2px solid ${getEstado(estado).accent}` : '2px solid transparent',
                boxShadow: isCurrent ? `0 0 0 3px ${getEstado(estado).accent}33` : 'none',
                transition: 'all 0.3s',
                flexShrink: 0,
              }}
            >
              {i + 1}
            </div>
            <span
              style={{
                fontSize: '0.65rem',
                marginLeft: 4,
                color: done ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: done ? 600 : 400,
                whiteSpace: 'nowrap',
              }}
            >
              {step.label}
            </span>
            {i < steps.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: 2,
                  margin: '0 6px',
                  background: !rejected && i < currentIdx ? getEstado(estado).accent : 'var(--border-color)',
                  borderRadius: 1,
                  transition: 'background 0.3s',
                  minWidth: 8,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function DetailRow({ label, value, warn, surface = 'card' }) {
  if (!value) return null;
  const vencida = warn && esVencida(value);
  const isOverlay = surface === 'overlay';

  return (
    <div
      className="resource-card-row"
      style={{
        ...(vencida
          ? {
              background: isOverlay ? 'rgba(248,113,113,0.12)' : 'rgba(239,68,68,0.08)',
              borderRadius: 6,
              padding: '0.35rem 0.4rem',
              margin: '0 -0.35rem',
            }
          : {}),
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr)',
        gap: '0.2rem',
        alignItems: 'flex-start',
      }}
    >
      <span
        className="resource-card-label"
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 4,
          minWidth: 0,
          maxWidth: '100%',
          whiteSpace: 'normal',
          overflowWrap: 'anywhere',
          wordBreak: 'break-word',
          color: isOverlay ? 'var(--text-secondary)' : 'var(--text-muted)',
          fontSize: isOverlay ? '0.72rem' : undefined,
          lineHeight: 1.2,
        }}
      >
        <CalendarClock size={12} />
        {label}
      </span>
      <span
        className="resource-card-value"
        style={{
          color: vencida ? 'var(--danger)' : 'var(--text-primary)',
          fontWeight: vencida ? 700 : 500,
          maxWidth: '100%',
          whiteSpace: 'normal',
          overflowWrap: 'anywhere',
          wordBreak: 'break-word',
          textAlign: 'left',
          fontSize: isOverlay ? '0.74rem' : undefined,
          lineHeight: 1.2,
          paddingLeft: '1rem',
        }}
      >
        {fmtFecha(value)}
        {vencida && <AlertTriangle size={12} style={{ marginLeft: 4, verticalAlign: 'middle' }} />}
      </span>
    </div>
  );
}

export default function MisSolicitudesLibros() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [page, setPage] = useState(1);
  const [cancelModal, setCancelModal] = useState(null);
  const [cancelAllModal, setCancelAllModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hoveredId, setHoveredId] = useState(null);
  const PER_PAGE = 12;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await solicitudesApi.getUserSolicitudes();
      const list = data.data || data.solicitudes || [];
      const libros = list.filter((s) => s.tipo_solicitud === 'libro');
      setItems(libros);
    } catch {
      toast.error('Error al cargar solicitudes de libros');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setHoveredId(null);
  }, [page, search, filterEstado]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items
      .filter((s) => {
        if (q && !(s.titulo || '').toLowerCase().includes(q) && !String(s.id).includes(q)) return false;
        const estado = getSolicitudLibroEstadoId(s);
        if (filterEstado && String(estado) !== filterEstado) return false;
        return true;
      })
      .sort((a, b) => {
        const diff = getSolicitudLibroSortOrder(a) - getSolicitudLibroSortOrder(b);
        if (diff !== 0) return diff;
        return new Date(b.fecha_solicitud || 0) - new Date(a.fecha_solicitud || 0);
      });
  }, [items, search, filterEstado]);

  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleCancel = async () => {
    setSubmitting(true);
    try {
      await solicitudesApi.cancel('libro', cancelModal.id);
      toast.success('Solicitud de libro cancelada');
      setCancelModal(null);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const pendientes = items.filter((s) => s.estado_asistencia_id === 1);

  const handleCancelAll = async () => {
    setSubmitting(true);
    try {
      await Promise.all(pendientes.map((s) => solicitudesApi.cancel('libro', s.id)));
      toast.success(`${pendientes.length} solicitud(es) cancelada(s)`);
      setCancelAllModal(false);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <AnimatedPage>
      <div className="page-header">
        <h1>Mis solicitudes de libros</h1>
        <p>Revisa el estado de tus solicitudes de libros</p>
      </div>

      <div className="toolbar">
        <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
          <input
            className="search-input"
            style={{ paddingLeft: 34 }}
            placeholder="Buscar por titulo..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <select
          className="search-input"
          value={filterEstado}
          onChange={(e) => {
            setFilterEstado(e.target.value);
            setPage(1);
          }}
          style={{ maxWidth: 220, color: 'var(--text-primary)' }}
        >
          <option value="">Todos los estados</option>
          <option value="1">En espera de aceptacion</option>
          <option value="2">En espera de recoleccion</option>
          <option value="3">Rechazada</option>
          <option value="4">Cancelada</option>
          <option value="5">En espera de devolucion</option>
          <option value="6">Devuelto</option>
        </select>
        {pendientes.length > 0 && (
          <button className="btn btn-danger btn-sm" onClick={() => setCancelAllModal(true)}>
            <XCircle size={14} /> Cancelar todas ({pendientes.length})
          </button>
        )}
      </div>

      {paged.length === 0 ? (
        <EmptyState message="No tienes solicitudes de libros" />
      ) : (
        <div className="resource-grid">
          {paged.map((s) => {
            const estado = getSolicitudLibroEstadoId(s);
            const est = getEstado(estado);
            const EstIcon = est.icon;
            const { visible, history } = getSolicitudLibroSeguimiento(s);
            const showArrow = history.length > 0;
            const isOpen = hoveredId === s.id;

            return (
              <div
                key={s.id}
                className="resource-card"
                onMouseLeave={() => setHoveredId((prev) => (prev === s.id ? null : prev))}
                style={{
                  borderLeft: `3px solid ${est.accent}`,
                  height: CARD_HEIGHT,
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div className="resource-card-title" style={{ alignItems: 'flex-start', gap: '0.75rem' }}>
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 6,
                      minWidth: 0,
                      flex: 1,
                    }}
                  >
                    <EstIcon size={16} style={{ color: est.accent, flexShrink: 0, marginTop: 2 }} />
                    <span
                      style={{
                        display: 'block',
                        lineHeight: 1.2,
                        whiteSpace: 'normal',
                        overflowWrap: 'anywhere',
                        wordBreak: 'break-word',
                      }}
                    >
                      {s.titulo || `Libro #${s.id}`}
                    </span>
                  </span>
                  <span className={`badge ${est.badge}`} style={{ whiteSpace: 'normal', textAlign: 'center', lineHeight: 1.15, flexShrink: 0 }}>
                    {est.label}
                  </span>
                </div>

                <div style={{ padding: '0 1.25rem' }}>
                  <ProgressFlow estado={estado} />
                </div>

                <div
                  className="resource-card-body"
                  style={{
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.55rem',
                    flex: 1,
                    minHeight: 0,
                    overflow: 'hidden',
                    paddingBottom: '0.2rem',
                  }}
                >
                  {s.autor && (
                    <div className="resource-card-row" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '0.2rem', alignItems: 'flex-start' }}>
                      <span className="resource-card-label" style={{ whiteSpace: 'normal', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>Autor</span>
                      <span className="resource-card-value" style={{ maxWidth: '100%', whiteSpace: 'normal', overflowWrap: 'anywhere', wordBreak: 'break-word', textAlign: 'left', paddingLeft: '1rem' }}>
                        {s.autor}
                      </span>
                    </div>
                  )}

                  <div style={{ display: 'grid', gap: '0.35rem' }}>
                    {visible.map((detalle) => (
                      <DetailRow
                        key={`${s.id}-${detalle.label}`}
                        label={detalle.label}
                        value={detalle.value}
                        warn={detalle.warn}
                      />
                    ))}
                  </div>

                  {showArrow && (
                    <div
                      style={{
                        alignSelf: 'flex-start',
                        marginTop: '0.1rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        minWidth: 0,
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          color: isOpen ? 'var(--text-primary)' : 'var(--text-muted)',
                          whiteSpace: 'normal',
                          overflowWrap: 'anywhere',
                          wordBreak: 'break-word',
                        }}
                      >
                        Mas detalles
                      </span>
                      <button
                        type="button"
                        onMouseEnter={() => setHoveredId(s.id)}
                        onFocus={() => setHoveredId(s.id)}
                        onBlur={() => setHoveredId((prev) => (prev === s.id ? null : prev))}
                        aria-expanded={isOpen}
                        aria-label="Mas detalles"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 24,
                          height: 24,
                          padding: 0,
                          background: 'transparent',
                          border: 'none',
                          color: isOpen ? est.accent : 'var(--text-muted)',
                          cursor: 'pointer',
                          flexShrink: 0,
                        }}
                      >
                        <motion.span
                          animate={{ rotate: isOpen ? 180 : 0 }}
                          transition={{ duration: 0.2, ease: 'easeInOut' }}
                          style={{ display: 'inline-flex' }}
                        >
                          <ChevronDown size={18} />
                        </motion.span>
                      </button>
                    </div>
                  )}

                  {!showArrow && s.motivo_rechazo && (
                    <div
                      className="resource-card-row"
                      style={{
                        background: 'rgba(239,68,68,0.06)',
                        borderRadius: 6,
                        padding: '0.45rem 0.5rem',
                        display: 'grid',
                        gridTemplateColumns: 'minmax(0, 1fr)',
                        alignItems: 'flex-start',
                        gap: '0.2rem',
                      }}
                    >
                      <span className="resource-card-label" style={{ whiteSpace: 'normal', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>Motivo</span>
                      <span
                        className="resource-card-value"
                        style={{
                          color: 'var(--danger)',
                          fontSize: '0.78rem',
                          maxWidth: '100%',
                          whiteSpace: 'normal',
                          overflowWrap: 'anywhere',
                          wordBreak: 'break-word',
                          textAlign: 'left',
                          paddingLeft: '1rem',
                        }}
                      >
                        {s.motivo_rechazo}
                      </span>
                    </div>
                  )}

                  <AnimatePresence>
                    {isOpen && showArrow && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        onMouseEnter={() => setHoveredId(s.id)}
                        onMouseLeave={() => setHoveredId((prev) => (prev === s.id ? null : prev))}
                        style={{
                          position: 'absolute',
                          inset: 0,
                          zIndex: 2,
                          padding: '0.75rem 0.8rem',
                          borderRadius: 10,
                          background: 'var(--bg-overlay-card)',
                          border: '1px solid var(--border-color)',
                          boxShadow: 'var(--shadow-lg)',
                          display: 'grid',
                          alignContent: 'start',
                          gap: '0.28rem',
                          overflow: 'hidden',
                        }}
                      >
                        {history.map((detalle) => (
                          <DetailRow
                            key={`${s.id}-history-${detalle.label}`}
                            label={detalle.label}
                            value={detalle.value}
                            warn={detalle.warn}
                            surface="overlay"
                          />
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {estado === 1 && (
                  <div className="resource-card-actions">
                    <button className="btn btn-danger btn-sm" style={{ flex: 1 }} onClick={() => setCancelModal(s)}>
                      <XCircle size={14} /> Cancelar
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Pagination page={page} total={filtered.length} perPage={PER_PAGE} onChange={setPage} />

      <Modal
        open={!!cancelModal}
        onClose={() => setCancelModal(null)}
        title="Cancelar Solicitud"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setCancelModal(null)}>
              Cerrar
            </button>
            <button className="btn btn-danger" disabled={submitting} onClick={handleCancel}>
              {submitting ? 'Cancelando...' : 'Si, cancelar'}
            </button>
          </>
        }
      >
        <p>
          Estas seguro de cancelar la solicitud del libro <strong>{cancelModal?.titulo || `#${cancelModal?.id}`}</strong>?
        </p>
      </Modal>

      <Modal
        open={cancelAllModal}
        onClose={() => setCancelAllModal(false)}
        title="Cancelar Todas las Solicitudes"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setCancelAllModal(false)}>
              Cerrar
            </button>
            <button className="btn btn-danger" disabled={submitting} onClick={handleCancelAll}>
              {submitting ? 'Cancelando...' : `Si, cancelar todas (${pendientes.length})`}
            </button>
          </>
        }
      >
        <p>
          Estas seguro de cancelar <strong>todas tus {pendientes.length} solicitudes pendientes</strong> de libros?
        </p>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
          Esta accion no se puede deshacer.
        </p>
      </Modal>
    </AnimatedPage>
  );
}
