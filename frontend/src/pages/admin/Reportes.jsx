import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  FileBarChart, FileDown, FileSpreadsheet, Calendar,
  Users, BookOpen, RefreshCw
} from 'lucide-react';
import { adminApi } from '../../api/admin';
import { exportToExcel, exportMultiSheetExcel } from '../../utils/exportExcel';
import { generatePDF } from '../../utils/exportPDF';
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
    { key: 'titulo', label: 'Título', accessor: (r) => r.libros?.titulo },
    { key: 'autor', label: 'Autor', accessor: (r) => r.libros?.autor },
    { key: 'isbn', label: 'ISBN', accessor: (r) => r.libros?.isbn },
    { key: 'tipo_material', label: 'Tipo Material', accessor: (r) => r.libros?.tipo_material },
    { key: 'anio', label: 'Año' },
    { key: 'Disponible', label: 'Disponible' },
  ],
};

export default function Reportes() {
  const [selected, setSelected] = useState('usuarios');
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);

  const loadData = async (type) => {
    if (data[type]) return;
    setLoading(true);
    try {
      let result;
      if (type === 'usuarios') {
        result = await adminApi.getUsers({ limit: 0, rol: 'alumno' });
        setData(prev => ({ ...prev, usuarios: result.data || [] }));
      } else if (type === 'completo') {
        const [u, l] = await Promise.all([
          adminApi.getUsers({ limit: 0, rol: 'alumno' }),
          adminApi.getMaterials('libros', { limit: 0 }),
        ]);
        setData(prev => ({
          ...prev,
          usuarios: u.data || [],
          libros: l.data || [],
          completo: true,
        }));
      } else {
        result = await adminApi.getMaterials(type, { limit: 0 });
        setData(prev => ({ ...prev, [type]: result.data || [] }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(selected); }, [selected]);

  const currentData = selected === 'completo' ? null : (data[selected] || []);
  const currentCols = columnMap[selected] || [];

  const getVal = (row, col) => col.accessor ? col.accessor(row) : row[col.key];

  const handleExcelSingle = () => {
    if (!currentData) return;
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

  const handlePDFSingle = () => {
    if (!currentData) return;
    const rows = currentData.map(row => currentCols.map(c => {
      const v = getVal(row, c);
      return typeof v === 'boolean' ? (v ? 'Sí' : 'No') : String(v ?? '-');
    }));
    const stats = [
      { label: 'Total Registros', value: currentData.length },
      { label: 'Fecha', value: format(new Date(), 'dd/MM/yyyy') },
    ];
    generatePDF({
      title: `Reporte de ${selected.charAt(0).toUpperCase() + selected.slice(1)}`,
      subtitle: `Generado el ${format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: es })}`,
      columns: currentCols.map(c => c.label),
      rows,
      stats,
      filename: `reporte_${selected}`,
      orientation: currentCols.length > 5 ? 'landscape' : 'portrait',
    });
  };

  const handlePDFCompleto = () => {
    // Generate a summary PDF
    const allStats = [
      { label: 'Usuarios', value: (data.usuarios || []).length },
      { label: 'Libros', value: (data.libros || []).length },
    ];
    const rows = [
      ...((data.libros || []).slice(0, 30).map(r => [r.libros?.titulo || '-', r.libros?.autor || '-', r.libros?.isbn || '-', r.Disponible ? 'Sí' : 'No'])),
    ];
    generatePDF({
      title: 'Reporte Completo del Sistema',
      subtitle: `C-Book — ${format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: es })}`,
      columns: ['Título', 'Autor', 'ISBN', 'Disponible'],
      rows,
      stats: allStats,
      filename: 'reporte_completo',
      orientation: 'landscape',
    });
  };

  return (
    <AnimatedPage>
      <div className="page-header">
        <h1>Reportes</h1>
        <p>Genera y exporta reportes del sistema en PDF o Excel</p>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
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
            <button
              className="btn btn-outline"
              style={{ borderColor: '#ef4444', color: '#ef4444' }}
              onClick={selected === 'completo' ? handlePDFCompleto : handlePDFSingle}
              disabled={loading}
            >
              <FileDown size={16} /> Exportar PDF
            </button>
          </div>
        </div>
      </motion.div>

      {/* Preview Table */}
      {loading ? (
        <Spinner />
      ) : selected !== 'completo' && currentData && currentData.length > 0 ? (
        <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h4 style={{ margin: '0 0 1rem' }}>Vista Previa (primeros 20 registros)</h4>
          <div style={{ overflowX: 'auto' }}>
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
