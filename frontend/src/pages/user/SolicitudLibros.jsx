import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { recursosApi, solicitudesApi } from '../../api/recursos';
import { useAuth } from '../../context/AuthContext';
import { EmptyState } from '../../components/ui/Feedback';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';
import { AlertCircle, Search, TrendingUp, Star } from 'lucide-react';
import AnimatedPage from '../../components/layout/AnimatedPage';
import { DOCUMENTACION_REQUERIDA_MENSAJE } from '../../constants/documentacion';
import { SkeletonGrid } from '../../components/ui/Skeleton';

const MAX_LIBROS = 3;

export default function SolicitudLibros() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterDisp, setFilterDisp] = useState('');
  const [page, setPage] = useState(1);
  const [confirm, setConfirm] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [activasCount, setActivasCount] = useState(0);
  const [masSolicitados, setMasSolicitados] = useState([]);
  const [loadingTop, setLoadingTop] = useState(true);
  const PER_PAGE = 12;
  const BATCH_SIZE = 120;
  const loadTokenRef = useRef(0);
  const nextBatchPageRef = useRef(1);
  const itemsRef = useRef([]);
  const totalCountRef = useRef(0);
  const loadingMoreRef = useRef(false);

  const commitItems = useCallback((valueOrUpdater) => {
    setItems((prev) => {
      const next = typeof valueOrUpdater === 'function'
        ? valueOrUpdater(prev)
        : valueOrUpdater;
      itemsRef.current = next;
      return next;
    });
  }, []);

  const commitTotal = useCallback((value) => {
    totalCountRef.current = value;
    setTotalCount(value);
  }, []);

  const fetchBatch = useCallback((batchPage) => (
    recursosApi.getByType('libro', { page: batchPage, limit: BATCH_SIZE })
  ), []);

  const load = useCallback(async () => {
    const token = loadTokenRef.current + 1;
    loadTokenRef.current = token;
    nextBatchPageRef.current = 1;
    loadingMoreRef.current = false;

    setLoading(true);
    setCatalogLoading(false);
    setLoadingTop(true);

    try {
      const [catData, solData] = await Promise.all([
        fetchBatch(1),
        solicitudesApi.getUserSolicitudes(),
      ]);

      if (loadTokenRef.current !== token) return;

      const libros = catData.data || [];
      nextBatchPageRef.current = 2;
      commitItems(libros);
      commitTotal(catData.total ?? libros.length);

      const sols = solData.data || [];
      const activas = sols.filter(s => s.tipo_solicitud === 'libro' && s.estado_asistencia_id === 1).length;
      setActivasCount(activas);
    } catch {
      toast.error('Error al cargar libros');
    } finally {
      if (loadTokenRef.current === token) {
        setLoading(false);
      }
    }

    void recursosApi.getMasSolicitados()
      .then((topData) => {
        if (loadTokenRef.current !== token) return;
        setMasSolicitados(topData.data || []);
      })
      .catch((err) => {
        if (loadTokenRef.current === token) {
          console.error('Error cargando libros mas solicitados:', err);
        }
      })
      .finally(() => {
        if (loadTokenRef.current === token) {
          setLoadingTop(false);
        }
      });

    if (loadTokenRef.current !== token || itemsRef.current.length >= totalCountRef.current) {
      return;
    }

    loadingMoreRef.current = true;
    setCatalogLoading(true);

    try {
      while (loadTokenRef.current === token && itemsRef.current.length < totalCountRef.current) {
        const batchPage = nextBatchPageRef.current;
        const data = await fetchBatch(batchPage);

        if (loadTokenRef.current !== token) return;

        const libros = data.data || [];
        if (libros.length === 0) {
          break;
        }

        nextBatchPageRef.current = batchPage + 1;
        commitTotal(data.total ?? totalCountRef.current);
        commitItems((prev) => [...prev, ...libros]);
      }
    } catch (err) {
      if (loadTokenRef.current === token) {
        console.error('Error cargando libros en segundo plano:', err);
      }
    } finally {
      if (loadTokenRef.current === token) {
        setCatalogLoading(false);
      }
      loadingMoreRef.current = false;
    }
  }, [commitItems, commitTotal, fetchBatch]);

  useEffect(() => {
    load();
    return () => {
      loadTokenRef.current += 1;
      loadingMoreRef.current = false;
    };
  }, [load]);

  const tipos = useMemo(() => [...new Set(items.map((b) => b.libros?.tipo_material || b.tipo_material).filter(Boolean))], [items]);
  const sinDocumentos = user?.tiene_documentos === false;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((b) => {
      const titulo = b.libros?.titulo || b.titulo || '';
      const autor = b.libros?.autor || b.autor || '';
      const isbn = b.libros?.isbn || b.isbn || '';
      const clasificacion = b.libros?.clasificacion || b.clasificacion || '';
      const tipo = b.libros?.tipo_material || b.tipo_material || '';
      const disp = b.Disponible ?? b.disponible;
      if (q && !(
        titulo.toLowerCase().includes(q) ||
        autor.toLowerCase().includes(q) ||
        isbn.toLowerCase().includes(q) ||
        clasificacion.toLowerCase().includes(q)
      )) return false;
      if (filterTipo && tipo !== filterTipo) return false;
      if (filterDisp === 'si' && !disp) return false;
      if (filterDisp === 'no' && disp) return false;
      return true;
    });
  }, [items, search, filterTipo, filterDisp]);

  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const catalogReady = totalCount > 0 && items.length >= totalCount;

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    if (page > maxPage) {
      setPage(maxPage);
    }
  }, [filtered.length, page]);

  const handleSolicitar = async () => {
    setSubmitting(true);
    try {
      await solicitudesApi.create('libro', user.boleta, confirm.id);
      toast.success('Solicitud de libro creada exitosamente');
      // Actualizar estado local sin recargar todo el catálogo
      setItems(prev => prev.map(b => b.id === confirm.id ? { ...b, Disponible: false, disponible: false } : b));
      setActivasCount(prev => prev + 1);
      setConfirm(null);
    } catch (err) {
      toast.error(err.message);
    } finally { setSubmitting(false); }
  };

  return (
    <AnimatedPage>
      <div className="page-header">
        <h1>Catálogo de Libros</h1>
        <p>Busca y solicita libros del acervo bibliográfico</p>
        <span className="badge badge-info" style={{ fontSize: '0.95rem', padding: '0.4rem 0.9rem', marginLeft: '1rem' }}>
          {totalCount} libros en biblioteca
        </span>
      </div>

      {activasCount >= MAX_LIBROS && (
        <div style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', background: '#f59e0b18', border: '1px solid #f59e0b44', marginBottom: '1rem', fontSize: '0.85rem', color: '#f59e0b' }}>
          Ya tienes {activasCount} solicitudes de libros activas (máximo {MAX_LIBROS}). Debes concluir alguna antes de solicitar otro.
        </div>
      )}

      {sinDocumentos && (
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', padding: '0.9rem 1rem', borderRadius: 'var(--radius-sm)', background: '#f59e0b18', border: '1px solid #f59e0b44', marginBottom: '1rem', color: '#b45309' }}>
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
          <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.5 }}>{DOCUMENTACION_REQUERIDA_MENSAJE}</p>
        </div>
      )}

      {!loadingTop && masSolicitados.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <TrendingUp size={18} color="var(--accent-primary)" />
            <h3 style={{ margin: 0, fontSize: '1rem' }}>Libros más solicitados</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Recomendaciones</span>
          </div>
          <div className="resource-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
            {masSolicitados.map((b) => (
              <div key={b.id} className="resource-card" style={{ border: '1px solid var(--accent-primary-light)' }}>
                <div className="resource-card-title" title={b.libros?.titulo || 'Sin título'}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                    {b.libros?.titulo || 'Sin título'}
                  </span>
                  {b.solicitudes_count >= 3 && <Star size={14} color="#f59e0b" fill="#f59e0b" />}
                </div>
                <div className="resource-card-body">
                  <div className="resource-card-row"><span className="resource-card-label">Autor</span><span className="resource-card-value">{b.libros?.autor || '-'}</span></div>
                  <div className="resource-card-row"><span className="resource-card-label">Solicitado</span><span className="resource-card-value" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{b.solicitudes_count} vez{Number(b.solicitudes_count) !== 1 ? 'es' : ''}</span></div>
                </div>
                <div className="resource-card-actions">
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => {
                      setSearch(b.libros?.titulo || '');
                      setFilterTipo('');
                      setFilterDisp('');
                      setPage(1);
                    }}
                  >
                    Ver en catálogo
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="toolbar">
        <div style={{ position: 'relative', flex: 1, maxWidth: 350 }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
          <input
            className="search-input"
            style={{ paddingLeft: 34 }}
            placeholder="Buscar por título, autor, ISBN..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select value={filterTipo} onChange={(e) => { setFilterTipo(e.target.value); setPage(1); }} style={{ maxWidth: 180 }}>
          <option value="">Todos los tipos</option>
          {tipos.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filterDisp} onChange={(e) => { setFilterDisp(e.target.value); setPage(1); }} style={{ maxWidth: 160 }}>
          <option value="">Disponibilidad</option>
          <option value="si">Disponible</option>
          <option value="no">No disponible</option>
        </select>
      </div>

      {loading && items.length === 0 ? (
        <SkeletonGrid count={PER_PAGE} />
      ) : paged.length === 0 ? (
        <EmptyState message="No se encontraron libros" />
      ) : (
        <div className="resource-grid">
          {paged.map((b) => (
            <div key={b.id} className="resource-card">
              <div className="resource-card-title" title={b.libros?.titulo || b.titulo || 'Sin título'}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                  {b.libros?.titulo || b.titulo || 'Sin título'}
                </span>
                <span className={`badge ${(b.Disponible ?? b.disponible) ? 'badge-success' : 'badge-danger'}`}>
                  {(b.Disponible ?? b.disponible) ? 'Disponible' : 'No disponible'}
                </span>
              </div>
              <div className="resource-card-body">
                <div className="resource-card-row"><span className="resource-card-label">Autor</span><span className="resource-card-value">{b.libros?.autor || b.autor || '-'}</span></div>
                <div className="resource-card-row"><span className="resource-card-label">Clasificación</span><span className="resource-card-value">{b.libros?.clasificacion || b.clasificacion || '-'}</span></div>
                <div className="resource-card-row"><span className="resource-card-label">ISBN</span><span className="resource-card-value">{b.libros?.isbn || b.isbn || '-'}</span></div>
                <div className="resource-card-row"><span className="resource-card-label">Tipo</span><span className="resource-card-value">{b.libros?.tipo_material || b.tipo_material || '-'}</span></div>
                <div className="resource-card-row"><span className="resource-card-label">Año</span><span className="resource-card-value">{b.anio || '-'}</span></div>
                <div className="resource-card-row"><span className="resource-card-label">Ejemplar #</span><span className="resource-card-value">{b.numero_ejemplar || '-'}</span></div>
              </div>
              <div className="resource-card-actions">
                <button
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1 }}
                  disabled={sinDocumentos || !(b.Disponible ?? b.disponible) || activasCount >= MAX_LIBROS}
                  onClick={() => setConfirm(b)}
                >
                  {sinDocumentos ? 'Documentos pendientes' : activasCount >= MAX_LIBROS ? 'Límite alcanzado' : 'Solicitar'}
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
        title="Confirmar Solicitud de Libro"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setConfirm(null)}>Cancelar</button>
            <button className="btn btn-primary" disabled={submitting} onClick={handleSolicitar}>
              {submitting ? 'Enviando...' : 'Confirmar'}
            </button>
          </>
        }
      >
        <p>¿Deseas solicitar el libro <strong>{confirm?.libros?.titulo || confirm?.titulo}</strong>?</p>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
          Autor: {confirm?.libros?.autor || confirm?.autor} | ISBN: {confirm?.libros?.isbn || confirm?.isbn}
        </p>
      </Modal>
    </AnimatedPage>
  );
}
