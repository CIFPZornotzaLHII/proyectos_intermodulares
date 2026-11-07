// Portada (/proyectos/): título, cifras, proyecto destacado al azar entre los más votados, tendencias y enlaces (D-05)
import { test, expect } from '@playwright/test';
import { CIFRAS, TITULOS } from './datos.js';

const cualquiera = new RegExp(`^(${TITULOS.join('|')})$`);

test.describe('portada', () => {
  test.beforeEach(async ({ page }) => { await page.goto('.'); });

  test('título, cifras y proyecto destacado', async ({ page }) => {
    await expect(page).toHaveTitle(/Proyectos intermodulares · CIFP Zornotza LHII/);
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toBeVisible();
    await expect(h1).toHaveAccessibleName('Proyectos intermodulares 26-27');
    await expect(page.getByText('CIFP Zornotza LHII · Curso 2026-27').first()).toBeVisible();
    // cifras (CountUp, arranca al entrar en pantalla; cierran el héroe): 3 proyectos, 7 alumnos, 0 reacciones
    await expect(page.locator('dl dt')).toHaveText(['Proyectos', 'Alumnos', 'Reacciones']);
    await page.locator('dl').scrollIntoViewIfNeeded();
    await expect(page.locator('dl dd')).toHaveText([String(CIFRAS.proyectos), String(CIFRAS.alumnos), '0']);
    // destacado: uno de los tres, con su total y la etiqueta del ciclo (sin el grado, D-11)
    await expect(page.getByRole('heading', { level: 2, name: 'Proyecto destacado' })).toBeVisible();
    const destacado = page.locator('#destacado').getByRole('article');
    await expect(destacado).toBeVisible();
    await expect(destacado.getByRole('heading', { level: 3 })).toHaveText(cualquiera);
    await expect(destacado.getByText('0 reacciones en total')).toBeVisible();
    await expect(destacado.locator('.insignia')).toHaveText(/^(SMR|DAW|DAM)$/);
    await expect(page.getByText(/Grado (medio|superior)/)).toHaveCount(0);
    await expect(destacado.getByRole('link', { name: 'Ver proyecto', exact: true })).toHaveAttribute('href', /^\/proyectos\/p\/(2SM|WG|PG)\/[a-z0-9-]+\/$/);
  });

  test('tendencias: los otros proyectos, con su total y enlace a la galería', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 2, name: 'Tendencias' })).toBeVisible();
    await expect(page.getByRole('article')).toHaveCount(3);   // 1 destacado + 2 tendencias
    const destacado = await page.locator('#destacado').getByRole('heading', { level: 3 }).textContent();
    const tendencias = page.getByRole('article').filter({ hasNotText: 'reacciones en total' });
    await expect(tendencias).toHaveCount(2);
    for (const titulo of TITULOS.filter(t => t !== destacado)) await expect(tendencias.getByRole('heading', { level: 3, name: titulo })).toBeVisible();
    await expect(tendencias.getByText(/^0 reacciones$/)).toHaveCount(2);
    await expect(page.getByRole('link', { name: `Ver los ${CIFRAS.proyectos} proyectos` })).toHaveAttribute('href', '/proyectos/galeria');
  });

  test('"Enséñame otro" cambia el destacado sin volver a pedir la lista', async ({ page }) => {
    const titulo = page.locator('#destacado').getByRole('heading', { level: 3 });
    await expect(titulo).toHaveText(cualquiera);
    const antes = await titulo.textContent();
    const peticiones = [];
    page.on('request', r => { if (r.url().includes('/api/proyectos')) peticiones.push(r.url()); });
    await page.getByRole('button', { name: 'Enséñame otro' }).click();
    await expect(titulo).not.toHaveText(antes);
    await expect(titulo).toHaveText(cualquiera);
    expect(peticiones).toEqual([]);
  });

  test('los enlaces llevan a la galería, al destacado y a la guía de publicación', async ({ page, isMobile }) => {
    const guia = page.getByRole('link', { name: 'Guía para publicar' });
    await expect(guia).toHaveAttribute('href', 'https://github.com/CIFPZornotzaLHII/proyectos_intermodulares/blob/main/proyectos/LEEME.md');
    await expect(guia).toHaveAttribute('target', '_blank');
    await page.getByRole('link', { name: 'Descubre los proyectos' }).click();
    await expect(page).toHaveURL(/#destacado$/);
    await expect(page.locator('#destacado')).toBeInViewport();
    await page.getByRole('link', { name: 'Ver todos los proyectos' }).click();
    await expect(page).toHaveURL(/\/proyectos\/galeria$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Todos los proyectos');
    // "Cómo publicar" desde la galería vuelve a la portada y baja hasta la llamada; en móvil no está (D-30)
    if (isMobile) return expect(page.getByRole('link', { name: 'Cómo publicar' })).toBeHidden();
    await page.getByRole('link', { name: 'Cómo publicar' }).click();
    await expect(page).toHaveURL(/\/proyectos\/?#publicar$/);   // el router deja /proyectos sin barra al ir a "/"
    await expect(page.getByRole('heading', { level: 2, name: '¿No has publicado todavía tu proyecto?' })).toBeInViewport();
  });
});

// En móvil (D-30) la cabecera va en dos filas: marca, ES/EU y sesión arriba; la navegación debajo
test('en móvil la cabecera ocupa dos filas y no desborda', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'solo móvil');
  await page.goto('.');
  const cabecera = page.getByRole('banner');
  const [marca, eu, entrar, proyectos, banner] = await Promise.all([
    cabecera.getByRole('link', { name: /Proyectos intermodulares/ }), cabecera.getByRole('button', { name: 'EU' }),
    cabecera.getByRole('link', { name: 'Iniciar sesión' }), cabecera.getByRole('link', { name: 'Proyectos', exact: true }), cabecera,
  ].map(l => l.boundingBox()));
  const solapan = (a, b) => a.y < b.y + b.height && b.y < a.y + a.height;
  expect(solapan(marca, eu) && solapan(marca, entrar), 'marca, EU e Iniciar sesión en la misma fila').toBe(true);
  expect(proyectos.y).toBeGreaterThanOrEqual(Math.max(marca.y + marca.height, entrar.y + entrar.height));
  expect(banner.height).toBeLessThan(150);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'sin scroll horizontal').toBe(true);
});
