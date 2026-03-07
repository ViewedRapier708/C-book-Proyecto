import { useState, useEffect, useMemo, useCallback } from 'react';
import { solicitudesApi } from '../../api/recursos';
import { Spinner, EmptyState } from '../../components/ui/Feedback';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';
import { Search, XCircle, Clock, CheckCircle, BookOpen, BookCheck, CalendarClock, AlertTriangle } from 'lucide-react';
import AnimatedPage from '../../components/layout/AnimatedPage';

const ESTADO_MAP = {
  1: { label: 'Pendiente', badge: 'badge-warning', icon: Clock, accent: '#f59e0b' },
  2: { label: 'Aprobada', badge: 'badge-info', icon: CheckCircle, accent: '#3b82f6' },
  3: { label: 'Rechazada', badge: 'badge-danger', icon: XCircle, accent: '#ef4444' },
  4: { label: 'Cancelada', badge: 'badge-danger', icon: XCircle, accent: '#ef4444' },
  5: { label: 'Entregado', badge: 'badge-success', icon: BookOpen, accent: '#22c55e' },
  6: { label: 'Devuelto', badge: 'badge-neutral', icon: BookCheck, accent: '#8b5cf6' },
};

function getEstado(id) {
  return ESTADO_MAP[id] || { label: `Estado ${id}`, badge: 'badge-neutral', icon: Clock, accent: '#6b7280' };
}

/** Calcula el estado visual: si está entregado y ya se devolvió → 6 (Devuelto) */
function estadoEfectivo(s) {
  if (s.estado_asistencia_id === 5 && s.fecha_devolucion_real) return 6;
  return s.estado_asistencia_id;
}

