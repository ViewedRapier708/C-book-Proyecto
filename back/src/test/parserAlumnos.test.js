// Test mínimo para parserAlumnos — ejecutar con: node back/src/test/parserAlumnos.test.js
const { extractRows, parseCSV } = require('../utils/parserAlumnos');

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) {
    console.log(`  ✅ ${msg}`);
    passed++;
  } else {
    console.error(`  ❌ FALLÓ: ${msg}`);
    failed++;
  }
}

// ── Test 1: extractRows con texto estilo PDF del IPN ─────────────────────
console.log('\n📄 Test 1: extractRows desde texto tipo PDF IPN');
const pdfText = `
ESCUELA SUPERIOR DE INGENIERIA MECANICA Y ELECTRICA
UNIDAD CULHUACAN  -  PERIODO 2024-2025/A
GRUPO: 6CM1

No.  BOLETA          NOMBRE COMPLETO
1    2021601234      GARCIA LOPEZ JUAN ANTONIO
2    2021601235      MARTINEZ RAMIREZ ANA SOFIA
3    2021601236      HERNANDEZ PEREZ CARLOS EDUARDO
`;

const rows1 = extractRows(pdfText);
assert(rows1.length === 3, `Se extraen 3 filas (obtenidas: ${rows1.length})`);
assert(rows1[0].boleta === 2021601234, `Boleta correcta: ${rows1[0]?.boleta}`);
assert(rows1[0].nombre.includes('GARCIA'), `Nombre contiene GARCIA: "${rows1[0]?.nombre}"`);
assert(rows1[0].Grupo === '6CM1', `Grupo correcto: ${rows1[0]?.Grupo}`);

// ── Test 2: extractRows con grupo inline por fila (incluyendo formato extendido 7IM3A) ──
console.log('\n📄 Test 2: extractRows con grupo en la misma fila');
const pdfText2 = `
2022700100    RAMOS DIAZ PEDRO         7IM3
2022700101    FLORES ORTIZ MARIA       7IM3
`;

const rows2 = extractRows(pdfText2);
assert(rows2.length === 2, `Se extraen 2 filas (obtenidas: ${rows2.length})`);
if (rows2.length > 0) {
  assert(rows2[0].Grupo === '7IM3', `Grupo inline correcto: ${rows2[0]?.Grupo}`);
}

// ── Test 3: líneas inválidas son ignoradas ────────────────────────────────
console.log('\n📄 Test 3: líneas inválidas se ignoran');
const pdfText3 = `
Página 1 de 5
Fecha: 15/08/2024
2021601234   VALID STUDENT NAME    6CM1
ESTO NO ES UNA BOLETA  12345
`;

const rows3 = extractRows(pdfText3);
assert(rows3.length === 1, `Solo 1 fila válida (obtenidas: ${rows3.length})`);

// ── Test 4: parseCSV con headers ──────────────────────────────────────────
console.log('\n📄 Test 4: parseCSV con encabezados estándar');
const csvBuffer = Buffer.from(
  'boleta,nombre,grupo\n' +
  '2021601234,GARCIA LOPEZ JUAN,6CM1\n' +
  '2021601235,MARTINEZ RAMIREZ ANA,6CM1\n'
);

const csvRows = parseCSV(csvBuffer);
assert(csvRows.length === 2, `Se parsean 2 filas CSV (obtenidas: ${csvRows.length})`);
assert(csvRows[0].boleta === 2021601234, `Boleta CSV correcta: ${csvRows[0]?.boleta}`);
assert(csvRows[0].nombre === 'GARCIA LOPEZ JUAN', `Nombre CSV correcto: "${csvRows[0]?.nombre}"`);
assert(csvRows[0].Grupo === '6CM1', `Grupo CSV correcto: ${csvRows[0]?.Grupo}`);

// ── Test 5: parseCSV vacío ────────────────────────────────────────────────
console.log('\n📄 Test 5: parseCSV con sólo cabecera devuelve []');
const csvEmpty = Buffer.from('boleta,nombre,grupo\n');
const emptyRows = parseCSV(csvEmpty);
assert(emptyRows.length === 0, `CSV sólo encabezado → 0 filas (obtenidas: ${emptyRows.length})`);

// ── Resumen ───────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(45)}`);
console.log(`Resultado: ${passed} pasaron, ${failed} fallaron`);
if (failed > 0) process.exit(1);
