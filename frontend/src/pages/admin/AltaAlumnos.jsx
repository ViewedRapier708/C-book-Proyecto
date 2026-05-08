import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { adminApi } from '../../api/admin';
import { Spinner, EmptyState } from '../../components/ui/Feedback';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';
import { Plus, Search, Pencil, Trash2, Upload } from 'lucide-react';
import ExportButtons from '../../components/ui/ExportButtons';
import AnimatedPage from '../../components/layout/AnimatedPage';

const EXPORT_COLS = [
  { key: 'boleta', label: 'Boleta' },
  { key: 'nombre', label: 'Nombre' },
  { key: 'Grupo', label: 'Grupo' },
  { key: 'registrado', label: 'Registrado' },
];

const EMPTY_FORM = { boleta: '', nombre: '', Grupo: '' };
const PER_PAGE = 12;

const STATUS_BG = { valid: '#dcfce7', duplicate: '#fef9c3', invalid: '#fee2e2' };
const STATUS_BADGE = { valid: 'badge-success', duplicate: 'badge-warning', invalid: 'badge-danger' };
const STATUS_LABEL = { valid: 'Válida', duplicate: 'Duplicada', invalid: 'Inválida' };

// ── Carga Masiva Modal ──────────────────────────────────────────────────────
function ModalCargaMasiva({ open, onClose, onSuccess }) {
  const [estado, setEstado] = useState('idle'); // idle | loading | preview | submitting
  const [previewData, setPreviewData] = useState(null);
  const [overwrite, setOverwrite] = useState(false);
  const fileRef = useRef(null);

  const reset = () => { setEstado('idle'); setPreviewData(null); setOverwrite(false); };
  const handleClose = () => { reset(); onClose(); };

  const processFile = async (file) => {
    if (!file) return;
    setEstado('loading');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const result = await adminApi.previewBulkBoletas(fd);
      setPreviewData(result);
      setEstado('preview');
    } catch (err) {
      toast.error(err.message || 'Error al procesar el archivo');
      setEstado('idle');
    }
  };

  const handleDrop = (e) => { e.preventDefault(); processFile(e.dataTransfer.files[0]); };
  const handleFileInput = (e) => processFile(e.target.files[0]);

  const rowsToConfirm = previewData?.rows.filter(
    r => r.status === 'valid' || (r.status === 'duplicate' && overwrite)
  ) || [];

  const handleConfirm = async () => {
    if (rowsToConfirm.length === 0) { toast.error('No hay filas válidas para importar'); return; }
    setEstado('submitting');
    try {
      const result = await adminApi.confirmBulkBoletas({ rows: rowsToConfirm, overwriteDuplicates: overwrite });
      const parts = [];
      if (result.inserted) parts.push(`${result.inserted} agregados`);
      if (result.updated) parts.push(`${result.updated} actualizados`);
      if (result.skipped) parts.push(`${result.skipped} omitidos`);
      toast.success(parts.join(', ') || 'Importación completada');
      onSuccess();
      handleClose();
    } catch (err) {
      toast.error(err.message || 'Error al importar alumnos');
      setEstado('preview');
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Carga Masiva de Alumnos"
      wide
      footer={
        estado === 'preview' || estado === 'submitting' ? (
          <>
            <button className="btn btn-ghost" onClick={handleClose} disabled={estado === 'submitting'}>Cancelar</button>
            <button
              className="btn btn-primary"
              onClick={handleConfirm}
              disabled={estado === 'submitting' || rowsToConfirm.length === 0}
            >
              {estado === 'submitting' ? 'Importando...' : `Confirmar carga (${rowsToConfirm.length})`}
            </button>
          </>
        ) : (
          <button className="btn btn-ghost" onClick={handleClose}>Cerrar</button>
        )
      }
    >
      {/* Drop zone */}
      {estado === 'idle' && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
          style={{
            border: '2px dashed var(--border-color)',
            borderRadius: 12,
            padding: '3rem 2rem',
            textAlign: 'center',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent-primary)')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
        >
          <Upload size={40} style={{ margin: '0 auto 1rem', color: 'var(--text-muted)' }} />
          <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Arrastra tu archivo aquí</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>o haz clic para seleccionar</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.75rem' }}>
            Formatos soportados: PDF, CSV, XLSX — máx. 10 MB
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.csv,.xlsx,.xls"
            style={{ display: 'none' }}
            onChange={handleFileInput}
          />
        </div>
      )}

      {/* Parsing spinner */}
      {estado === 'loading' && (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <Spinner />
          <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Analizando archivo...</p>
        </div>
      )}

      {/* Preview table */}
      {(estado === 'preview' || estado === 'submitting') && previewData && (
        <div>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Archivo: <strong>{previewData.fileName}</strong>
            </span>
            <span className="badge badge-success">{previewData.summary.valid} válidas</span>
            <span className="badge badge-warning">{previewData.summary.duplicate} duplicadas</span>
            <span className="badge badge-danger">{previewData.summary.invalid} con error</span>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', cursor: 'pointer', userSelect: 'none' }}>
            <input type="checkbox" checked={overwrite} onChange={(e) => setOverwrite(e.target.checked)} />
            <span style={{ fontSize: '0.875rem' }}>Sobrescribir duplicados con datos del archivo</span>
          </label>

          <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-glass-strong)', position: 'sticky', top: 0 }}>
                  <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left' }}>Boleta</th>
                  <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left' }}>Nombre</th>
                  <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left' }}>Grupo</th>
                  <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left' }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {previewData.rows.map((row, i) => (
                  <tr key={i} style={{ background: STATUS_BG[row.status], borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.4rem 0.75rem', fontFamily: 'monospace' }}>{row.boleta}</td>
                    <td style={{ padding: '0.4rem 0.75rem' }}>{row.nombre}</td>
                    <td style={{ padding: '0.4rem 0.75rem' }}>{row.Grupo}</td>
                    <td style={{ padding: '0.4rem 0.75rem' }}>
                      <span className={`badge ${STATUS_BADGE[row.status]}`}>{STATUS_LABEL[row.status]}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────
export default function AltaAlumnos() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [grupoFilter, setGrupoFilter] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [bulkOpen, setBulkOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getBoletas();
      setItems(data.data || []);
    } catch { toast.error('Error al cargar alumnos'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const grupos = useMemo(() =>
    [...new Set(items.map(i => i.Grupo).filter(Boolean))].sort()
  , [items]);

  const stats = useMemo(() => ({
    total: items.length,
    grupos: new Set(items.map(i => i.Grupo).filter(Boolean)).size,
    registrados: items.filter(i => i.registrado).length,
  }), [items]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter(item =>
      (!q ||
        String(item.boleta).includes(q) ||
        (item.nombre || '').toLowerCase().includes(q) ||
        (item.Grupo || '').toLowerCase().includes(q)
      ) &&
      (!grupoFilter || item.Grupo === grupoFilter)
    );
  }, [items, search, grupoFilter]);

  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const openNew = () => { setEditing(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (item) => {
    setEditing(item);
    setForm({ boleta: String(item.boleta), nombre: item.nombre || '', Grupo: item.Grupo || '' });
    setModalOpen(true);
  };
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editing) {
        await adminApi.updateBoleta(editing.boleta, { nombre: form.nombre, Grupo: form.Grupo });
        toast.success('Alumno actualizado');
      } else {
        await adminApi.createBoleta({ boleta: form.boleta, nombre: form.nombre, Grupo: form.Grupo });
        toast.success('Alumno agregado al catálogo');
      }
      setModalOpen(false);
      load();
    } catch (err) { toast.error(err.message); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      await adminApi.deleteBoleta(deleteModal.boleta);
      toast.success('Alumno eliminado del catálogo');
      setDeleteModal(null);
      load();
    } catch (err) { toast.error(err.message); }
    finally { setSubmitting(false); }
  };

  if (loading) return <Spinner />;

  return (
    <AnimatedPage>
      <div className="page-header">
        <h1>Gestión de Alumnos</h1>
        <p>Alta, edición y carga masiva de boletas autorizadas</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total alumnos</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.grupos}</div>
          <div className="stat-label">Grupos activos</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.registrados}</div>
          <div className="stat-label">Registrados</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div style={{ position: 'relative', flex: 1, maxWidth: 350 }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
          <input
            className="search-input"
            style={{ paddingLeft: 34 }}
            placeholder="Buscar boleta, nombre o grupo..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="search-input"
          style={{ maxWidth: 170 }}
          value={grupoFilter}
          onChange={(e) => { setGrupoFilter(e.target.value); setPage(1); }}
        >
          <option value="">Todos los grupos</option>
          {grupos.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <ExportButtons data={filtered} columns={EXPORT_COLS} filenameBase="alumnos" title="Reporte de Alumnos" />
        <button className="btn btn-outline" onClick={() => setBulkOpen(true)}>
          <Upload size={16} /> Carga masiva
        </button>
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={16} /> Nuevo alumno
        </button>
      </div>

      {/* Grid */}
      {paged.length === 0 ? (
        <EmptyState message="No se encontraron alumnos" />
      ) : (
        <div className="resource-grid">
          {paged.map((item) => (
            <div key={item.boleta} className="resource-card">
              <div className="resource-card-title">
                <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{item.boleta}</span>
                <span className={`badge ${item.registrado ? 'badge-success' : 'badge-warning'}`}>
                  {item.registrado ? 'Registrado' : 'Pendiente'}
                </span>
              </div>
              <div className="resource-card-body">
                <div className="resource-card-row">
                  <span className="resource-card-label">Nombre</span>
                  <span className="resource-card-value" style={{ fontSize: '0.8rem' }}>{item.nombre || '-'}</span>
                </div>
                <div className="resource-card-row">
                  <span className="resource-card-label">Grupo</span>
                  <span className="resource-card-value">{item.Grupo || '-'}</span>
                </div>
              </div>
              <div className="resource-card-actions">
                <button className="btn btn-outline btn-sm" onClick={() => openEdit(item)}>
                  <Pencil size={14} /> Editar
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => setDeleteModal(item)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} total={filtered.length} perPage={PER_PAGE} onChange={setPage} />

      {/* Form Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Alumno' : 'Nuevo Alumno'}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button className="btn btn-primary" disabled={submitting} form="form-alumno">
              {submitting ? 'Guardando...' : 'Guardar'}
            </button>
          </>
        }
      >
        <form id="form-alumno" onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="form-group">
              <label>Boleta * (10 dígitos)</label>
              <input
                value={form.boleta}
                onChange={set('boleta')}
                maxLength={10}
                disabled={!!editing}
                placeholder="Ej: 2021601234"
                required
              />
            </div>
            <div className="form-group">
              <label>Nombre completo *</label>
              <input
                value={form.nombre}
                onChange={set('nombre')}
                placeholder="Ej: GARCIA LOPEZ JUAN ANTONIO"
                required
              />
            </div>
            <div className="form-group">
              <label>Grupo *</label>
              <input
                value={form.Grupo}
                onChange={set('Grupo')}
                placeholder="Ej: 6CM1"
                required
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        open={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Eliminar Alumno"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setDeleteModal(null)}>Cancelar</button>
            <button className="btn btn-danger" disabled={submitting} onClick={handleDelete}>
              {submitting ? 'Eliminando...' : 'Eliminar'}
            </button>
          </>
        }
      >
        <p>
          ¿Estás seguro de eliminar la boleta <strong>{deleteModal?.boleta}</strong>{' '}
          {deleteModal?.nombre ? `(${deleteModal.nombre})` : ''}?
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
          Esta acción no se puede deshacer. No se puede eliminar si el alumno ya tiene una cuenta registrada.
        </p>
      </Modal>

      {/* Carga Masiva Modal */}
      <ModalCargaMasiva open={bulkOpen} onClose={() => setBulkOpen(false)} onSuccess={load} />
    </AnimatedPage>
  );
}
