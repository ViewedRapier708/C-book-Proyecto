import { useState, useEffect, useMemo, useCallback } from 'react';
import { adminApi } from '../../api/admin';
import { Spinner, EmptyState } from '../../components/ui/Feedback';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';
import { Search, CheckCircle, XCircle, Package, RefreshCw } from 'lucide-react';
import AnimatedPage from '../../components/layout/AnimatedPage';

const ESTADO_MAP = {
  1: { label: 'Pendiente', badge: 'badge-warning' },
  2: { label: 'Aprobada', badge: 'badge-info' },
  3: { label: 'Rechazada', badge: 'badge-danger' },
  4: { label: 'Cancelada', badge: 'badge-danger' },
  5: { label: 'Entregado', badge: 'badge-success' },
};
function getEstado(s) {
  // Primero intentar con estado_solicitud_id (correcto para solicitudes)
  // Si no existe, usar estado_asistencia_id como fallback
  const id = s.estado_solicitud_id ?? s.estado_asistencia_id;
  return ESTADO_MAP[id] || { label: `Estado ${id}`, badge: 'badge-neutral' };
}

export default function SolicitudesLibros() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [actionModal, setActionModal] = useState(null); // { item, action: 'aprobar'|'rechazar'|'entregar' }
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const PER_PAGE = 12;

  const load = useCallback(async (showRefresh = false, silent = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const data = await adminApi.getBookSolicitudes();
      const solicitudes = [...(data.data || [])].sort((a, b) => new Date(b.fecha_solicitud || 0) - new Date(a.fecha_solicitud || 0));
      setItems(solicitudes);
    } catch {
      if (!silent) toast.error('Error al cargar solicitudes');
    }
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();

    const interval = setInterval(() => load(true, true), 15000);
    const handleFocus = () => load(true, true);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        load(true, true);
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((s) => !q ||
      (s.ejemplares?.libros?.titulo || '').toLowerCase().includes(q) ||
      String(s.usuario_boleta || '').toLowerCase().includes(q) ||
      String(s.id).includes(q)
    );
  }, [items, search]);

  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleAction = async () => {
    setSubmitting(true);
    const { item, action } = actionModal;
    try {
      if (action === 'aprobar') {
        await adminApi.manageBookSolicitud(item.id, { estado: 2, boletaUser: item.usuario_boleta });
        toast.success('Solicitud aprobada');
      } else if (action === 'rechazar') {
        await adminApi.manageBookSolicitud(item.id, { estado: 3, boletaUser: item.usuario_boleta });
        toast.success('Solicitud rechazada');
      } else if (action === 'entregar') {
        await adminApi.registerDelivery(item.id);
        toast.success('Entrega registrada');
      }
      setActionModal(null);
      load(true);
    } catch (err) { toast.error(err.message); }
    finally { setSubmitting(false); }
  };

  if (loading && items.length === 0) return <Spinner />;

  const pendientes = items.filter((s) => (s.estado_solicitud_id ?? s.estado_asistencia_id) === 1).length;
  const aprobados = items.filter((s) => (s.estado_solicitud_id ?? s.estado_asistencia_id) === 2).length;

  return (
    <AnimatedPage>
      <div className="page-header">
        <h1>Solicitudes de Libros</h1>
        <p>Gestiona las solicitudes de préstamo de libros</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-card-label">Pendientes</div><div className="stat-card-value" style={{ color: 'var(--warning)' }}>{pendientes}</div></div>
        <div className="stat-card"><div className="stat-card-label">Aprobados (por recoger)</div><div className="stat-card-value" style={{ color: 'var(--secondary)' }}>{aprobados}</div></div>
        <div className="stat-card"><div className="stat-card-label">Total</div><div className="stat-card-value">{items.length}</div></div>
      </div>

      <div className="toolbar">
        <div style={{ position: 'relative', flex: 1, maxWidth: 350 }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
          <input className="search-input" style={{ paddingLeft: 34 }} placeholder="Buscar por título, boleta..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <button className="btn btn-primary" onClick={() => load(true)} disabled={refreshing} title="Recargar solicitudes">
          <RefreshCw size={16} style={{ animation: refreshing ? 'spin .7s linear infinite' : 'none' }} />
          {refreshing ? 'Actualizando...' : 'Recargar'}
        </button>
      </div>

      {paged.length === 0 ? (
        <EmptyState message="No hay solicitudes de libros" />
      ) : (
        <div className="resource-grid">
          {paged.map((s) => {
            const est = getEstado(s);
            const estadoId = s.estado_solicitud_id ?? s.estado_asistencia_id;
            return (
              <div key={s.id} className="resource-card">
                <div className="resource-card-title">
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>{s.ejemplares?.libros?.titulo || `Solicitud #${s.id}`}</span>
                  <span className={`badge ${est.badge}`}>{est.label}</span>
                </div>
                <div className="resource-card-body">
                  <div className="resource-card-row"><span className="resource-card-label">Boleta</span><span className="resource-card-value">{s.usuario_boleta || '-'}</span></div>
                  <div className="resource-card-row"><span className="resource-card-label">Alumno</span><span className="resource-card-value">{s.usuarios_web_movil?.boletas?.nombre || '-'}</span></div>
                  <div className="resource-card-row"><span className="resource-card-label">Fecha</span><span className="resource-card-value">{s.fecha_solicitud ? new Date(s.fecha_solicitud).toLocaleString('es-MX') : '-'}</span></div>
                  {s.fecha_limite_respuesta && <div className="resource-card-row"><span className="resource-card-label">Lím. Respuesta</span><span className="resource-card-value">{new Date(s.fecha_limite_respuesta).toLocaleString('es-MX')}</span></div>}
                </div>
                <div className="resource-card-actions">
                  {estadoId === 1 && (
                    <>
                      <button className="btn btn-success btn-sm" onClick={() => setActionModal({ item: s, action: 'aprobar' })}>
                        <CheckCircle size={14} /> Aprobar
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => setActionModal({ item: s, action: 'rechazar' })}>
                        <XCircle size={14} /> Rechazar
                      </button>
                    </>
                  )}
                  {estadoId === 2 && (
                    <button className="btn btn-primary btn-sm" onClick={() => setActionModal({ item: s, action: 'entregar' })}>
                      <Package size={14} /> Registrar Entrega
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Pagination page={page} total={filtered.length} perPage={PER_PAGE} onChange={setPage} />

      <Modal
        open={!!actionModal}
        onClose={() => setActionModal(null)}
        title={actionModal?.action === 'aprobar' ? 'Aprobar Solicitud' : actionModal?.action === 'rechazar' ? 'Rechazar Solicitud' : 'Registrar Entrega'}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setActionModal(null)}>Cancelar</button>
            <button
              className={`btn ${actionModal?.action === 'rechazar' ? 'btn-danger' : 'btn-primary'}`}
              disabled={submitting}
              onClick={handleAction}
            >
              {submitting ? 'Procesando...' : 'Confirmar'}
            </button>
          </>
        }
      >
        <p>
          {actionModal?.action === 'aprobar' && `¿Aprobar la solicitud de "${actionModal?.item?.ejemplares?.libros?.titulo || '#' + actionModal?.item?.id}"?`}
          {actionModal?.action === 'rechazar' && `¿Rechazar la solicitud de "${actionModal?.item?.ejemplares?.libros?.titulo || '#' + actionModal?.item?.id}"?`}
          {actionModal?.action === 'entregar' && `¿Registrar la entrega de "${actionModal?.item?.ejemplares?.libros?.titulo || '#' + actionModal?.item?.id}"?`}
        </p>
      </Modal>
    </AnimatedPage>
  );
}
