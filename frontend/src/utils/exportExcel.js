import { utils, writeFile } from 'xlsx';

/**
 * Export an array of objects to an .xlsx file
 * @param {Array<Object>} data - Array of row objects
 * @param {string} filename - File name (without extension)
 * @param {string} sheetName - Sheet name
 */
export function exportToExcel(data, filename = 'reporte', sheetName = 'Datos') {
  if (!data || data.length === 0) return;
  const ws = utils.json_to_sheet(data);
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, sheetName);
  writeFile(wb, `${filename}.xlsx`);
}

/**
 * Export multiple sheets to an .xlsx file
 * @param {Array<{ name: string, data: Array<Object> }>} sheets
 * @param {string} filename
 */
export function exportMultiSheetExcel(sheets, filename = 'reporte') {
  const wb = utils.book_new();
  sheets.forEach(({ name, data }) => {
    if (data && data.length > 0) {
      const ws = utils.json_to_sheet(data);
      utils.book_append_sheet(wb, ws, name.slice(0, 31));
    }
  });
  writeFile(wb, `${filename}.xlsx`);
}
