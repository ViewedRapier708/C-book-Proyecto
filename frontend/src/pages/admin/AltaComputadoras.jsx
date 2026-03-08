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
  { key: 'no_computadora', label: 'No. PC' }, { key: 'procesador', label: 'Procesador' },
  { key: 'programas', label: 'Programas' }, { key: 'carrera', label: 'Carrera' },
  { key: 'Disponible', label: 'Disponible' }, { key: 'En_funcionamiento', label: 'Funcionando' },
];

const EMPTY = { procesador: '', programas: '', carrera: '', disponible: true, en_funcionamiento: true, observacion: '', no_inventario: '', no_computadora: '' };

export default function AltaComputadoras() {
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
      const data = await adminApi.getMaterials('computadoras');
      setItems(data.data || []);
    } catch { toast.error('Error al cargar computadoras'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((c) => !q ||
      (c.procesador || '').toLowerCase().includes(q) ||
      (c.carrera || '').toLowerCase().includes(q) ||
      String(c.no_computadora || '').includes(q)
    );
  }, [items, search]);

  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const openNew = () => { setEditing(null); setForm(EMPTY); setModalOpen(true); };
  const openEdit = (c) => {
    setEditing(c);
    setForm({
      procesador: c.procesador || '', programas: c.programas || '', carrera: c.carrera || '',
      disponible: c.Disponible ?? c.disponible ?? true, en_funcionamiento: c.En_funcionamiento ?? c.en_funcionamiento ?? true,
      observacion: c.Observacion ?? c.observacion ?? '', no_inventario: c.no_inventario || '', no_computadora: c.no_computadora || '',
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
        En_funcionamiento: form.en_funcionamiento,
        Observacion: form.observacion,
      };
      if (editing) {
        await adminApi.updateComputer({ id: editing.id, ...payload });
        toast.success('Computadora actualizada');
      } else {
        await adminApi.createComputer(payload);
        toast.success('Computadora creada');
      }
      setModalOpen(false);
      load();
    } catch (err) { toast.error(err.message); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      await adminApi.deleteMaterial('computadoras', deleteModal.id);
      toast.success('Computadora eliminada');
      setDeleteModal(null);
      load();
    } catch (err) { toast.error(err.message); }
    finally { setSubmitting(false); }
  };

  if (loading) return <Spinner />;

  return (
    <AnimatedPage>
      <div className="page-header">
        <h1>Gestión de Computadoras</h1>
        <p>Alta, edición y eliminación de computadoras</p>
      </div>

      <div className="toolbar">
        <div style={{ position: 'relative', flex: 1, maxWidth: 350 }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
          <input className="search-input" style={{ paddingLeft: 34 }} placeholder="Buscar..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <ExportButtons data={filtered} columns={EXPORT_COLS} filenameBase="computadoras" title="Reporte de Computadoras" />
        <button className="btn btn-primary" onClick={openNew}><Plus size={16} /> Nueva Computadora</button>
      </div>

      {paged.length === 0 ? (
        <EmptyState message="No se encontraron computadoras" />
      ) : (
        <div className="resource-grid">
          {paged.map((c) => (
            <div key={c.id} className="resource-card">
              <div className="resource-card-title">
                PC #{c.no_computadora || c.id}
                <span className={`badge ${(c.Disponible ?? c.disponible) ? 'badge-success' : 'badge-danger'}`}>{(c.Disponible ?? c.disponible) ? 'Disponible' : 'Ocupada'}</span>
              </div>
              <div className="resource-card-body">
                <div className="resource-card-row"><span className="resource-card-label">Procesador</span><span className="resource-card-value">{c.procesador || '-'}</span></div>
                <div className="resource-card-row"><span className="resource-card-label">Programas</span><span className="resource-card-value">{c.programas || '-'}</span></div>
                <div className="resource-card-row"><span className="resource-card-label">Carrera</span><span className="resource-card-value">{c.carrera || '-'}</span></div>
                <div className="resource-card-row"><span className="resource-card-label">Funcionamiento</span><span className="resource-card-value">{(c.En_funcionamiento ?? c.en_funcionamiento) ? 'Sí' : 'No'}</span></div>
              </div>
              <div className="resource-card-actions">
                <button className="btn btn-outline btn-sm" onClick={() => openEdit(c)}><Pencil size={14} /> Editar</button>
                <button className="btn btn-danger btn-sm" onClick={() => setDeleteModal(c)}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} total={filtered.length} perPage={PER_PAGE} onChange={setPage} />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Computadora' : 'Nueva Computadora'} wide
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button className="btn btn-primary" disabled={submitting} form="form-pc">{submitting ? 'Guardando...' : 'Guardar'}</button>
          </>
        }
      >
        <form id="form-pc" onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group"><label>No. Computadora</label><input value={form.no_computadora} onChange={set('no_computadora')} required /></div>
            <div className="form-group"><label>No. Inventario</label><input value={form.no_inventario} onChange={set('no_inventario')} /></div>
            <div className="form-group"><label>Procesador</label><input value={form.procesador} onChange={set('procesador')} /></div>
            <div className="form-group"><label>Carrera</label><input value={form.carrera} onChange={set('carrera')} /></div>
            <div className="form-group"><label>Observación</label><input value={form.observacion} onChange={set('observacion')} /></div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Programas</label><textarea rows={2} value={form.programas} onChange={set('programas')} /></div>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem' }}>
            <label className="show-password"><input type="checkbox" checked={form.disponible} onChange={set('disponible')} /> Disponible</label>
            <label className="show-password"><input type="checkbox" checked={form.en_funcionamiento} onChange={set('en_funcionamiento')} /> En funcionamiento</label>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleteModal} onClose={() => setDeleteModal(null)} title="Eliminar Computadora"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setDeleteModal(null)}>Cancelar</button>
            <button className="btn btn-danger" disabled={submitting} onClick={handleDelete}>{submitting ? 'Eliminando...' : 'Eliminar'}</button>
          </>
        }
      >
        <p>¿Eliminar <strong>Computadora #{deleteModal?.no_computadora || deleteModal?.id}</strong>?</p>
      </Modal>
    </AnimatedPage>
  );
}
