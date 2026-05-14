import { useState, useEffect, useMemo, useCallback } from 'react';
import { solicitudesApi } from '../../api/recursos';
import { Spinner, EmptyState } from '../../components/ui/Feedback';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';
import { Search, XCircle } from 'lucide-react';
import AnimatedPage from '../../components/layout/AnimatedPage';

const ESTADO_MAP = {
  1: { label: 'Pendiente', badge: 'badge-warning' },
  2: { label: 'Asistió', badge: 'badge-success' },
  3: { label: 'Cancelada', badge: 'badge-danger' },
  4: { label: 'No asistió', badge: 'badge-danger' },
};

function getEstado(id) {
  return ESTADO_MAP[id] || { label: `Estado ${id}`, badge: 'badge-neutral' };
}

function getTipoLabel(tipo) {
  const m = { computadora: 'Computadora', restirador: 'Restirador', libro: 'Libro' };
  return m[tipo] || tipo;
}

export default function MisSolicitudes() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [page, setPage] = useState(1);
  const [cancelModal, setCancelModal] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const PER_PAGE = 12;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await solicitudesApi.getUserSolicitudes();
      const list = data.data || data.solicitudes || [];
      const normalized = list.filter((s) => s.tipo_solicitud !== 'libro');
      setItems(normalized);
    } catch { toast.error('Error al cargar solicitudes'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((s) => {
      if (q && !String(s.id).includes(q) && !(s.tipo_solicitud || '').toLowerCase().includes(q)) return false;
      if (filterTipo && s.tipo_solicitud !== filterTipo) return false;
      if (filterEstado && String(s.estado_asistencia_id) !== filterEstado) return false;
      return true;
    });
  }, [items, search, filterTipo, filterEstado]);

  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleCancel = async () => {
    setSubmitting(true);
    try {
      await solicitudesApi.cancel(cancelModal.tipo_solicitud, cancelModal.id);
      toast.success('Solicitud cancelada');
      setCancelModal(null);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally { setSubmitting(false); }
  };

  if (loading) return <Spinner />;

  return (
    <AnimatedPage>
      <div className="page-header">
        <h1>Mis Solicitudes</h1>
        <p>Revisa y gestiona tus solicitudes de recursos</p>
      </div>

      <div className="toolbar">
        <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
          <input className="search-input" style={{ paddingLeft: 34 }} placeholder="Buscar..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select value={filterTipo} onChange={(e) => { setFilterTipo(e.target.value); setPage(1); }} style={{ maxWidth: 160 }}>
          <option value="">Todos los tipos</option>
          <option value="computadora">Computadora</option>
          <option value="restirador">Restirador</option>
        </select>
        <select value={filterEstado} onChange={(e) => { setFilterEstado(e.target.value); setPage(1); }} style={{ maxWidth: 160 }}>
          <option value="">Todos los estados</option>
          <option value="1">Pendiente</option>
          <option value="2">Asistió</option>
          <option value="3">Cancelada</option>
          <option value="4">No asistió</option>
        </select>
      </div>

      {paged.length === 0 ? (
        <EmptyState message="No tienes solicitudes" />
      ) : (
        <div className="resource-grid">
          {paged.map((s) => {
            const est = getEstado(s.estado_asistencia_id);
            return (
              <div key={`${s.tipo_solicitud}-${s.id}`} className="resource-card">
                <div className="resource-card-title">
                  {getTipoLabel(s.tipo_solicitud)} #{s.id}
                  <span className={`badge ${est.badge}`}>{est.label}</span>
                </div>
                <div className="resource-card-body">
                  <div className="resource-card-row"><span className="resource-card-label">Tipo</span><span className="resource-card-value">{getTipoLabel(s.tipo_solicitud)}</span></div>
                  <div className="resource-card-row"><span className="resource-card-label">Fecha</span><span className="resource-card-value">{s.fecha_solicitud ? new Date(s.fecha_solicitud).toLocaleString('es-MX') : '-'}</span></div>
                </div>
                {s.estado_asistencia_id === 1 && (
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
        <p>¿Estás seguro de cancelar la solicitud <strong>#{cancelModal?.id}</strong> de {cancelModal ? getTipoLabel(cancelModal.tipo_solicitud) : ''}?</p>
      </Modal>
    </AnimatedPage>
  );
}
