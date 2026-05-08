const pdfParse = require('pdf-parse');
const XLSX = require('xlsx');

// Regex patterns
// GRUPO supports: 6CM1, 7IM3, 7IM3A, 3IB3, etc.
const BOLETA_RE = /\b(\d{10})\b/;
const GRUPO_RE = /\b(\d[A-Z]{2,4}\d?[A-Z]?)\b/;
const NOISE_WORDS = new Set(['NO', 'NUM', 'BOLETA', 'NOMBRE', 'GRUPO', 'TOTAL', 'DE', 'LA', 'EL', 'LOS', 'LAS']);

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
    let rest = line
      .replace(/\b\d{10}\b/, '')
      .replace(grupoMatch ? new RegExp(`\\b${escapeRegex(grupoMatch[1])}\\b`) : '', '');

    // Extract word segments that look like name parts (2+ letters, allow accents)
    const nameTokens = (rest.match(/[A-ZÁÉÍÓÚÜÑA-Z]{2,}/gi) || [])
      .map(t => t.toUpperCase())
      .filter(t => !NOISE_WORDS.has(t));

    const nombre = nameTokens.join(' ');

    if (!nombre || !grupo) continue;

    rows.push({ boleta, nombre, Grupo: grupo });
  }

  return rows;
}

/**
 * Parse PDF buffer → student rows.
 */
async function parsePDF(buffer) {
  const data = await pdfParse(buffer);
  return extractRows(data.text);
}

/**
 * Parse CSV buffer → student rows.
 * If first line has headers boleta/nombre/grupo, uses them; otherwise falls back to extractRows.
 */
function parseCSV(buffer) {
  const text = buffer.toString('utf-8');
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''));
  const boletaIdx = headers.findIndex(h => h.includes('boleta'));
  const nombreIdx = headers.findIndex(h => h.includes('nombre'));
  const grupoIdx = headers.findIndex(h => h.includes('grupo'));

  if (boletaIdx !== -1 && nombreIdx !== -1 && grupoIdx !== -1) {
    return lines.slice(1)
      .map(line => {
        const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        return {
          boleta: parseInt(cols[boletaIdx], 10),
          nombre: (cols[nombreIdx] || '').toUpperCase().trim(),
          Grupo: (cols[grupoIdx] || '').toUpperCase().trim(),
        };
      })
      .filter(r => r.boleta && r.nombre && r.Grupo);
  }

  // No structured headers — try free-text extraction
  return extractRows(text);
}

/**
 * Parse XLSX buffer → student rows.
 * Uses column header names if available; otherwise falls back to CSV text extraction.
 */
function parseXLSX(buffer) {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(ws, { defval: '' });

  if (data.length === 0) return [];

  const firstRow = data[0];
  const keys = Object.keys(firstRow);
  const boletaKey = keys.find(k => k.toLowerCase().includes('boleta'));
  const nombreKey = keys.find(k => k.toLowerCase().includes('nombre'));
  const grupoKey = keys.find(k => k.toLowerCase().includes('grupo'));

  if (boletaKey && nombreKey && grupoKey) {
    return data
      .map(row => ({
        boleta: parseInt(String(row[boletaKey]), 10),
        nombre: String(row[nombreKey]).toUpperCase().trim(),
        Grupo: String(row[grupoKey]).toUpperCase().trim(),
      }))
      .filter(r => r.boleta && r.nombre && r.Grupo);
  }

  // Fall back to CSV text extraction
  const csv = XLSX.utils.sheet_to_csv(ws);
  return extractRows(csv);
}

module.exports = { parsePDF, parseCSV, parseXLSX, extractRows };
