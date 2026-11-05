// Calidad transversal: sin errores de consola ni peticiones rotas, un solo h1, imágenes con alt, botones con nombre,
// foco visible al navegar con teclado, tamaño de los botones y la web con "reducir movimiento" activado (SPEC §3).
import { test, expect } from '@playwright/test';
import { PROYECTOS } from './datos.js';

const PAGINAS = { portada: '.', galeria: 'galeria', entrar: 'entrar', 'landing WG': `p/${PROYECTOS.WG.id}/` };
// Lo único que puede fallar legítimamente: Google Fonts si el contenedor no tiene salida a internet
const externa = url => /fonts\.(googleapis|gstatic)\.com/.test(url);

for (const [nombre, ruta] of Object.entries(PAGINAS)) {
  test(`${nombre}: carga sin errores de consola ni peticiones fallidas`, async ({ page }) => {
    const errores = [], fallidas = [];
    page.on('pageerror', e => errores.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/status of 401/.test(m.text())) errores.push(m.text()); });
    page.on('requestfailed', r => { if (!externa(r.url())) fallidas.push(`${r.url()} → ${r.failure()?.errorText}`); });
    page.on('response', r => {
      const sesionAnonima = r.status() === 401 && r.url().endsWith('/api/sesion');   // GET api/sesion sin cookie: esperado
      if (r.status() >= 400 && !sesionAnonima && !externa(r.url())) fallidas.push(`${r.status()} ${r.url()}`);
    });
    await page.goto(ruta);
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { level: 1 })).toBeAttached();
    expect(errores, 'errores de consola').toEqual([]);
    expect(fallidas, 'peticiones fallidas').toEqual([]);
  });

  test(`${nombre}: un solo h1, imágenes con alt, botones y enlaces con nombre`, async ({ page }) => {
    await page.goto(ruta);
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    expect(await page.locator('img:not([alt])').count(), 'imágenes sin alt').toBe(0);
    const anonimos = await page.locator('button, a').evaluateAll(els =>
      els.filter(el => !(el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent.trim())).map(el => el.outerHTML.slice(0, 120)));
    expect(anonimos, 'botones o enlaces sin nombre').toEqual([]);
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await expect(page.locator('meta[name="viewport"]')).toHaveAttribute('content', /width=device-width/);
  });
}

test('con teclado se llega al inicio de sesión y el foco se ve', async ({ page }) => {
  await page.goto('.');
  const entrar = page.getByRole('banner').getByRole('link', { name: 'Iniciar sesión' });
  for (let i = 0; i < 10 && !(await entrar.evaluate(el => el === document.activeElement)); i++) await page.keyboard.press('Tab');
  await expect(entrar).toBeFocused();
  expect(await entrar.evaluate(el => getComputedStyle(el).outlineStyle), 'contorno de foco').not.toBe('none');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/proyectos\/entrar/);
  await expect(page.getByLabel('Usuario')).toBeVisible();
});

test('los botones de reacción miden al menos 36 px y los principales 40 px de alto', async ({ page }) => {
  await page.goto('galeria');
  await expect(page.getByRole('article')).toHaveCount(3);
  const reacciones = await page.getByRole('button', { name: /^(Me gusta|Buena idea|Ambicioso|Fuego|Me encanta)$/ }).evaluateAll(bs => bs.map(b => b.getBoundingClientRect().height));
  expect(reacciones.length).toBe(15);
  for (const h of reacciones) expect(h).toBeGreaterThanOrEqual(36);
  const principales = await page.getByRole('link', { name: 'Ver proyecto', exact: true }).evaluateAll(as => as.map(a => a.getBoundingClientRect().height));
  expect(principales.length).toBe(3);
  for (const h of principales) expect(h).toBeGreaterThanOrEqual(40);
});

test.describe('con "reducir movimiento"', () => {
  test.use({ reducedMotion: 'reduce' });
  test('la portada y la galería muestran todo igualmente', async ({ page }) => {
    await page.goto('.');
    await expect(page.locator('#destacado').getByRole('article')).toBeVisible();
    await expect(page.getByRole('article')).toHaveCount(3);
    await page.locator('dl').scrollIntoViewIfNeeded();
    await expect(page.locator('dl dd').first()).toHaveText('3');
    await page.goto('galeria');
    await expect(page.getByRole('article')).toHaveCount(3);
  });
});
