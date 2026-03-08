import { useState, useEffect, useMemo, useCallback } from 'react';
import { adminApi } from '../../api/admin';
import { Spinner, EmptyState } from '../../components/ui/Feedback';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';
import { Search, RotateCcw } from 'lucide-react';
import AnimatedPage from '../../components/layout/AnimatedPage';

export default function PrestamosLibros() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [returnModal, setReturnModal] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const PER_PAGE = 12;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getBookLoans();
      setItems(data.data || []);
    } catch { toast.error('Error al cargar préstamos'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((p) => !q ||
      (p.solicitudes_libros?.ejemplares?.libros?.titulo || '').toLowerCase().includes(q) ||
      String(p.solicitudes_libros?.usuario_boleta || '').toLowerCase().includes(q) ||
      String(p.id).includes(q)
    );
  }, [items, search]);

  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleReturn = async () => {
    setSubmitting(true);
    try {
      await adminApi.markLoanReturned(returnModal.id);
      toast.success('Préstamo marcado como devuelto');
      setReturnModal(null);
      load();
    } catch (err) { toast.error(err.message); }
    finally { setSubmitting(false); }
  };

  if (loading) return <Spinner />;

  const activos = items.filter((p) => p.estado_prestamo_id !== 3).length;

  return (
    <AnimatedPage>
      <div className="page-header">
        <h1>Préstamos de Libros</h1>
        <p>Seguimiento de libros prestados a usuarios</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-card-label">Préstamos activos</div><div className="stat-card-value" style={{ color: 'var(--primary)' }}>{activos}</div></div>
        <div className="stat-card"><div className="stat-card-label">Total</div><div className="stat-card-value">{items.length}</div></div>
      </div>

      <div className="toolbar">
        <div style={{ position: 'relative', flex: 1, maxWidth: 350 }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
          <input className="search-input" style={{ paddingLeft: 34 }} placeholder="Buscar por título, boleta..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
      </div>

      {paged.length === 0 ? (
        <EmptyState message="No hay préstamos registrados" />
      ) : (
        <div className="resource-grid">
          {paged.map((p) => {
            const devuelto = p.estado_prestamo_id === 3;
            const titulo = p.solicitudes_libros?.ejemplares?.libros?.titulo;
            const boleta = p.solicitudes_libros?.usuario_boleta;
            return (
            <div key={p.id} className="resource-card">
              <div className="resource-card-title">
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%' }}>{titulo || `Préstamo #${p.id}`}</span>
                <span className={`badge ${devuelto ? 'badge-success' : 'badge-info'}`}>{devuelto ? 'Devuelto' : 'Activo'}</span>
              </div>
              <div className="resource-card-body">
                <div className="resource-card-row"><span className="resource-card-label">Boleta</span><span className="resource-card-value">{boleta || '-'}</span></div>
                <div className="resource-card-row"><span className="resource-card-label">Alumno</span><span className="resource-card-value">{p.solicitudes_libros?.usuarios_web_movil?.boletas?.nombre || '-'}</span></div>
                <div className="resource-card-row"><span className="resource-card-label">Fecha Préstamo</span><span className="resource-card-value">{p.fecha_inicio_prestamo ? new Date(p.fecha_inicio_prestamo).toLocaleString('es-MX') : '-'}</span></div>
                {p.fecha_devolucion_real && <div className="resource-card-row"><span className="resource-card-label">Fecha Devolución</span><span className="resource-card-value">{new Date(p.fecha_devolucion_real).toLocaleString('es-MX')}</span></div>}
                {p.fecha_limite_devolucion && <div className="resource-card-row"><span className="resource-card-label">Lím. Devolución</span><span className="resource-card-value">{new Date(p.fecha_limite_devolucion).toLocaleString('es-MX')}</span></div>}
              </div>
              {!devuelto && (
                <div className="resource-card-actions">
                  <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => setReturnModal(p)}>
                    <RotateCcw size={14} /> Marcar Devuelto
                  </button>
                </div>
              )}
            </div>
          )})}
        </div>
      )}

      <Pagination page={page} total={filtered.length} perPage={PER_PAGE} onChange={setPage} />

      <Modal
        open={!!returnModal}
        onClose={() => setReturnModal(null)}
        title="Marcar como Devuelto"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setReturnModal(null)}>Cancelar</button>
            <button className="btn btn-primary" disabled={submitting} onClick={handleReturn}>{submitting ? 'Procesando...' : 'Confirmar'}</button>
          </>
        }
      >
        <p>¿Marcar el préstamo de <strong>{returnModal?.solicitudes_libros?.ejemplares?.libros?.titulo || '#' + returnModal?.id}</strong> como devuelto?</p>
      </Modal>
    </AnimatedPage>
  );
}
