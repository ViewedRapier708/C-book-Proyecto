import { useState, useEffect, useCallback, useRef } from 'react';
import { recursosApi, solicitudesApi } from '../../api/recursos';
import { useAuth } from '../../context/AuthContext';
// useHorario queda disponible si se reactiva la limitación por horario de biblioteca.
// import { useHorario } from '../../components/layout/HorarioRestriction';
import { EmptyState } from '../../components/ui/Feedback';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';
// Si se reactiva el aviso de horario, volver a agregar Clock a este import.
import { AlertCircle, Search, TrendingUp, Star } from 'lucide-react';
import AnimatedPage from '../../components/layout/AnimatedPage';
import { DOCUMENTACION_REQUERIDA_MENSAJE } from '../../constants/documentacion';
import { SkeletonGrid } from '../../components/ui/Skeleton';

const MAX_LIBROS = 3;

export default function SolicitudLibros() {
  const { user } = useAuth();
  // const { dentroHorario } = useHorario();
  const [items, setItems] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterDisp, setFilterDisp] = useState('');
  const [page, setPage] = useState(1);
  const [confirm, setConfirm] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [activasCount, setActivasCount] = useState(0);
  const [masSolicitados, setMasSolicitados] = useState([]);
  const [loadingTop, setLoadingTop] = useState(true);
  const [searchResults, setSearchResults] = useState([]);
  const [tipos, setTipos] = useState([]);
  const PER_PAGE = 10;
  const LAZY_THRESHOLD = 7;
  const loadTokenRef = useRef(0);
  const prefetchTokenRef = useRef(0);
  const pageCacheRef = useRef(new Map());
  const activePageRef = useRef(1);

  const isSearching = search.trim().length > 0;

  const buildParams = useCallback((extra = {}) => {
    const params = { ...extra };
    if (filterTipo) params.tipo_material = filterTipo;
    if (filterDisp) params.disponible = filterDisp === 'si' ? 'true' : 'false';
    return params;
  }, [filterDisp, filterTipo]);

  const fetchPage = useCallback((pageNum) => (
    recursosApi.getByType('libro', buildParams({ page: pageNum, limit: PER_PAGE }))
  ), [buildParams]);

  const loadPage = useCallback(async (pageNum) => {
    const cached = pageCacheRef.current.get(pageNum);
    if (cached) {
      if (activePageRef.current === pageNum) {
        setItems(cached);
      }
      return;
    }

    const token = loadTokenRef.current + 1;
    loadTokenRef.current = token;
    setLoading(true);

    try {
      const data = await fetchPage(pageNum);
      if (loadTokenRef.current !== token || activePageRef.current !== pageNum) return;
      const libros = data.data || [];
      pageCacheRef.current.set(pageNum, libros);
      setItems(libros);
      setTotalCount(data.total ?? libros.length);
    } catch {
      toast.error('Error al cargar libros');
    } finally {
      if (loadTokenRef.current === token) {
        setLoading(false);
      }
    }
  }, [fetchPage]);

  useEffect(() => {
    let active = true;
    solicitudesApi.getUserSolicitudes()
      .then((solData) => {
        if (!active) return;
        const sols = solData.data || [];
        const activas = sols.filter(s => s.tipo_solicitud === 'libro' && s.estado_asistencia_id === 1).length;
        setActivasCount(activas);
      })
      .catch(() => toast.error('Error al cargar solicitudes activas'));

    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    recursosApi.getByType('libro', { only_tipos: true })
      .then((data) => {
        if (!active) return;
        setTipos((data.data || []).map((row) => row.tipo_material).filter(Boolean));
      })
      .catch((err) => console.error('Error cargando tipos de libros:', err));

    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    setLoadingTop(true);
    recursosApi.getMasSolicitados()
      .then((topData) => {
        if (active) setMasSolicitados(topData.data || []);
      })
      .catch((err) => console.error('Error cargando libros mas solicitados:', err))
      .finally(() => {
        if (active) setLoadingTop(false);
      });

    return () => { active = false; };
  }, []);

  useEffect(() => {
    const token = loadTokenRef.current + 1;
    loadTokenRef.current = token;
    pageCacheRef.current.clear();
    activePageRef.current = 1;
    setLoading(true);

    const query = search.trim();
    const timer = setTimeout(async () => {
      try {
        if (query) {
          const data = await recursosApi.getByType('libro', buildParams({ q: query, all: true }));
          if (loadTokenRef.current !== token) return;
          const results = data.data || [];
          setSearchResults(results);
          setItems(results.slice(0, PER_PAGE));
          setTotalCount(data.total ?? results.length);
          setPage(1);
          return;
        }

        setSearchResults([]);
        const data = await fetchPage(1);
        if (loadTokenRef.current !== token) return;
        const libros = data.data || [];
        pageCacheRef.current.set(1, libros);
        setItems(libros);
        setTotalCount(data.total ?? libros.length);
        setPage(1);
      } catch {
        toast.error('Error al cargar libros');
      } finally {
        if (loadTokenRef.current === token) {
          setLoading(false);
        }
      }
    }, query ? 300 : 0);

    return () => clearTimeout(timer);
  }, [buildParams, fetchPage, search]);

  useEffect(() => {
    if (isSearching || page < LAZY_THRESHOLD || totalCount <= 0) return undefined;

    let cancelled = false;
    const token = prefetchTokenRef.current + 1;
    prefetchTokenRef.current = token;

    const prefetchRemaining = async () => {
      const totalPages = Math.ceil(totalCount / PER_PAGE);
      for (let nextPage = page + 1; nextPage <= totalPages; nextPage += 1) {
        if (cancelled || prefetchTokenRef.current !== token) return;
        if (pageCacheRef.current.has(nextPage)) continue;

        try {
          const data = await fetchPage(nextPage);
          if (cancelled || prefetchTokenRef.current !== token) return;
          pageCacheRef.current.set(nextPage, data.data || []);
        } catch (err) {
          console.error('Error precargando libros:', err);
          return;
        }
      }
    };

    void prefetchRemaining();
    return () => { cancelled = true; };
  }, [fetchPage, isSearching, page, totalCount]);

  const sinDocumentos = user?.tiene_documentos === false;

  const handlePageChange = async (nextPage) => {
    activePageRef.current = nextPage;
    setPage(nextPage);
    if (isSearching) {
      setItems(searchResults.slice((nextPage - 1) * PER_PAGE, nextPage * PER_PAGE));
      return;
    }

    await loadPage(nextPage);
  };

  const handleSolicitar = async () => {
    setSubmitting(true);
    try {
      await solicitudesApi.create('libro', user.boleta, confirm.id);
      toast.success('Solicitud de libro creada exitosamente');
      const markUnavailable = (prev) => prev.map(b => b.id === confirm.id ? { ...b, Disponible: false, disponible: false } : b);
      const updateAfterRequest = (prev) => filterDisp === 'si'
        ? prev.filter((b) => b.id !== confirm.id)
        : markUnavailable(prev);
      setItems(updateAfterRequest);
      setSearchResults(updateAfterRequest);
      pageCacheRef.current.forEach((value, key) => {
        pageCacheRef.current.set(key, updateAfterRequest(value));
      });
      if (filterDisp === 'si') {
        setTotalCount((prev) => Math.max(0, prev - 1));
      }
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

      {/* Bloque disponible para futura reactivación del aviso de horario de biblioteca.
      {!dentroHorario && (
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', padding: '0.9rem 1rem', borderRadius: 'var(--radius-sm)', background: '#f59e0b18', border: '1px solid #f59e0b44', marginBottom: '1rem', color: '#b45309' }}>
          <Clock size={18} style={{ flexShrink: 0, marginTop: 2 }} />
          <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.5 }}>Las solicitudes de préstamo solo están disponibles de 8:00 a 20:00 horas (CDMX). Fuera de este horario puedes consultar el catálogo.</p>
        </div>
      )}
      */}

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

      {!isSearching && !loadingTop && masSolicitados.length > 0 && (
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
                  <span className="resource-card-title-text">
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

      {loading && items.length === 0 ? (
        <SkeletonGrid count={PER_PAGE} />
      ) : items.length === 0 ? (
        <EmptyState message="No se encontraron libros" />
      ) : (
        <div className="resource-grid">
          {items.map((b) => (
            <div key={b.id} className="resource-card">
              <div className="resource-card-title" title={b.libros?.titulo || b.titulo || 'Sin título'}>
                <span className="resource-card-title-text">
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

      <Pagination page={page} total={totalCount} perPage={PER_PAGE} onChange={handlePageChange} />

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
