import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const currentDir = dirname(fileURLToPath(import.meta.url));

function read(relativePath) {
  return readFileSync(join(currentDir, relativePath), 'utf8');
}

const navbar = read('components/layout/Navbar.jsx');
const globals = read('styles/globals.css');
const supportCss = read('styles/support.css');
const solicitudLibros = read('pages/user/SolicitudLibros.jsx');
const userProfile = read('pages/user/UserProfile.jsx');
const login = read('pages/Login.jsx');

assert.match(navbar, /bottom-tab-bar/, 'Navbar mobile debe renderizar bottom-tab-bar');
assert.doesNotMatch(navbar, /mobile-sidebar/, 'Navbar mobile no debe usar mobile-sidebar');
assert.doesNotMatch(navbar, /<Menu\b/, 'Navbar mobile no debe depender del icono Menu');

assert.match(globals, /\.bottom-tab-bar\s*\{/, 'globals.css debe definir .bottom-tab-bar');
assert.match(globals, /\.bottom-tab-bar\s*\{[\s\S]*display:\s*none/, 'bottom-tab-bar debe estar oculta por defecto');
assert.match(globals, /@media \(max-width:\s*1023px\)\s*\{[\s\S]*\.bottom-tab-bar\s*\{[\s\S]*display:\s*grid/, 'bottom-tab-bar solo debe mostrarse en mobile');
assert.match(globals, /padding-bottom:\s*calc\(5rem \+ env\(safe-area-inset-bottom\)\)/, 'main debe reservar espacio para bottom bar en mobile');
assert.match(supportCss, /\.support-fab,\s*\.survey-fab\s*\{[\s\S]*display:\s*inline-flex/, 'FABs de soporte y encuesta deben seguir visibles en web');
assert.match(supportCss, /@media \(max-width:\s*768px\)\s*\{[\s\S]*\.support-fab,\s*\.survey-fab\s*\{[\s\S]*display:\s*none/, 'FABs de soporte y encuesta deben ocultarse en celular');

assert.match(solicitudLibros, /resource-card-title-text/, 'SolicitudLibros debe usar clase para titulos de card');
const toolbarIndex = solicitudLibros.indexOf('className="toolbar"');
const topBooksIndex = solicitudLibros.indexOf('Libros más solicitados');
assert.ok(toolbarIndex >= 0, 'SolicitudLibros debe tener toolbar de filtros');
assert.ok(topBooksIndex >= 0, 'SolicitudLibros debe mostrar libros más solicitados');
assert.ok(
  toolbarIndex < topBooksIndex,
  'Libros más solicitados debe aparecer debajo de los filtros'
);
assert.match(globals, /\.resource-card-title-text\s*\{[\s\S]*-webkit-line-clamp:\s*2/, 'Titulos de cards deben truncarse a dos lineas');
assert.match(globals, /\.resource-card-body\s*\{[\s\S]*flex:\s*1/, 'resource-card-body debe crecer para igualar alturas');

assert.match(userProfile, /className="profile-layout"/, 'Mi Perfil debe usar profile-layout responsive');
assert.match(userProfile, /className="profile-stats-grid"/, 'Mi Perfil debe usar grid responsive para estadísticas');
assert.match(userProfile, /className="profile-status-grid"/, 'Mi Perfil debe usar grid responsive para estados');
assert.match(globals, /\.profile-layout\s*\{[\s\S]*grid-template-columns:\s*1fr 2fr/, 'profile-layout debe mantener layout desktop');
assert.match(globals, /@media \(max-width:\s*768px\)\s*\{[\s\S]*\.profile-layout\s*\{[\s\S]*grid-template-columns:\s*1fr/, 'profile-layout debe ser una columna en mobile');
assert.match(globals, /@media \(max-width:\s*520px\)\s*\{[\s\S]*\.profile-status-grid\s*\{[\s\S]*grid-template-columns:\s*1fr/, 'Estados de perfil deben ser una columna en celular');

assert.match(login, /password-hint/, 'Registro debe mostrar hint de formato de password');
assert.match(login, /6 a 16 caracteres/, 'Hint de password debe indicar longitud requerida');

const showPasswordIndex = login.indexOf('className="show-password"');
const privacyNoticeIndex = login.indexOf('Acepto el');
assert.ok(showPasswordIndex >= 0, 'Login debe tener control Mostrar contraseña');
assert.ok(privacyNoticeIndex >= 0, 'Login debe tener aviso de privacidad y terminos');
assert.ok(
  showPasswordIndex < privacyNoticeIndex,
  'Aviso de privacidad debe mostrarse debajo de Mostrar contraseña'
);

console.log('responsive-improvements.test.mjs OK');
