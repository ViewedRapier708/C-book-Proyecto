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
  { key: 'titulo', label: 'Título' }, { key: 'autor', label: 'Autor' },
  { key: 'isbn', label: 'ISBN' }, { key: 'tipo_material', label: 'Tipo' },
  { key: 'anio', label: 'Año' }, { key: 'disponible', label: 'Disponible' },
];

const EMPTY = { titulo: '', autor: '', clasificacion: '', isbn: '', tipo_material: '', codigo_barras: '', numero_ejemplar: '', anio: '', estatus_item: '', disponible: true, coleccion: '' };
const STATUS_BG = { valid: '#dcfce7', duplicate: '#fef9c3', invalid: '#fee2e2' };
const STATUS_TEXT = { valid: '#166534', duplicate: '#854d0e', invalid: '#991b1b' };
const STATUS_BADGE = { valid: 'badge-success', duplicate: 'badge-warning', invalid: 'badge-danger' };
const STATUS_LABEL = { valid: 'Valida', duplicate: 'Duplicada', invalid: 'Invalida' };
const STAGE_META = {
  idle: { label: 'Esperando archivo', percent: 0, color: '#94a3b8' },
  uploading: { label: 'Subiendo archivo', percent: 30, color: '#3b82f6' },
  analyzing: { label: 'Analizando datos', percent: 65, color: '#6366f1' },
  ready: { label: 'Listo para confirmar', percent: 85, color: '#14b8a6' },
  importing: { label: 'Importando en libros', percent: 92, color: '#f59e0b' },
  completed: { label: 'Carga finalizada', percent: 100, color: '#22c55e' },
};

