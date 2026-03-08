import { useState, useEffect, useMemo, useCallback } from 'react';
import { adminApi } from '../../api/admin';
import { Spinner, EmptyState } from '../../components/ui/Feedback';
import Pagination from '../../components/ui/Pagination';
import toast from 'react-hot-toast';
import { Search, CheckCircle } from 'lucide-react';
import AnimatedPage from '../../components/layout/AnimatedPage';

export default function Documentos() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('no-docs');
  const [page, setPage] = useState(1);
  const PER_PAGE = 12;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getUsers();
      setItems(data.data || []);
    } catch { toast.error('Error al cargar usuarios'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((u) => {
      if (q && !(u.boleta || '').toLowerCase().includes(q) && !(u.correo || '').toLowerCase().includes(q)) return false;
      if (filter === 'no-docs' && u.tiene_documentos) return false;
      if (filter === 'docs' && !u.tiene_documentos) return false;
      return true;
    });
  }, [items, search, filter]);

  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const pendientes = items.filter((u) => !u.tiene_documentos).length;
  const aprobados = items.filter((u) => u.tiene_documentos).length;

  const handleHabilitar = async (u) => {
    try {
      await adminApi.enableDocumentation(u.id);
      toast.success(`Documentación habilitada para ${u.boleta}`);
      load();
    } catch (err) { toast.error(err.message); }
  };

  if (loading) return <Spinner />;

  return (
    <AnimatedPage>
      <div className="page-header">
        <h1>Gestión de Documentación</h1>
        <p>Habilita la documentación de usuarios para acceder a servicios</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-card-label">Pendientes</div><div className="stat-card-value" style={{ color: 'var(--warning)' }}>{pendientes}</div></div>
        <div className="stat-card"><div className="stat-card-label">Aprobados</div><div className="stat-card-value" style={{ color: 'var(--success)' }}>{aprobados}</div></div>
        <div className="stat-card"><div className="stat-card-label">Total</div><div className="stat-card-value">{items.length}</div></div>
      </div>

      <div className="toolbar">
        <div style={{ position: 'relative', flex: 1, maxWidth: 350 }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
          <input className="search-input" style={{ paddingLeft: 34 }} placeholder="Buscar por boleta o correo..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }} style={{ maxWidth: 200 }}>
          <option value="no-docs">Sin documentación</option>
          <option value="docs">Con documentación</option>
          <option value="">Todos</option>
        </select>
      </div>

      {paged.length === 0 ? (
        <EmptyState message="No se encontraron usuarios" />
      ) : (
        <div className="resource-grid">
          {paged.map((u) => (
            <div key={u.id} className="resource-card">
              <div className="resource-card-title">
                {u.boleta}
                <span className={`badge ${u.tiene_documentos ? 'badge-success' : 'badge-warning'}`}>{u.tiene_documentos ? 'Habilitado' : 'Pendiente'}</span>
              </div>
              <div className="resource-card-body">
                <div className="resource-card-row"><span className="resource-card-label">Correo</span><span className="resource-card-value" style={{ fontSize: '0.8rem' }}>{u.correo || '-'}</span></div>
              </div>
              {!u.tiene_documentos && (
                <div className="resource-card-actions">
                  <button className="btn btn-success btn-sm" style={{ flex: 1 }} onClick={() => handleHabilitar(u)}>
                    <CheckCircle size={14} /> Habilitar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} total={filtered.length} perPage={PER_PAGE} onChange={setPage} />
    </AnimatedPage>
  );
}
