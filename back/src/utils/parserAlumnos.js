// Regex patterns
// GRUPO supports: 6CM1, 7IM3, 7IM3A, 3IB3, etc.
const BOLETA_RE = /\b(\d{10})\b/;
const GRUPO_RE = /\b(\d[A-Z]{2,4}\d?[A-Z]?)\b/;
const NOISE_WORDS = new Set(['NO', 'NUM', 'BOLETA', 'NOMBRE', 'GRUPO', 'TOTAL', 'DE', 'LA', 'EL', 'LOS', 'LAS']);
const REQUIRED_COLUMNS = ['Nombres', 'Boleta', 'Grupos'];

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeHeader(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '');
}

function toSafeText(value) {
  return String(value ?? '').replace(/^"|"$/g, '').trim();
}

function normalizeBoleta(value) {
  return toSafeText(value).replace(/\D/g, '');
}

function resolveRequiredIndexes(headers) {
  const normalized = headers.map(normalizeHeader);
  const nombresIdx = normalized.indexOf('nombres');
  const boletaIdx = normalized.indexOf('boleta');
  const gruposIdx = normalized.indexOf('grupos');

  if (nombresIdx === -1 || boletaIdx === -1 || gruposIdx === -1) {
    throw new Error(`Formato invalido. El archivo debe incluir exactamente estas columnas: ${REQUIRED_COLUMNS.join(', ')}`);
  }

  return { nombresIdx, boletaIdx, gruposIdx };
}

function parseStructuredRows(matrix) {
  if (!Array.isArray(matrix) || matrix.length === 0) return [];

  const headers = (matrix[0] || []).map(toSafeText);
  const { nombresIdx, boletaIdx, gruposIdx } = resolveRequiredIndexes(headers);

  return matrix
    .slice(1)
    .map((row) => {
      const nombre = toSafeText(row[nombresIdx]).toUpperCase();
      const boleta = normalizeBoleta(row[boletaIdx]);
      const grupo = toSafeText(row[gruposIdx]).toUpperCase();

      return {
        boleta,
        nombre,
        Grupo: grupo,
      };
    })
    .filter((r) => r.boleta || r.nombre || r.Grupo);
}

/**
 * Extracts student rows from plain text (PDF or CSV fallback).
 * Tolerant to headers, footers and noise lines from school PDFs.
 */
function extractRows(text) {
  const lines = text.split(/\r?\n/);
  const rows = [];
  let lastGrupo = '';

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const boletaMatch = line.match(BOLETA_RE);
    if (!boletaMatch) {
      // Remember last grupo code seen in a header/label line
      const grupoHeader = line.match(GRUPO_RE);
      if (grupoHeader) lastGrupo = grupoHeader[1];
      continue;
    }

    const boleta = parseInt(boletaMatch[1], 10);

    // Look for grupo code in the same line
    const grupoMatch = line.match(GRUPO_RE);
    const grupo = grupoMatch ? grupoMatch[1] : lastGrupo;

    // Build name: strip boleta, grupo code and numeric noise, keep letter sequences
    const rest = line
      .replace(/\b\d{10}\b/, '')
      .replace(grupoMatch ? new RegExp(`\\b${escapeRegex(grupoMatch[1])}\\b`) : '', '');

    // Extract word segments that look like name parts (2+ letters)
    const nameTokens = (rest.match(/[\p{L}]{2,}/gu) || [])
      .map((t) => t.toUpperCase())
      .filter((t) => !NOISE_WORDS.has(t));

    const nombre = nameTokens.join(' ');

    if (!nombre || !grupo) continue;

    rows.push({ boleta, nombre, Grupo: grupo });
  }

  return rows;
}

/**
 * Parse PDF buffer -> student rows.
 */
async function parsePDF(buffer) {
  const pdfParse = require('pdf-parse');
  const data = await pdfParse(buffer);
  return extractRows(data.text);
}

/**
 * Parse CSV buffer -> student rows.
 * Expected columns: Nombres, Boleta, Grupos.
 */
function parseCSV(buffer) {
  const XLSX = require('xlsx');
  const csvText = buffer.toString('utf-8').replace(/^\uFEFF/, '');
  if (!csvText.trim()) return [];

  const workbook = XLSX.read(csvText, { type: 'string' });
  const ws = workbook.Sheets[workbook.SheetNames[0]];
  const matrix = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' });
  return parseStructuredRows(matrix);
}

/**
 * Parse XLSX buffer -> student rows.
 * Expected columns: Nombres, Boleta, Grupos.
 */
function parseXLSX(buffer) {
  const XLSX = require('xlsx');
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const matrix = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' });
  return parseStructuredRows(matrix);
}

module.exports = { parsePDF, parseCSV, parseXLSX, extractRows };