function ModalCargaMasivaLibros({ open, onClose, onSuccess }) {
  const [estado, setEstado] = useState('idle');
  const [previewData, setPreviewData] = useState(null);
  const [stage, setStage] = useState('idle');
  const [completionMessage, setCompletionMessage] = useState('');
  const fileRef = useRef(null);
  const stageTimeoutRef = useRef(null);

  const clearStageTimer = () => {
    if (stageTimeoutRef.current) {
      clearTimeout(stageTimeoutRef.current);
      stageTimeoutRef.current = null;
    }
  };

  useEffect(() => () => clearStageTimer(), []);

  const reset = () => {
    clearStageTimer();
    setEstado('idle');
    setPreviewData(null);
    setStage('idle');
    setCompletionMessage('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const processFile = async (file) => {
    if (!file) return;
    setEstado('loading');
    setStage('uploading');
    setCompletionMessage('');
    clearStageTimer();
    stageTimeoutRef.current = setTimeout(() => setStage('analyzing'), 500);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const result = await adminApi.previewBulkLibros(fd);
      clearStageTimer();
      setPreviewData(result);
      setEstado('preview');
      setStage('ready');
    } catch (err) {
      clearStageTimer();
      toast.error(err.message || 'Error al procesar el archivo');
      setEstado('idle');
      setStage('idle');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    processFile(e.dataTransfer.files[0]);
  };

  const handleFileInput = (e) => processFile(e.target.files[0]);

  const rowsToConfirm = previewData?.rows.filter((row) => row.status === 'valid') || [];

  const handleConfirm = async () => {
    if (rowsToConfirm.length === 0) {
      toast.error('No hay filas validas para importar');
      return;
    }
    setEstado('submitting');
    setStage('importing');
    setCompletionMessage('');
    try {
      const result = await adminApi.confirmBulkLibros({ rows: rowsToConfirm });
      const summaryText = `${result.inserted || 0} libros agregados${result.skipped ? `, ${result.skipped} omitidos` : ''}`;
      setCompletionMessage(`Carga finalizada: ${summaryText}.`);
      toast.success(summaryText);
      onSuccess();
      setEstado('preview');
      setStage('completed');
    } catch (err) {
      toast.error(err.message || 'Error al importar libros');
      setEstado('preview');
      setStage('ready');
    }
  };

  const stageInfo = STAGE_META[stage] || STAGE_META.idle;
  const showProgress = estado !== 'idle';

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Carga Masiva de Libros"
      wide
      footer={
        estado === 'preview' || estado === 'submitting' ? (
          <>
            <button className="btn btn-ghost" onClick={handleClose} disabled={estado === 'submitting'}>
              {stage === 'completed' ? 'Cerrar' : 'Cancelar'}
            </button>
            {stage !== 'completed' && (
              <button
                className="btn btn-primary"
                onClick={handleConfirm}
                disabled={estado === 'submitting' || rowsToConfirm.length === 0}
              >
                {estado === 'submitting' ? 'Importando...' : `Confirmar carga (${rowsToConfirm.length})`}
              </button>
            )}
          </>
        ) : (
          <button className="btn btn-ghost" onClick={handleClose}>Cerrar</button>
        )
      }
    >
      {showProgress && (
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{stageInfo.label}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{stageInfo.percent}%</span>
          </div>
          <div style={{ height: 8, borderRadius: 999, background: 'var(--bg-glass-strong)', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${stageInfo.percent}%`,
                background: stageInfo.color,
                transition: 'width 250ms ease',
              }}
            />
          </div>
        </div>
      )}

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
          <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Arrastra tu archivo aqui</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>o haz clic para seleccionar</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.75rem' }}>
            Formatos soportados: Excel (.xlsx/.xls), CSV y PDF - max. 10 MB
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.35rem' }}>
            Encabezados obligatorios: Codigo de barras, Titulo, Autor, No. de clasificacion, ISBN, Tipo de material, No. de ejemplar, Anio, Estatus de item, Coleccion
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.35rem' }}>
            Pie de imprenta y Estado de proceso se ignoran porque no existen en el alta manual.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx,.xls,.pdf"
            style={{ display: 'none' }}
            onChange={handleFileInput}
          />
        </div>
      )}

      {estado === 'loading' && (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <Spinner />
          <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Procesando archivo...</p>
        </div>
      )}

      {(estado === 'preview' || estado === 'submitting') && previewData && (
        <div>
          {completionMessage && (
            <div
              style={{
                marginBottom: '1rem',
                padding: '0.75rem 1rem',
                border: '1px solid #86efac',
                background: '#f0fdf4',
                color: '#166534',
                borderRadius: 8,
                fontWeight: 600,
              }}
            >
              {completionMessage}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Archivo: <strong>{previewData.fileName}</strong>
            </span>
            <span className="badge badge-success">{previewData.summary.valid} validas</span>
            <span className="badge badge-warning">{previewData.summary.duplicate} duplicadas</span>
            <span className="badge badge-danger">{previewData.summary.invalid} con error</span>
          </div>

          <div style={{ maxHeight: 320, overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-glass-strong)', position: 'sticky', top: 0 }}>
                  <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left' }}>Codigo</th>
                  <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left' }}>Titulo</th>
                  <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left' }}>Autor</th>
                  <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left' }}>ISBN</th>
                  <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left' }}>Ejemplar</th>
                  <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left' }}>Anio</th>
                  <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left' }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {previewData.rows.map((row, i) => (
                  <tr key={i} style={{ background: STATUS_BG[row.status], borderBottom: '1px solid var(--border-color)', color: STATUS_TEXT[row.status] }}>
                    <td style={{ padding: '0.4rem 0.75rem', fontFamily: 'monospace', color: STATUS_TEXT[row.status] }}>{row.codigo_barras || '-'}</td>
                    <td style={{ padding: '0.4rem 0.75rem', color: STATUS_TEXT[row.status], maxWidth: 240, overflowWrap: 'anywhere' }}>{row.titulo || '-'}</td>
                    <td style={{ padding: '0.4rem 0.75rem', color: STATUS_TEXT[row.status], maxWidth: 180, overflowWrap: 'anywhere' }}>{row.autor || '-'}</td>
                    <td style={{ padding: '0.4rem 0.75rem', color: STATUS_TEXT[row.status] }}>{row.isbn || '-'}</td>
                    <td style={{ padding: '0.4rem 0.75rem', color: STATUS_TEXT[row.status] }}>{row.numero_ejemplar || '-'}</td>
                    <td style={{ padding: '0.4rem 0.75rem', color: STATUS_TEXT[row.status] }}>{row.anio || '-'}</td>
                    <td style={{ padding: '0.4rem 0.75rem' }}>
                      <span className={`badge ${STATUS_BADGE[row.status]}`}>{STATUS_LABEL[row.status]}</span>
                      {row.message && (
                        <span style={{ display: 'block', marginTop: 4, color: STATUS_TEXT[row.status], fontSize: '0.72rem' }}>{row.message}</span>
                      )}
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
  const [bulkOpen, setBulkOpen] = useState(false);
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
        <span className="badge badge-info" style={{ fontSize: '0.95rem', padding: '0.4rem 0.9rem', marginLeft: '1rem' }}>{items.length} libros registrados</span>
      </div>

      <div className="toolbar">
        <div style={{ position: 'relative', flex: 1, maxWidth: 350 }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
          <input className="search-input" style={{ paddingLeft: 34 }} placeholder="Buscar por título, autor, ISBN..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <ExportButtons data={filtered} columns={EXPORT_COLS} filenameBase="libros" title="Reporte de Libros" />
        <button className="btn btn-outline" onClick={() => setBulkOpen(true)}><Upload size={16} /> Carga masiva</button>
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

      <ModalCargaMasivaLibros open={bulkOpen} onClose={() => setBulkOpen(false)} onSuccess={load} />
    </AnimatedPage>
  );
}
