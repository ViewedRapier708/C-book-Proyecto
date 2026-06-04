import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = dirname(fileURLToPath(import.meta.url));

function read(relativePath) {
  return readFileSync(join(currentDir, relativePath), 'utf8');
}

const userCatalog = read('pages/user/SolicitudLibros.jsx');
const adminCatalog = read('pages/admin/AltaLibros.jsx');
const recursosController = read('../../back/src/controllers/ControladorRecursos.js');
const adminController = read('../../back/src/controllers/ControladorAdministrador.js');
const recursosModel = read('../../back/src/models/ModeloRecursos.js');
const adminModel = read('../../back/src/models/ModeloAdministrador.js');
const reportPath = join(currentDir, '../../mds/optimizacion-carga-libros.md');

for (const [name, source] of [
  ['catalogo de usuarios', userCatalog],
  ['inventario admin', adminCatalog],
]) {
  assert.match(source, /const PER_PAGE = 10;/, `${name} debe paginar de 10 en 10`);
  assert.doesNotMatch(source, /BATCH_SIZE/, `${name} no debe usar carga masiva por lotes`);
  assert.doesNotMatch(source, /nextBatchPageRef|loadingMoreRef|itemsRef|totalCountRef/, `${name} no debe conservar refs de carga total`);
  assert.match(source, /LAZY_THRESHOLD = 7;/, `${name} debe precargar a partir de pagina 7`);
  assert.match(source, /all:\s*true/, `${name} debe buscar en toda la base con all=true`);
  assert.match(source, /searchResults/, `${name} debe paginar localmente resultados completos de busqueda`);
}

assert.match(userCatalog, /recursosApi\.getByType\('libro',[\s\S]*q:/, 'catalogo usuarios debe enviar q al backend');
assert.match(userCatalog, /only_tipos:\s*true/, 'catalogo usuarios debe cargar tipos desde endpoint liviano');
assert.doesNotMatch(userCatalog, /const tipos = useMemo/, 'catalogo usuarios no debe construir tipos solo con la pagina actual');
assert.match(adminCatalog, /adminApi\.getMaterials\('libros',[\s\S]*q:/, 'inventario admin debe enviar q al backend');

for (const [name, source] of [
  ['controlador recursos', recursosController],
  ['controlador admin', adminController],
]) {
  assert.match(source, /req\.query\.q/, `${name} debe leer q`);
  assert.match(source, /req\.query\.all/, `${name} debe leer all`);
  assert.match(source, /tipo_material/, `${name} debe pasar filtro tipo_material`);
  assert.match(source, /disponible/, `${name} debe pasar filtro disponible`);
}

assert.match(recursosController, /only_tipos/, 'controlador recursos debe leer only_tipos');

for (const [name, source] of [
  ['modelo recursos', recursosModel],
  ['modelo admin', adminModel],
]) {
  assert.match(source, /q\s*=/, `${name} debe aceptar q`);
  assert.match(source, /all/, `${name} debe aceptar all=true`);
  assert.match(source, /tipo_material/, `${name} debe filtrar por tipo_material`);
  assert.match(source, /disponible/, `${name} debe filtrar por disponible`);
  assert.match(source, /ilike/, `${name} debe buscar con ilike en base de datos`);
  assert.match(source, /fetchRowsInBatches\(buildQuery, count \|\| 0\)/, `${name} debe obtener ids de busqueda en lotes para no perder resultados`);
}

assert.match(recursosModel, /only_tipos/, 'modelo recursos debe soportar only_tipos');

assert.ok(existsSync(reportPath), 'Debe existir reporte mds/optimizacion-carga-libros.md');

console.log('book-loading-optimization.test.mjs OK');
