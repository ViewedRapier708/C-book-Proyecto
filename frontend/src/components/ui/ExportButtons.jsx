import { FileDown, FileSpreadsheet } from 'lucide-react';
import { exportToExcel } from '../../utils/exportExcel';
import { quickTablePDF } from '../../utils/exportPDF';

/**
 * Reusable export toolbar with PDF + Excel buttons.
 * @param {{ data: Array, columns: Array<{key:string, label:string}>, filenameBase: string, title: string, disabled?: boolean }} props
 */
export default function ExportButtons({ data, columns, filenameBase = 'reporte', title = 'Reporte', disabled = false }) {
  const handleExcel = () => {
    if (disabled) return;
    const formatted = data.map(row => {
      const obj = {};
      columns.forEach(c => { obj[c.label] = row[c.key] ?? '-'; });
      return obj;
    });
    exportToExcel(formatted, filenameBase);
  };

  const handlePDF = () => {
    if (disabled) return;
    quickTablePDF(title, columns, data, filenameBase);
  };

  return (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      <button className="btn btn-outline btn-sm" onClick={handleExcel} title="Exportar a Excel" disabled={disabled}>
        <FileSpreadsheet size={15} /> Excel
      </button>
      <button className="btn btn-outline btn-sm" onClick={handlePDF} title="Exportar a PDF" disabled={disabled}>
        <FileDown size={15} /> PDF
      </button>
    </div>
  );
}
