import { FileSpreadsheet } from 'lucide-react';
import { exportToExcel } from '../../utils/exportExcel';
import { useState } from 'react';

export default function ExportButtons({ data, getData, columns, filenameBase = 'reporte', disabled = false }) {
  const [exporting, setExporting] = useState(false);

  const handleExcel = async () => {
    if (disabled || exporting) return;
    setExporting(true);
    try {
      const rows = getData ? await getData() : data;
      const formatted = rows.map(row => {
      const obj = {};
      columns.forEach(c => { obj[c.label] = row[c.key] ?? '-'; });
      return obj;
    });
      exportToExcel(formatted, filenameBase);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      <button className="btn btn-outline btn-sm" onClick={handleExcel} title="Exportar a Excel" disabled={disabled || exporting}>
        <FileSpreadsheet size={15} /> {exporting ? 'Exportando...' : 'Excel'}
      </button>
    </div>
  );
}
