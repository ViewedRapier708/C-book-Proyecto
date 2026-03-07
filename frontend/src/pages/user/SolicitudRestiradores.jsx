import { useState, useEffect, useMemo, useCallback } from 'react';
import { recursosApi, solicitudesApi } from '../../api/recursos';
import { useAuth } from '../../context/AuthContext';
import { Spinner, EmptyState } from '../../components/ui/Feedback';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';
import { Search } from 'lucide-react';
import AnimatedPage from '../../components/layout/AnimatedPage';

export default function SolicitudRestiradores() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDisp, setFilterDisp] = useState('');
  const [page, setPage] = useState(1);
  const [confirm, setConfirm] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const PER_PAGE = 12;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await recursosApi.getByType('restirador');
      setItems(data.data || []);
    } catch { toast.error('Error al cargar restiradores'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((r) => {
      if (q && !String(r.no_restirador || '').includes(q) && !(r.Observacion || r.observacion || '').toLowerCase().includes(q)) return false;
      if (filterDisp === 'si' && !(r.Disponible ?? r.disponible)) return false;
      if (filterDisp === 'no' && (r.Disponible ?? r.disponible)) return false;
      return true;
    });
  }, [items, search, filterDisp]);

  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleSolicitar = async () => {
    setSubmitting(true);
    try {
      await solicitudesApi.create('restirador', user.boleta, confirm.no_restirador);
      toast.success('Solicitud de restirador creada');
      setConfirm(null);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally { setSubmitting(false); }
  };

  if (loading) return <Spinner />;

  return (
    <AnimatedPage>
      <div className="page-header">
        <h1>Restiradores Disponibles</h1>
        <p>Reserva un restirador de trabajo</p>
      </div>

      <div className="toolbar">
        <div style={{ position: 'relative', flex: 1, maxWidth: 350 }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
          <input
            className="search-input"
            style={{ paddingLeft: 34 }}
            placeholder="Buscar por número o observación..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select value={filterDisp} onChange={(e) => { setFilterDisp(e.target.value); setPage(1); }} style={{ maxWidth: 160 }}>
          <option value="">Disponibilidad</option>
          <option value="si">Disponible</option>
          <option value="no">Ocupado</option>
        </select>
      </div>

      {paged.length === 0 ? (
        <EmptyState message="No se encontraron restiradores" />
      ) : (
        <div className="resource-grid">
          {paged.map((r) => (
            <div key={r.id} className="resource-card">
              <div className="resource-card-title">
                Restirador #{r.no_restirador || r.id}
                <span className={`badge ${(r.Disponible ?? r.disponible) ? 'badge-success' : 'badge-danger'}`}>
                  {(r.Disponible ?? r.disponible) ? 'Disponible' : 'Ocupado'}
                </span>
              </div>
              <div className="resource-card-body">
                <div className="resource-card-row"><span className="resource-card-label">No. Inventario</span><span className="resource-card-value">{r.no_inventario || '-'}</span></div>
                <div className="resource-card-row"><span className="resource-card-label">Estado Material</span><span className="resource-card-value">{r.estado_de_material ?? r.estado_material ?? '-'}</span></div>
                {(r.Observacion || r.observacion) && (
                  <div className="resource-card-row"><span className="resource-card-label">Observación</span><span className="resource-card-value">{r.Observacion || r.observacion}</span></div>
                )}
              </div>
              <div className="resource-card-actions">
                <button
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1 }}
                  disabled={!(r.Disponible ?? r.disponible)}
                  onClick={() => setConfirm(r)}
                >
                  Solicitar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} total={filtered.length} perPage={PER_PAGE} onChange={setPage} />

      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title="Confirmar Solicitud"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setConfirm(null)}>Cancelar</button>
            <button className="btn btn-primary" disabled={submitting} onClick={handleSolicitar}>
              {submitting ? 'Enviando...' : 'Confirmar'}
            </button>
          </>
        }
      >
        <p>¿Deseas solicitar el <strong>Restirador #{confirm?.no_restirador || confirm?.id}</strong>?</p>
      </Modal>
    </AnimatedPage>
  );
}
