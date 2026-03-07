import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Generate a PDF report with header, stats, and table
 * @param {Object} options
 * @param {string} options.title - Report title
 * @param {string} [options.subtitle] - Optional subtitle
 * @param {Array<{ label: string, value: string|number }>} [options.stats] - Summary stats
 * @param {Array<string>} options.columns - Table column headers
 * @param {Array<Array<string>>} options.rows - Table rows
 * @param {string} [options.filename] - Output filename
 * @param {'portrait'|'landscape'} [options.orientation]
 */
export function generatePDF({
  title,
  subtitle,
  stats,
  columns,
  rows,
  filename = 'reporte',
  orientation = 'portrait',
}) {
  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const now = format(new Date(), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es });

  // Header gradient bar
  doc.setFillColor(99, 102, 241);
  doc.rect(0, 0, pageWidth, 28, 'F');
  
  // Brand
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('C-Book', 14, 12);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Sistema de Gestión Bibliotecaria', 14, 18);
  
  // Date
  doc.setFontSize(8);
  doc.text(now, pageWidth - 14, 12, { align: 'right' });

  // Title
  let y = 38;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, y);
  y += 6;

  if (subtitle) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(subtitle, 14, y);
    y += 6;
  }

  // Stats boxes
  if (stats && stats.length > 0) {
    y += 4;
    const boxWidth = (pageWidth - 28 - (stats.length - 1) * 4) / stats.length;
    stats.forEach((stat, i) => {
      const x = 14 + i * (boxWidth + 4);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(x, y, boxWidth, 18, 2, 2, 'F');
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text(stat.label, x + boxWidth / 2, y + 6, { align: 'center' });
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(String(stat.value), x + boxWidth / 2, y + 14, { align: 'center' });
    });
    y += 26;
  }

  // Table
  if (columns && rows) {
    autoTable(doc, {
      startY: y,
      head: [columns],
      body: rows,
      margin: { left: 14, right: 14 },
      styles: {
        fontSize: 8,
        cellPadding: 3,
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: [99, 102, 241],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 7.5,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      didDrawPage: (data) => {
        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Página ${data.pageNumber} de ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 8,
          { align: 'center' }
        );
      },
    });
  }

  doc.save(`${filename}.pdf`);
}

/**
 * Quick helper - generate a simple table PDF
 */
export function quickTablePDF(title, columns, data, filename) {
  const rows = data.map(item => columns.map(col => String(item[col.key] ?? '-')));
  generatePDF({
    title,
    columns: columns.map(c => c.label),
    rows,
    filename,
    subtitle: `Generado el ${format(new Date(), "d/MM/yyyy HH:mm")}`,
  });
}
