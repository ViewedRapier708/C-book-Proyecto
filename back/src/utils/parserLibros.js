const REQUIRED_COLUMNS = [
  'Codigo de barras',
  'Titulo',
  'Autor',
  'No. de clasificacion',
  'ISBN',
  'Tipo de material',
  'No. de ejemplar',
  'Anio',
  'Estatus de item',
  'Coleccion',
];

const EXPECTED_NORMALIZED = [
  'codigodebarras', 'titulo', 'autor', 'nodeclasificacion',
  'isbn', 'tipodematerial', 'nodeejemplar', 'anio',
  'estatusdeitem', 'coleccion'
];

const RE_SUMMARY = /^\d+\s+(volúmenes|titulos|títulos)/i;
const RE_DATE_BARCODE = /^\d{1,2}\/\d{1,2}\/\d{2,4}$/;
const RE_TITLE_CLEAN = /^"+|"+$/g;
const RE_TITLE_TRAILING = /\s+\/$/;

function normalizeHeader(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '');
}

function toSafeText(value) {
  if (value == null) return '';
  let s = String(value);
  if (s.length > 1 && (s.charCodeAt(0) === 34 || s.charCodeAt(s.length - 1) === 34)) {
    s = s.replace(RE_TITLE_CLEAN, '');
  }
  return s.trim();
}

function resolveIndexes(headers) {
  const normalized = headers.map(normalizeHeader);
  const find = (...keys) => normalized.findIndex((header) => keys.includes(header));

  const indexes = {
    codigoBarrasIdx: find('codigodebarras', 'codigobarras', 'codigo'),
    tituloIdx: find('titulo', 'titulodellibro'),
    autorIdx: find('autor', 'autores'),
    clasificacionIdx: find('nodeclasificacion', 'numerodeclasificacion', 'clasificacion', 'noclasificacion'),
    isbnIdx: find('isbn'),
    tipoMaterialIdx: find('tipodematerial', 'tipomaterial', 'tipo'),
    numeroEjemplarIdx: find('nodeejemplar', 'numerodeejemplar', 'noejemplar', 'ejemplar'),
    anioIdx: find('ano', 'anio', 'year'),
    estatusItemIdx: find('estatusdeitem', 'estatusitem', 'estadoitem'),
    coleccionIdx: find('coleccion', 'collection'),
  };

  const missing = [];
  if (indexes.codigoBarrasIdx === -1) missing.push('Codigo de barras');
  if (indexes.tituloIdx === -1) missing.push('Titulo');
  if (indexes.autorIdx === -1) missing.push('Autor');
  if (indexes.clasificacionIdx === -1) missing.push('No. de clasificacion');
  if (indexes.isbnIdx === -1) missing.push('ISBN');
  if (indexes.tipoMaterialIdx === -1) missing.push('Tipo de material');
  if (indexes.numeroEjemplarIdx === -1) missing.push('No. de ejemplar');
  if (indexes.anioIdx === -1) missing.push('Anio');
  if (indexes.estatusItemIdx === -1) missing.push('Estatus de item');
  if (indexes.coleccionIdx === -1) missing.push('Coleccion');

  if (missing.length > 0) {
    throw new Error(`Formato invalido. El archivo debe incluir estas columnas: ${REQUIRED_COLUMNS.join(', ')}. Faltan: ${missing.join(', ')}`);
  }

  return indexes;
}

function findHeaderRow(matrix) {
  const scanLimit = Math.min(matrix.length, 50);
  for (let i = 0; i < scanLimit; i++) {
    const row = matrix[i];
    if (!row) continue;
    let matches = 0;
    for (let j = 0; j < row.length && matches < 5; j++) {
      const h = normalizeHeader(row[j]);
      for (let k = 0; k < EXPECTED_NORMALIZED.length; k++) {
        if (h === EXPECTED_NORMALIZED[k]) { matches++; break; }
      }
    }
    if (matches >= 5) return i;
  }
  return -1;
}

function parseStructuredRows(matrix) {
  if (!Array.isArray(matrix) || matrix.length === 0) return [];

  const headerRowIndex = findHeaderRow(matrix);
  if (headerRowIndex === -1) {
    throw new Error(`Formato invalido. No se encontró una fila de encabezados válida. El archivo debe incluir columnas como: ${REQUIRED_COLUMNS.join(', ')}`);
  }

  const headers = matrix[headerRowIndex] || [];
  const indexes = resolveIndexes(headers);

  const { codigoBarrasIdx, tituloIdx, autorIdx, clasificacionIdx, isbnIdx,
    tipoMaterialIdx, numeroEjemplarIdx, anioIdx, estatusItemIdx, coleccionIdx } = indexes;

  const result = [];
  for (let i = headerRowIndex + 1; i < matrix.length; i++) {
    const row = matrix[i];
    if (!row) continue;

    const codigoB = toSafeText(row[codigoBarrasIdx]);
    if (!codigoB) continue;
    if (RE_SUMMARY.test(codigoB)) continue;
    if (RE_DATE_BARCODE.test(codigoB)) continue;

    const ttl = toSafeText(row[tituloIdx]);
    const aut = toSafeText(row[autorIdx]);
    const cls = toSafeText(row[clasificacionIdx]);
    const isb = toSafeText(row[isbnIdx]);
    if (!ttl && !aut && !cls && !isb) continue;

    let titulo = ttl;
    if (titulo.length > 0 && (titulo.charCodeAt(0) === 34 || titulo.charCodeAt(titulo.length - 1) === 34)) {
      titulo = titulo.replace(RE_TITLE_CLEAN, '');
    }
    if (titulo.length > 0) {
      titulo = titulo.replace(RE_TITLE_TRAILING, '').trim();
    }

    const neStr = toSafeText(row[numeroEjemplarIdx]);
    const matchNe = neStr.match(/\d+/);
    const numeroE = matchNe ? matchNe[0] : neStr;

    const anioStr = toSafeText(row[anioIdx]);
    const matchAnio = anioStr.match(/\b\d{4}\b/);
    const anio = matchAnio ? matchAnio[0] : anioStr.replace(/\D/g, '');

    result.push({
      codigo_barras: codigoB,
      titulo,
      autor: aut,
      clasificacion: cls,
      isbn: isb,
      tipo_material: toSafeText(row[tipoMaterialIdx]),
      numero_ejemplar: numeroE,
      anio,
      estatus_item: toSafeText(row[estatusItemIdx]),
      coleccion: toSafeText(row[coleccionIdx]),
      Disponible: true,
    });
  }

  return result;
}

function parseCSV(buffer) {
  const XLSX = require('xlsx');
  const csvText = buffer.toString('utf-8').replace(/^\uFEFF/, '');
  if (!csvText.trim()) return [];

  const workbook = XLSX.read(csvText, { type: 'string' });
  const ws = workbook.Sheets[workbook.SheetNames[0]];
  const matrix = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' });
  return parseStructuredRows(matrix);
}

function parseXLSX(buffer) {
  const XLSX = require('xlsx');
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const matrix = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' });
  return parseStructuredRows(matrix);
}

async function parsePDF(buffer) {
  const pdfParse = require('pdf-parse');
  const data = await pdfParse(buffer);
  const lines = data.text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const matrix = lines
    .map((line) => line.split(/\t+|\s{2,}/).map(toSafeText))
    .filter((row) => row.length > 1);

  if (matrix.length === 0) {
    throw new Error('No se detectaron columnas en el PDF. Exporta el archivo como tabla o usa Excel/CSV.');
  }

  return parseStructuredRows(matrix);
}

module.exports = { parseCSV, parseXLSX, parsePDF, parseStructuredRows };
