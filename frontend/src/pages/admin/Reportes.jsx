import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileBarChart, FileSpreadsheet,
  Users, BookOpen, AlertCircle,
} from 'lucide-react';
import { adminApi } from '../../api/admin';
import { exportToExcel, exportMultiSheetExcel } from '../../utils/exportExcel';
import { Spinner } from '../../components/ui/Feedback';
import AnimatedPage from '../../components/layout/AnimatedPage';

const reportTypes = [
  { id: 'usuarios', label: 'Usuarios', icon: Users, color: '#c46f21' },
  { id: 'libros', label: 'Libros', icon: BookOpen, color: '#1f8a70' },
  { id: 'completo', label: 'Reporte Completo', icon: FileBarChart, color: '#d97706' },
];

const columnMap = {
  usuarios: [
    { key: 'boleta', label: 'Boleta' },
    { key: 'correo', label: 'Correo' },
    { key: 'rol', label: 'Rol' },
    { key: 'tiene_documentos', label: 'Documentos' },
  ],
  libros: [
    { key: 'titulo', label: 'Título' },
    { key: 'autor', label: 'Autor' },
    { key: 'isbn', label: 'ISBN' },
    { key: 'tipo_material', label: 'Tipo Material' },
    { key: 'anio', label: 'Año' },
    { key: 'disponible', label: 'Disponible' },
  ],
};

const flattenLibros = (items) =>
  (items || []).map((item) => ({
    titulo: item.libros?.titulo ?? item.titulo ?? '-',
    autor: item.libros?.autor ?? item.autor ?? '-',
    isbn: item.libros?.isbn ?? item.isbn ?? '-',
    tipo_material: item.libros?.tipo_material ?? item.tipo_material ?? '-',
    anio: item.anio ?? '-',
    disponible: item.Disponible ?? item.disponible ?? false,
  }));

