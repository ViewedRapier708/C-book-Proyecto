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

function normalizeHeader(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '');
}

function toSafeText(value) {
  return String(value ?? '').replace(/^"|"$/g, '').trim();
}

function cleanTitle(value) {
  return toSafeText(value)
    .replace(/^"+|"+$/g, '')
    .replace(/\s+\/$/, '')
    .trim();
}

function normalizeEjemplar(value) {
  const text = toSafeText(value);
  const match = text.match(/\d+/);
  return match ? match[0] : text;
}

function normalizeYear(value) {
  const text = toSafeText(value);
  const match = text.match(/\b\d{4}\b/);
  return match ? match[0] : text.replace(/\D/g, '');
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

function rowToBook(row, indexes) {
  return {
    codigo_barras: toSafeText(row[indexes.codigoBarrasIdx]),
    titulo: cleanTitle(row[indexes.tituloIdx]),
    autor: toSafeText(row[indexes.autorIdx]),
    clasificacion: toSafeText(row[indexes.clasificacionIdx]),
    isbn: toSafeText(row[indexes.isbnIdx]),
    tipo_material: toSafeText(row[indexes.tipoMaterialIdx]),
    numero_ejemplar: normalizeEjemplar(row[indexes.numeroEjemplarIdx]),
    anio: normalizeYear(row[indexes.anioIdx]),
    estatus_item: toSafeText(row[indexes.estatusItemIdx]),
    coleccion: toSafeText(row[indexes.coleccionIdx]),
    Disponible: true,
  };
}

function parseStructuredRows(matrix) {
  if (!Array.isArray(matrix) || matrix.length === 0) return [];

  const headers = (matrix[0] || []).map(toSafeText);
  const indexes = resolveIndexes(headers);

  return matrix
    .slice(1)
    .map((row) => rowToBook(row, indexes))
    .filter((r) => Object.values(r).some((value) => value !== '' && value !== true));
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
