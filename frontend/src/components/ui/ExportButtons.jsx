import { FileSpreadsheet } from 'lucide-react';
import { exportToExcel } from '../../utils/exportExcel';

export default function ExportButtons({ data, columns, filenameBase = 'reporte', disabled = false }) {
  const handleExcel = () => {
    if (disabled) return;
    const formatted = data.map(row => {
      const obj = {};
      columns.forEach(c => { obj[c.label] = row[c.key] ?? '-'; });
      return obj;
    });
    exportToExcel(formatted, filenameBase);
  };

  return (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      <button className="btn btn-outline btn-sm" onClick={handleExcel} title="Exportar a Excel" disabled={disabled}>
        <FileSpreadsheet size={15} /> Excel
      </button>
    </div>
  );
}