export default function Reportes() {
  const [selected, setSelected] = useState('usuarios');
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [exportError, setExportError] = useState('');

  const loadData = async (type) => {
    if (data[type]) return;
    setLoading(true);
    try {
      if (type === 'usuarios') {
        const result = await adminApi.getUsers({ limit: 0, rol: 'alumno' });
        setData(prev => ({ ...prev, usuarios: result.data || [] }));
      } else if (type === 'completo') {
        const [u, l] = await Promise.all([
          adminApi.getUsers({ limit: 0, rol: 'alumno' }),
          adminApi.getMaterials('libros', { limit: 0 }),
        ]);
        setData(prev => ({
          ...prev,
          usuarios: u.data || [],
          libros: flattenLibros(l.data),
          completo: true,
        }));
      } else {
        const result = await adminApi.getMaterials(type, { limit: 0 });
        setData(prev => ({ ...prev, [type]: flattenLibros(result.data) }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setExportError(''); loadData(selected); }, [selected]);

  const currentData = selected === 'completo' ? null : (data[selected] || []);
  const currentCols = columnMap[selected] || [];

  const getVal = (row, col) => col.accessor ? col.accessor(row) : row[col.key];

  const handleExcelSingle = () => {
    setExportError('');
    if (!currentData) {
      setExportError('No hay datos para exportar');
      return;
    }
    if (currentData.length === 0) {
      setExportError('No hay registros para exportar');
      return;
    }
    console.log(`[Reportes] Exportando ${selected}: ${currentData.length} registros`);
    const formatted = currentData.map(row => {
      const obj = {};
      currentCols.forEach(c => {
        const v = getVal(row, c);
        obj[c.label] = typeof v === 'boolean' ? (v ? 'Sí' : 'No') : (v ?? '-');
      });
      return obj;
    });
    exportToExcel(formatted, `reporte_${selected}`);
  };

  const handleExcelCompleto = () => {
    setExportError('');
    const sheets = Object.keys(columnMap).filter(key => key !== 'completo').map(key => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      data: (data[key] || []).map(row => {
        const obj = {};
        columnMap[key].forEach(c => {
          const v = c.accessor ? c.accessor(row) : row[c.key];
          obj[c.label] = typeof v === 'boolean' ? (v ? 'Sí' : 'No') : (v ?? '-');
        });
        return obj;
      })
    }));
    exportMultiSheetExcel(sheets, 'reporte_completo');
  };

  return (
    <AnimatedPage>
      <div className="page-header">
        <h1>Reportes</h1>
        <p>Genera y exporta reportes del sistema en Excel</p>
      </div>

      {/* Report Type Selector */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {reportTypes.map((rt) => (
          <motion.div
            key={rt.id}
            className={`service-card ${selected === rt.id ? 'active' : ''}`}
            style={{
              cursor: 'pointer',
              border: selected === rt.id ? `2px solid ${rt.color}` : '2px solid transparent',
              background: selected === rt.id ? rt.color + '12' : 'var(--bg-card)',
            }}
            onClick={() => setSelected(rt.id)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="service-card-icon" style={{ background: rt.color + '18' }}>
              <rt.icon size={22} color={rt.color} />
            </div>
            <span className="service-card-label">{rt.label}</span>
          </motion.div>
        ))}
      </div>

      {/* Export Buttons */}
      <motion.div className="card" style={{ marginBottom: '1.5rem' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div>
            <h3 style={{ margin: 0 }}>
              {reportTypes.find(r => r.id === selected)?.label || 'Reporte'}
            </h3>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {selected === 'completo'
                ? 'Exporta todos los datos del sistema en un archivo'
                : `${(currentData || []).length} registros encontrados`}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              onClick={selected === 'completo' ? handleExcelCompleto : handleExcelSingle}
              disabled={loading}
            >
              <FileSpreadsheet size={16} /> Exportar Excel
            </button>
          </div>
          {exportError && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.82rem', color: '#f87171' }}>
              <AlertCircle size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.3rem' }} />
              {exportError}
            </div>
          )}
        </div>
      </motion.div>

      {/* Preview Table */}
      {loading ? (
        <Spinner />
      ) : selected !== 'completo' && currentData && currentData.length > 0 ? (
        <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h4 style={{ margin: '0 0 1rem' }}>Vista Previa (primeros 20 registros)</h4>
          <div>
            <div className="hidden sm:block" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr>
                    {currentCols.map(c => (
                      <th key={c.key} style={{ textAlign: 'left', padding: '0.6rem 0.75rem', borderBottom: '2px solid var(--border)', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentData.slice(0, 20).map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                      {currentCols.map(c => (
                        <td key={c.key} style={{ padding: '0.5rem 0.75rem', color: 'var(--text-primary)' }}>
                          {(() => { const v = getVal(row, c); return typeof v === 'boolean' ? (v ? 'Sí' : 'No') : (v ?? '-'); })()}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="sm:hidden space-y-3">
              {currentData.slice(0, 20).map((row, idx) => (
                <div key={idx} className="glass-card">
                  {currentCols.map(c => (
                    <div key={c.key} className="flex justify-between py-1.5 text-sm border-b border-[var(--border-color)] last:border-b-0">
                      <span className="text-[var(--text-muted)] font-semibold text-xs uppercase tracking-wider">{c.label}</span>
                      <span className="text-[var(--text-primary)] text-right ml-2">
                        {(() => { const v = getVal(row, c); return typeof v === 'boolean' ? (v ? 'Sí' : 'No') : (v ?? '-'); })()}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          {currentData.length > 20 && (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '1rem' }}>
              Mostrando 20 de {currentData.length} registros. Exporta para ver todos.
            </p>
          )}
        </motion.div>
      ) : selected === 'completo' && data.completo ? (
        <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h4 style={{ margin: '0 0 1rem' }}>Resumen del Reporte Completo</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
{[
               { label: 'Usuarios', count: (data.usuarios || []).length, color: '#c46f21' },
               { label: 'Libros', count: (data.libros || []).length, color: '#1f8a70' },
             ].map(item => (
              <div key={item.label} style={{ textAlign: 'center', padding: '1rem', borderRadius: 'var(--radius)', background: item.color + '10' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: item.color }}>{item.count}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{item.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      ) : null}
    </AnimatedPage>
  );
}
