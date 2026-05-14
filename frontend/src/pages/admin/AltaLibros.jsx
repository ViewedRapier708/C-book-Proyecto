import { useState, useEffect, useMemo, useCallback } from 'react';
import { adminApi } from '../../api/admin';
import { Spinner, EmptyState } from '../../components/ui/Feedback';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import ExportButtons from '../../components/ui/ExportButtons';
import AnimatedPage from '../../components/layout/AnimatedPage';

const EXPORT_COLS = [
  { key: 'titulo', label: 'Título' }, { key: 'autor', label: 'Autor' },
  { key: 'isbn', label: 'ISBN' }, { key: 'tipo_material', label: 'Tipo' },
  { key: 'anio', label: 'Año' }, { key: 'disponible', label: 'Disponible' },
];

const EMPTY = { titulo: '', autor: '', clasificacion: '', isbn: '', tipo_material: '', codigo_barras: '', numero_ejemplar: '', anio: '', estatus_item: '', disponible: true, coleccion: '' };

export default function AltaLibros() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const PER_PAGE = 12;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getMaterials('libros');
      setItems(data.data || []);
    } catch { toast.error('Error al cargar libros'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((b) => !q ||
      (b.libros?.titulo || b.titulo || '').toLowerCase().includes(q) ||
      (b.libros?.autor || b.autor || '').toLowerCase().includes(q) ||
      (b.libros?.isbn || b.isbn || '').toLowerCase().includes(q)
    );
  }, [items, search]);

  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const openNew = () => { setEditing(null); setForm(EMPTY); setModalOpen(true); };
  const openEdit = (b) => {
    setEditing(b);
    const disponibleValue = b.Disponible ?? b.disponible ?? true;
    setForm({
      titulo: b.libros?.titulo || b.titulo || '', autor: b.libros?.autor || b.autor || '', clasificacion: b.libros?.clasificacion || b.clasificacion || '',
      isbn: b.libros?.isbn || b.isbn || '', tipo_material: b.libros?.tipo_material || b.tipo_material || '', codigo_barras: b.codigo_barras || '',
      numero_ejemplar: b.numero_ejemplar || '', anio: b.anio || '', estatus_item: b.estatus_item || '',
      disponible: Boolean(disponibleValue), coleccion: b.coleccion || '',
    });
    setModalOpen(true);
  };

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...form, Disponible: form.disponible };
      
      // Convertir explícitamente a número para evitar problemas con la API
      payload.numero_ejemplar = Number(payload.numero_ejemplar);
      payload.anio = Number(payload.anio);

      if (editing) {
        await adminApi.updateBook({ 
          id: editing.libro_id || editing.libros?.id, 
          ejemplar_id: editing.id, 
          ...payload 
        });
        toast.success('Libro actualizado');
      } else {
        await adminApi.createBook(payload);
        toast.success('Libro creado');
      }
      setModalOpen(false);
      load();
    } catch (err) { toast.error(err.message); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      await adminApi.deleteMaterial('libros', deleteModal.id);
      toast.success('Libro eliminado');
      setDeleteModal(null);
      load();
    } catch (err) { toast.error(err.message); }
    finally { setSubmitting(false); }
  };

  if (loading) return <Spinner />;

  return (
    <AnimatedPage>
      <div className="page-header">
        <h1>Gestión de Libros</h1>
        <p>Alta, edición y eliminación de libros del acervo</p>
      </div>

      <div className="toolbar">
        <div style={{ position: 'relative', flex: 1, maxWidth: 350 }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
          <input className="search-input" style={{ paddingLeft: 34 }} placeholder="Buscar por título, autor, ISBN..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <ExportButtons data={filtered} columns={EXPORT_COLS} filenameBase="libros" title="Reporte de Libros" />
        <button className="btn btn-primary" onClick={openNew}><Plus size={16} /> Nuevo Libro</button>
      </div>

      {paged.length === 0 ? (
        <EmptyState message="No se encontraron libros" />
      ) : (
        <div className="resource-grid">
          {paged.map((b) => (
            <div key={b.id} className="resource-card">
              <div className="resource-card-title">
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%' }}>{b.libros?.titulo || b.titulo || 'Sin título'}</span>
                <span className={`badge ${(b.Disponible ?? b.disponible) ? 'badge-success' : 'badge-danger'}`}>{(b.Disponible ?? b.disponible) ? 'Disponible' : 'No disp.'}</span>
              </div>
              <div className="resource-card-body">
                <div className="resource-card-row"><span className="resource-card-label">Autor</span><span className="resource-card-value">{b.libros?.autor || b.autor || '-'}</span></div>
                <div className="resource-card-row"><span className="resource-card-label">ISBN</span><span className="resource-card-value">{b.libros?.isbn || b.isbn || '-'}</span></div>
                <div className="resource-card-row"><span className="resource-card-label">Tipo</span><span className="resource-card-value">{b.libros?.tipo_material || b.tipo_material || '-'}</span></div>
                <div className="resource-card-row"><span className="resource-card-label">Año</span><span className="resource-card-value">{b.anio || '-'}</span></div>
              </div>
              <div className="resource-card-actions">
                <button className="btn btn-outline btn-sm" onClick={() => openEdit(b)}><Pencil size={14} /> Editar</button>
                <button className="btn btn-danger btn-sm" onClick={() => setDeleteModal(b)}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} total={filtered.length} perPage={PER_PAGE} onChange={setPage} />

      {/* Form Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Libro' : 'Nuevo Libro'} wide
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button className="btn btn-primary" disabled={submitting} form="form-libro">
              {submitting ? 'Guardando...' : 'Guardar'}
            </button>
          </>
        }
      >
        <form id="form-libro" onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group"><label>Título *</label><input value={form.titulo} onChange={set('titulo')} required /></div>
            <div className="form-group"><label>Autor *</label><input value={form.autor} onChange={set('autor')} required /></div>
            <div className="form-group"><label>Clasificación *</label><input value={form.clasificacion} onChange={set('clasificacion')} required /></div>
            <div className="form-group"><label>ISBN *</label><input value={form.isbn} onChange={set('isbn')} required /></div>
            <div className="form-group"><label>Tipo Material *</label><input value={form.tipo_material} onChange={set('tipo_material')} required /></div>
            <div className="form-group"><label>Código Barras *</label><input value={form.codigo_barras} onChange={set('codigo_barras')} required /></div>
            <div className="form-group"><label>No. Ejemplar *</label><input type="number" min="0" value={form.numero_ejemplar} onChange={set('numero_ejemplar')} required /></div>
            <div className="form-group"><label>Año *</label><input type="number" min="1000" max="2100" value={form.anio} onChange={set('anio')} required /></div>
            <div className="form-group"><label>Estatus Item *</label><input value={form.estatus_item} onChange={set('estatus_item')} required /></div>
            <div className="form-group"><label>Colección *</label><input value={form.coleccion} onChange={set('coleccion')} required /></div>
          </div>
          <div className="form-group" style={{ marginTop: '0.75rem' }}>
            <label
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', userSelect: 'none' }}
              onClick={() => setForm({ ...form, disponible: !form.disponible })}
            >
              <div
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '4px',
                  border: form.disponible ? '2px solid #22c55e' : '2px solid #ccc',
                  backgroundColor: form.disponible ? '#22c55e' : '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  flexShrink: 0
                }}
              >
                {form.disponible && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                )}
              </div>
              <span style={{ fontSize: '0.95rem' }}>Disponible</span>
            </label>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteModal} onClose={() => setDeleteModal(null)} title="Eliminar Libro"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setDeleteModal(null)}>Cancelar</button>
            <button className="btn btn-danger" disabled={submitting} onClick={handleDelete}>{submitting ? 'Eliminando...' : 'Eliminar'}</button>
          </>
        }
      >
        <p>¿Estás seguro de eliminar <strong>{deleteModal?.titulo}</strong>? Esta acción no se puede deshacer.</p>
      </Modal>
    </AnimatedPage>
  );
}
