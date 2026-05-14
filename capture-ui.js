const { chromium } = require('playwright');
const path = require('path');

const BASE_URL = 'http://localhost:5173';
const OUT_DIR = path.join(__dirname, 'ui-screenshots');

async function screenshot(page, name) {
  await page.screenshot({ path: path.join(OUT_DIR, `${name}.png`), fullPage: true });
  console.log(`  captured: ${name}.png`);
}

async function waitReady(page) {
  // Wait for DOM + any pending network requests to settle
  await page.waitForLoadState('domcontentloaded').catch(() => {});
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(2500);
}

async function login(page, boleta, password) {
  await page.goto(BASE_URL);
  await page.waitForLoadState('domcontentloaded').catch(() => {});
  await page.waitForTimeout(800);

  const boletaInput = page.locator('input[type="text"]').first();
  const passInput   = page.locator('input[type="password"]').first();

  await boletaInput.click({ clickCount: 3 });
  await boletaInput.pressSequentially(boleta, { delay: 60 });

  await passInput.click({ clickCount: 3 });
  await passInput.pressSequentially(password, { delay: 60 });

  // Capture login API response for debugging
  let loginResp = null;
  const handler = async (res) => {
    if (res.url().includes('/auth/login')) {
      try { loginResp = await res.json(); } catch (_) {}
    }
  };
  page.on('response', handler);

  await page.click('button[type="submit"]');
  await page.waitForTimeout(4000);
  page.off('response', handler);

  if (loginResp) console.log(`  login response: ${JSON.stringify(loginResp)}`);
  console.log(`  landed on: ${page.url()}`);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  // Suppress expected console errors from aborted navigations
  page.on('console', msg => {
    if (msg.type() === 'error') console.log(`  [console] ${msg.text().split('\n')[0]}`);
  });

  // ── LOGIN PAGE ─────────────────────────────────────────────────────────────
  await page.goto(BASE_URL);
  await page.waitForLoadState('domcontentloaded').catch(() => {});
  await page.waitForTimeout(1000);
  await screenshot(page, '01-login');

  // ── ADMIN FLOW ─────────────────────────────────────────────────────────────
  console.log('\nAdmin login...');
  await login(page, '1000000001', 'n0m3l0');
  await screenshot(page, '02-admin-home');

  const adminRoutes = [
    { path: '/admin/libros',             name: '03-admin-libros' },
    { path: '/admin/computadoras',       name: '04-admin-computadoras' },
    { path: '/admin/restiradores',       name: '05-admin-restiradores' },
    { path: '/admin/usuarios',           name: '06-admin-usuarios' },
    { path: '/admin/documentos',         name: '07-admin-documentos' },
    { path: '/admin/solicitudes-libros', name: '08-admin-solicitudes-libros' },
    { path: '/admin/prestamos-libros',   name: '09-admin-prestamos-libros' },
    { path: '/admin/analytics',          name: '10-admin-analytics' },
    { path: '/admin/reportes',           name: '11-admin-reportes' },
  ];

  for (const r of adminRoutes) {
    await page.goto(BASE_URL + r.path);
    await waitReady(page);
    await screenshot(page, r.name);
  }

  // ── LOGOUT & SWITCH TO USER ────────────────────────────────────────────────
  console.log('\nClearing session...');
  await ctx.clearCookies();
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });

  console.log('\nUser (alumno) login...');
  await login(page, '2024090192', 'patata123.');
  await screenshot(page, '12-user-home');

  const userRoutes = [
    { path: '/user/computadoras',           name: '13-user-computadoras' },
    { path: '/user/libros',                 name: '14-user-libros' },
    { path: '/user/restiradores',           name: '15-user-restiradores' },
    { path: '/user/mis-solicitudes',        name: '16-user-mis-solicitudes' },
    { path: '/user/mis-solicitudes-libros', name: '17-user-mis-solicitudes-libros' },
    { path: '/user/perfil',                 name: '18-user-perfil' },
    { path: '/user/perfil/editar',          name: '19-user-perfil-editar' },
    { path: '/user/cambiar-correo',         name: '20-user-cambiar-correo' },
    { path: '/user/cuenta',                 name: '21-user-cuenta' },
  ];

  for (const r of userRoutes) {
    await page.goto(BASE_URL + r.path);
    await waitReady(page);
    await screenshot(page, r.name);
  }

  await browser.close();
  console.log('\nDone. Screenshots saved to ui-screenshots/');
})();
