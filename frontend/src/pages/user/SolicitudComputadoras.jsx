import { useState, useEffect, useMemo, useCallback } from 'react';
import { recursosApi, solicitudesApi } from '../../api/recursos';
import { useAuth } from '../../context/AuthContext';
import { Spinner, EmptyState } from '../../components/ui/Feedback';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';
import { Search } from 'lucide-react';
import AnimatedPage from '../../components/layout/AnimatedPage';

export default function SolicitudComputadoras() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [confirm, setConfirm] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const PER_PAGE = 12;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await recursosApi.getByType('computadora');
      setItems(data.data || []);
    } catch { toast.error('Error al cargar computadoras'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((c) =>
      !q ||
      (c.procesador || '').toLowerCase().includes(q) ||
      (c.carrera || '').toLowerCase().includes(q) ||
      String(c.no_computadora || '').includes(q)
    );
  }, [items, search]);

  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleSolicitar = async () => {
    setSubmitting(true);
    try {
      await solicitudesApi.create('computadora', user.boleta, confirm.no_computadora);
      toast.success('Solicitud creada exitosamente');
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
        <h1>Computadoras Disponibles</h1>
        <p>Selecciona una computadora para solicitar su uso</p>
      </div>

      <div className="toolbar">
        <div style={{ position: 'relative', flex: 1, maxWidth: 350 }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
          <input
            className="search-input"
            style={{ paddingLeft: 34 }}
            placeholder="Buscar por procesador, carrera, No..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {paged.length === 0 ? (
        <EmptyState message="No se encontraron computadoras" />
      ) : (
        <div className="resource-grid">
          {paged.map((c) => (
            <div key={c.id} className="resource-card">
              <div className="resource-card-title">
                Computadora #{c.no_computadora || c.id}
                <span className={`badge ${(c.Disponible ?? c.disponible) ? 'badge-success' : 'badge-danger'}`}>
                  {(c.Disponible ?? c.disponible) ? 'Disponible' : 'Ocupada'}
                </span>
              </div>
              <div className="resource-card-body">
                <div className="resource-card-row"><span className="resource-card-label">Procesador</span><span className="resource-card-value">{c.procesador || '-'}</span></div>
                <div className="resource-card-row"><span className="resource-card-label">RAM</span><span className="resource-card-value">{c.ram || '-'}</span></div>
                <div className="resource-card-row"><span className="resource-card-label">Carrera</span><span className="resource-card-value">{c.carrera || '-'}</span></div>
                <div className="resource-card-row"><span className="resource-card-label">Funcionamiento</span><span className="resource-card-value">{(c.En_funcionamiento ?? c.en_funcionamiento) ? 'Sí' : 'No'}</span></div>
                {(c.Observacion || c.observacion) && (
                  <div className="resource-card-row"><span className="resource-card-label">Observación</span><span className="resource-card-value">{c.Observacion || c.observacion}</span></div>
                )}
              </div>
              <div className="resource-card-actions">
                <button
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1 }}
                  disabled={!(c.Disponible ?? c.disponible)}
                  onClick={() => setConfirm(c)}
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
        <p>¿Deseas solicitar la <strong>Computadora #{confirm?.no_computadora || confirm?.id}</strong>?</p>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
          Procesador: {confirm?.procesador} | RAM: {confirm?.ram}
        </p>
      </Modal>
    </AnimatedPage>
  );
}