function fmtFecha(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function esVencida(fecha) {
  if (!fecha) return false;
  return new Date(fecha) < new Date();
}

/** Barra de progreso visual para el flujo del libro */
function ProgressFlow({ estado }) {
  const steps = [
    { key: 1, label: 'Solicitado' },
    { key: 2, label: 'Aprobado' },
    { key: 5, label: 'Entregado' },
    { key: 6, label: 'Devuelto' },
  ];
  // Rechazada/Cancelada: solo 1 step activo
  const rejected = estado === 3 || estado === 4;
  const activeIdx = rejected ? 0 : steps.findIndex(s => s.key === estado);
  const currentIdx = activeIdx === -1 ? 0 : activeIdx;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, padding: '0.5rem 0' }}>
      {steps.map((step, i) => {
        const done = !rejected && i <= currentIdx;
        const isCurrent = !rejected && i === currentIdx;
        return (
          <div key={step.key} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              background: done ? getEstado(estado).accent : 'var(--bg-glass-strong)',
              color: done ? '#fff' : 'var(--text-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.65rem', fontWeight: 700,
              border: isCurrent ? `2px solid ${getEstado(estado).accent}` : '2px solid transparent',
              boxShadow: isCurrent ? `0 0 0 3px ${getEstado(estado).accent}33` : 'none',
              transition: 'all 0.3s',
            }}>
              {i + 1}
            </div>
            <span style={{ fontSize: '0.65rem', marginLeft: 4, color: done ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: done ? 600 : 400, whiteSpace: 'nowrap' }}>
              {step.label}
            </span>
            {i < steps.length - 1 && (
              <div style={{
                flex: 1, height: 2, margin: '0 6px',
                background: !rejected && i < currentIdx ? getEstado(estado).accent : 'var(--border-color)',
                borderRadius: 1, transition: 'background 0.3s',
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Fila de fecha con icono */
function DateRow({ label, value, warn }) {
  if (!value) return null;
  const vencida = warn && esVencida(value);
  return (
    <div className="resource-card-row" style={vencida ? { background: 'rgba(239,68,68,0.08)', borderRadius: 6, padding: '0.35rem 0.4rem', margin: '0 -0.4rem' } : {}}>
      <span className="resource-card-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <CalendarClock size={12} />
        {label}
      </span>
      <span className="resource-card-value" style={vencida ? { color: 'var(--danger)', fontWeight: 700 } : {}}>
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
  const PER_PAGE = 12;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await solicitudesApi.getUserSolicitudes();
      const list = data.data || data.solicitudes || [];
      const libros = list.filter((s) => s.tipo_solicitud === 'libro');
      setItems(libros);
    } catch { toast.error('Error al cargar solicitudes de libros'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((s) => {
      if (q && !(s.titulo || '').toLowerCase().includes(q) && !String(s.id).includes(q)) return false;
      const ef = String(estadoEfectivo(s));
      if (filterEstado && ef !== filterEstado) return false;
      return true;
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
    } finally { setSubmitting(false); }
  };

  const pendientes = items.filter(s => s.estado_asistencia_id === 1);

  const handleCancelAll = async () => {
    setSubmitting(true);
    try {
      await Promise.all(pendientes.map(s => solicitudesApi.cancel('libro', s.id)));
      toast.success(`${pendientes.length} solicitud(es) cancelada(s)`);
      setCancelAllModal(false);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally { setSubmitting(false); }
  };

  if (loading) return <Spinner />;

  return (
    <AnimatedPage>
      <div className="page-header">
        <h1>Mis Solicitudes de Libros</h1>
        <p>Revisa el estado de tus solicitudes de libros</p>
      </div>

      <div className="toolbar">
        <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
          <input className="search-input" style={{ paddingLeft: 34 }} placeholder="Buscar por título..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select value={filterEstado} onChange={(e) => { setFilterEstado(e.target.value); setPage(1); }} style={{ maxWidth: 160 }}>
          <option value="">Todos los estados</option>
          <option value="1">Pendiente</option>
          <option value="2">Aprobada</option>
          <option value="3">Rechazada</option>
          <option value="4">Cancelada</option>
          <option value="5">Entregado</option>
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
            const estado = estadoEfectivo(s);
            const est = getEstado(estado);
            const EstIcon = est.icon;

            return (
              <div key={s.id} className="resource-card" style={{ borderLeft: `3px solid ${est.accent}` }}>
                {/* Header */}
                <div className="resource-card-title">
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%' }}>
                    <EstIcon size={16} style={{ color: est.accent, flexShrink: 0 }} />
                    {s.titulo || `Libro #${s.id}`}
                  </span>
                  <span className={`badge ${est.badge}`}>{est.label}</span>
                </div>

                {/* Progress */}
                <div style={{ padding: '0 1.25rem' }}>
                  <ProgressFlow estado={estado} />
                </div>

                {/* Body */}
                <div className="resource-card-body">
                  {s.autor && (
                    <div className="resource-card-row">
                      <span className="resource-card-label">Autor</span>
                      <span className="resource-card-value">{s.autor}</span>
                    </div>
                  )}

                  {/* Fecha solicitud — siempre visible */}
                  <DateRow label="Fecha solicitud" value={s.fecha_solicitud} />

                  {/* === PENDIENTE (1): mostrar fecha límite de respuesta === */}
                  {estado === 1 && (
                    <DateRow label="Límite respuesta" value={s.fecha_limite_respuesta} warn />
                  )}

                  {/* === APROBADA (2): mostrar fecha aprobación + límite recolección === */}
                  {estado === 2 && (
                    <>
                      <DateRow label="Fecha aprobación" value={s.fecha_aprobacion} />
                      <DateRow label="Límite recolección" value={s.fecha_limite_recoleccion} warn />
                    </>
                  )}

                  {/* === RECHAZADA (3): mostrar motivo === */}
                  {estado === 3 && s.motivo_rechazo && (
                    <div className="resource-card-row" style={{ background: 'rgba(239,68,68,0.06)', borderRadius: 6, padding: '0.45rem 0.5rem', margin: '4px -0.4rem' }}>
                      <span className="resource-card-label">Motivo</span>
                      <span className="resource-card-value" style={{ color: 'var(--danger)', fontSize: '0.78rem' }}>{s.motivo_rechazo}</span>
                    </div>
                  )}

                  {/* === ENTREGADO (5): mostrar fechas de préstamo + límite devolución === */}
                  {estado === 5 && (
                    <>
                      <DateRow label="Fecha entrega" value={s.fecha_inicio_prestamo} />
                      <DateRow label="Límite devolución" value={s.fecha_limite_devolucion} warn />
                    </>
                  )}

                  {/* === DEVUELTO (6): mostrar fechas completas del ciclo === */}
                  {estado === 6 && (
                    <>
                      <DateRow label="Fecha entrega" value={s.fecha_inicio_prestamo} />
                      <DateRow label="Devuelto el" value={s.fecha_devolucion_real} />
                    </>
                  )}
                </div>

                {/* Actions — solo para pendientes */}
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
            <button className="btn btn-ghost" onClick={() => setCancelModal(null)}>Cerrar</button>
            <button className="btn btn-danger" disabled={submitting} onClick={handleCancel}>
              {submitting ? 'Cancelando...' : 'Sí, cancelar'}
            </button>
          </>
        }
      >
        <p>¿Estás seguro de cancelar la solicitud del libro <strong>{cancelModal?.titulo || '#' + cancelModal?.id}</strong>?</p>
      </Modal>

      <Modal
        open={cancelAllModal}
        onClose={() => setCancelAllModal(false)}
        title="Cancelar Todas las Solicitudes"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setCancelAllModal(false)}>Cerrar</button>
            <button className="btn btn-danger" disabled={submitting} onClick={handleCancelAll}>
              {submitting ? 'Cancelando...' : `Sí, cancelar todas (${pendientes.length})`}
            </button>
          </>
        }
      >
        <p>¿Estás seguro de cancelar <strong>todas tus {pendientes.length} solicitudes pendientes</strong> de libros?</p>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Esta acción no se puede deshacer.</p>
      </Modal>
    </AnimatedPage>
  );
}
