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
  { key: 'no_restirador', label: 'No. Restirador' }, { key: 'no_inventario', label: 'No. Inventario' },
  { key: 'estado_de_material', label: 'Estado Material' }, { key: 'Disponible', label: 'Disponible' },
];

const EMPTY = { disponible: true, estado_material: true, observacion: '', no_inventario: '', no_restirador: '' };

export default function AltaRestiradores() {
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
      const data = await adminApi.getMaterials('restiradores');
      setItems(data.data || []);
    } catch { toast.error('Error al cargar restiradores'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((r) => !q || String(r.no_restirador || '').includes(q) || (r.observacion || '').toLowerCase().includes(q));
  }, [items, search]);

  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const openNew = () => { setEditing(null); setForm(EMPTY); setModalOpen(true); };
  const openEdit = (r) => {
    setEditing(r);
    setForm({
      disponible: r.Disponible ?? r.disponible ?? true, estado_material: r.estado_de_material ?? true,
      observacion: r.Observacion ?? r.observacion ?? '', no_inventario: r.no_inventario || '', no_restirador: r.no_restirador || '',
    });
    setModalOpen(true);
  };

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        Disponible: form.disponible,
        estado_de_material: form.estado_material,
        Observacion: form.observacion,
      };
      if (editing) {
        await adminApi.updateRestirador({ id: editing.id, ...payload });
        toast.success('Restirador actualizado');
      } else {
        await adminApi.createRestirador(payload);
        toast.success('Restirador creado');
      }
      setModalOpen(false);
      load();
    } catch (err) { toast.error(err.message); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      await adminApi.deleteMaterial('restiradores', deleteModal.id);
      toast.success('Restirador eliminado');
      setDeleteModal(null);
      load();
    } catch (err) { toast.error(err.message); }
    finally { setSubmitting(false); }
  };

  if (loading) return <Spinner />;

  return (
    <AnimatedPage>
      <div className="page-header">
        <h1>Gestión de Restiradores</h1>
        <p>Alta, edición y eliminación de restiradores</p>
      </div>

      <div className="toolbar">
        <div style={{ position: 'relative', flex: 1, maxWidth: 350 }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
          <input className="search-input" style={{ paddingLeft: 34 }} placeholder="Buscar..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <ExportButtons data={filtered} columns={EXPORT_COLS} filenameBase="restiradores" title="Reporte de Restiradores" />
        <button className="btn btn-primary" onClick={openNew}><Plus size={16} /> Nuevo Restirador</button>
      </div>

      {paged.length === 0 ? (
        <EmptyState message="No se encontraron restiradores" />
      ) : (
        <div className="resource-grid">
          {paged.map((r) => (
            <div key={r.id} className="resource-card">
              <div className="resource-card-title">
                Restirador #{r.no_restirador || r.id}
                <span className={`badge ${(r.Disponible ?? r.disponible) ? 'badge-success' : 'badge-danger'}`}>{(r.Disponible ?? r.disponible) ? 'Disponible' : 'Ocupado'}</span>
              </div>
              <div className="resource-card-body">
                <div className="resource-card-row"><span className="resource-card-label">No. Inventario</span><span className="resource-card-value">{r.no_inventario || '-'}</span></div>
                <div className="resource-card-row"><span className="resource-card-label">Estado Material</span><span className="resource-card-value">{(r.estado_de_material ?? r.estado_material) ? 'Buen estado' : 'Mal estado'}</span></div>
                {(r.Observacion || r.observacion) && <div className="resource-card-row"><span className="resource-card-label">Observación</span><span className="resource-card-value">{r.Observacion || r.observacion}</span></div>}
              </div>
              <div className="resource-card-actions">
                <button className="btn btn-outline btn-sm" onClick={() => openEdit(r)}><Pencil size={14} /> Editar</button>
                <button className="btn btn-danger btn-sm" onClick={() => setDeleteModal(r)}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} total={filtered.length} perPage={PER_PAGE} onChange={setPage} />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Restirador' : 'Nuevo Restirador'}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button className="btn btn-primary" disabled={submitting} form="form-rest">{submitting ? 'Guardando...' : 'Guardar'}</button>
          </>
        }
      >
        <form id="form-rest" onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group"><label>No. Restirador</label><input value={form.no_restirador} onChange={set('no_restirador')} required /></div>
            <div className="form-group"><label>No. Inventario</label><input value={form.no_inventario} onChange={set('no_inventario')} /></div>
            <div className="form-group"><label>Observación</label><input value={form.observacion} onChange={set('observacion')} /></div>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem' }}>
            <label className="show-password"><input type="checkbox" checked={form.disponible} onChange={set('disponible')} /> Disponible</label>
            <label className="show-password"><input type="checkbox" checked={form.estado_material} onChange={set('estado_material')} /> Buen estado de material</label>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleteModal} onClose={() => setDeleteModal(null)} title="Eliminar Restirador"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setDeleteModal(null)}>Cancelar</button>
            <button className="btn btn-danger" disabled={submitting} onClick={handleDelete}>{submitting ? 'Eliminando...' : 'Eliminar'}</button>
          </>
        }
      >
        <p>¿Eliminar <strong>Restirador #{deleteModal?.no_restirador || deleteModal?.id}</strong>?</p>
      </Modal>
    </AnimatedPage>
  );
}
