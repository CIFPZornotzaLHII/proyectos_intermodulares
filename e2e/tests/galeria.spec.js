// Galería (/proyectos/galeria): tarjetas, filtro por ciclo en la URL, buscador y la invitación a entrar
import { test, expect } from '@playwright/test';
import { PROYECTOS, recorrer, tarjeta } from './datos.js';

// La portada va entera en 16:9 arriba de la tarjeta, sin caja ni velo (D-48); la de PG se aborta para probar la
// tarjeta sin imagen (onError)
async function portadaEntera(page) {
  await page.route(`**/p/${PROYECTOS.PG.id}/portada.jpg`, r => r.abort());
  await page.goto('galeria');   // el beforeEach ya cargó la galería sin la ruta
  await expect(page.getByRole('article')).toHaveCount(3);
  await recorrer(page);         // las portadas son loading="lazy"
  const sinImagen = tarjeta(page, PROYECTOS.PG.titulo);
  await expect(sinImagen.locator('img')).toHaveCount(0);
  await expect(sinImagen.getByText('TP', { exact: true })).toBeVisible();   // iniciales de "TPV para la cafetería"
  for (const p of [PROYECTOS.WG, PROYECTOS['2SM']]) await expect(tarjeta(page, p.titulo).locator('img')).toHaveCount(1);
  // tamaños de layout (offset*), relativos a la tarjeta: la entrada escalonada usa transformaciones
  const medidas = await page.getByRole('article').evaluateAll(as => as.map(a => {
    const arriba = el => { let y = 0; for (; el && el !== a; el = el.offsetParent) y += el.offsetTop; return y; };
    const abajo = el => arriba(el) + el.offsetHeight;
    const portada = a.querySelector('a[aria-label^="Ver proyecto:"]');
    const img = a.querySelector('img');
    return {
      top: a.offsetTop, alto: a.offsetHeight, ancho: a.offsetWidth, h3: arriba(a.querySelector('h3')),
      portada: { ancho: portada.offsetWidth, alto: portada.offsetHeight, abajo: abajo(portada) },
      insignia: abajo(a.querySelector('.insignia')), menu: abajo(a.querySelector('button[aria-label="Más opciones"]')),
      img: img && { ancho: img.offsetWidth, alto: img.offsetHeight, enPortada: portada.contains(img) },
      fondo: getComputedStyle(a).backgroundImage, borde: getComputedStyle(a).borderTopWidth,
    };
  }));
  for (const m of medidas) {
    for (const o of medidas) if (o.top === m.top) expect(o.alto, 'mismo alto en la fila').toBe(m.alto);
    expect(Math.abs(m.portada.ancho - m.ancho), 'la portada a todo el ancho de la tarjeta').toBeLessThanOrEqual(1);
    expect(Math.abs(m.portada.alto - 0.5625 * m.portada.ancho), 'portada en 16:9').toBeLessThanOrEqual(1);
    expect(m.insignia).toBeLessThanOrEqual(m.portada.abajo);
    expect(m.menu).toBeLessThanOrEqual(m.portada.abajo);
    expect(m.h3, 'el título, debajo de la portada').toBeGreaterThan(m.portada.abajo);
    expect(m.fondo, 'sin velo').toBe('none');
    expect(m.borde, 'sin caja').toBe('0px');
    if (m.img) {
      expect(m.img.enPortada).toBe(true);
      expect(Math.abs(m.img.ancho - m.portada.ancho)).toBeLessThanOrEqual(1);
      expect(Math.abs(m.img.alto - m.portada.alto)).toBeLessThanOrEqual(1);
    }
  }
  expect(medidas.filter(m => m.img).length).toBe(2);
}

test.describe('galería', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('galeria');
    await expect(page.getByRole('article')).toHaveCount(3);
  });

  test('muestra los tres proyectos con ciclo, equipo, etiquetas y enlaces', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Todos los proyectos');
    for (const p of Object.values(PROYECTOS)) {
      const t = tarjeta(page, p.titulo);
      await expect(t).toBeVisible();
      await expect(t.locator('.insignia')).toHaveText(p.ciclo);
      await expect(t.getByText('Ejemplo', { exact: true })).toBeVisible();   // los tres del repo son ejemplos (D-48)
      await expect(t.getByText(p.equipo)).toBeVisible();
      await expect(t.getByText(p.etiqueta, { exact: true })).toBeVisible();
      await expect(t.getByRole('link', { name: 'Ver proyecto', exact: true })).toHaveCount(0);   // las acciones van en el menú (D-28)
      await t.getByRole('button', { name: 'Más opciones' }).click();
      await expect(t.getByRole('link', { name: 'Ver proyecto', exact: true })).toHaveAttribute('href', `/proyectos/p/${p.id}/`);
      await expect(t.getByRole('link', { name: `Ver proyecto: ${p.titulo}` })).toHaveAttribute('href', `/proyectos/p/${p.id}/`);
      await expect(t.getByRole('link', { name: 'Código' })).toHaveAttribute('target', '_blank');
      await expect(t.getByRole('button', { name: 'Compartir' })).toBeVisible();   // copia el enlace de la landing (D-44)
      if (p === PROYECTOS.WG) await expect(t.getByRole('link', { name: 'Vídeo' })).toHaveAttribute('href', /^https:\/\/youtu\.be\//);
      if (p === PROYECTOS.PG) {   // sin vídeo: pendiente y desactivado, no un enlace roto
        await expect(t.getByRole('button', { name: 'Vídeo pendiente' })).toBeDisabled();
        await expect(t.getByRole('link', { name: 'Vídeo' })).toHaveCount(0);
      }
      await page.keyboard.press('Escape');
      await expect(t.getByRole('button', { name: 'Más opciones' })).toHaveAttribute('aria-expanded', 'false');
    }
    await expect(page.getByText(/Grado (medio|superior)/)).toHaveCount(0);
  });

  test('las etiquetas de la tarjeta filtran la galería y el chip de la barra quita el filtro (D-41)', async ({ page }) => {
    await tarjeta(page, PROYECTOS.WG.titulo).getByRole('button', { name: 'Filtrar por la etiqueta mysql' }).click();
    await expect(page).toHaveURL(/\?etiqueta=mysql$/);
    await expect(page.getByRole('article')).toHaveCount(2);
    await expect(tarjeta(page, PROYECTOS.PG.titulo).getByRole('button', { name: 'Filtrar por la etiqueta mysql' })).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: 'Quitar el filtro de etiqueta mysql' }).click();
    await expect(page).toHaveURL(/\/galeria$/);
    await expect(page.getByRole('article')).toHaveCount(3);
  });

  test('filtra por ciclo (y la URL se puede compartir) y busca por título, nombre o etiqueta', async ({ page }) => {
    const filtros = page.getByRole('group', { name: 'Filtrar por ciclo' });
    await expect(filtros.getByRole('button')).toHaveText(['Todos · 3', 'SMR · 1', 'DAW · 1', 'DAM · 1']);
    await expect(filtros.getByRole('button', { name: 'Todos · 3' })).toHaveAttribute('aria-pressed', 'true');
    await filtros.getByRole('button', { name: 'SMR · 1' }).click();
    await expect(page).toHaveURL(/\/galeria\?ciclo=2SM$/);
    await expect(page.getByRole('article')).toHaveCount(1);
    await expect(tarjeta(page, PROYECTOS['2SM'].titulo)).toBeVisible();
    await expect(filtros.getByRole('button', { name: 'SMR · 1' })).toHaveAttribute('aria-pressed', 'true');
    await expect(filtros.getByRole('button', { name: 'Todos · 3' })).toHaveAttribute('aria-pressed', 'false');

    await page.goto('galeria?ciclo=PG');
    await expect(page.getByRole('article')).toHaveCount(1);
    await expect(tarjeta(page, PROYECTOS.PG.titulo)).toBeVisible();
    await expect(filtros.getByRole('button', { name: 'DAM · 1' })).toHaveAttribute('aria-pressed', 'true');
    await filtros.getByRole('button', { name: 'Todos · 3' }).click();
    await expect(page).toHaveURL(/\/galeria$/);
    await expect(page.getByRole('article')).toHaveCount(3);

    const buscador = page.getByRole('searchbox');
    await expect(buscador).toHaveAttribute('placeholder', 'Buscar');
    await expect(buscador).toHaveAccessibleName('Buscar por título, nombre o etiqueta');
    await buscador.fill('laravel');                 // etiqueta
    await expect(page.getByRole('article')).toHaveCount(1);
    await expect(tarjeta(page, PROYECTOS.WG.titulo)).toBeVisible();
    await buscador.fill('OIER');                    // nombre, sin distinguir mayúsculas
    await expect(page.getByRole('article')).toHaveCount(1);
    await expect(tarjeta(page, PROYECTOS.PG.titulo)).toBeVisible();
    await buscador.fill('red segura');              // título
    await expect(tarjeta(page, PROYECTOS['2SM'].titulo)).toBeVisible();
    await buscador.fill('zzz');
    await expect(page.getByText('Ningún proyecto coincide con la búsqueda.')).toBeVisible();
    await expect(page.getByRole('article')).toHaveCount(0);
    await buscador.fill('');
    await expect(page.getByRole('article')).toHaveCount(3);
    // filtro y búsqueda se combinan
    await filtros.getByRole('button', { name: 'DAW · 1' }).click();
    await buscador.fill('tpv');
    await expect(page.getByText('Ningún proyecto coincide con la búsqueda.')).toBeVisible();
  });

  test('sin sesión, el corazón de cada tarjeta lleva al inicio de sesión y de vuelta a la galería (D-48)', async ({ page }) => {
    const invitaciones = page.getByRole('link', { name: 'Inicia sesión para reaccionar' });
    await expect(invitaciones).toHaveCount(3);
    await expect(invitaciones.first()).toHaveAttribute('href', '/proyectos/entrar?volver=/galeria');
    await expect(page.getByRole('button', { name: /^(Me gusta|Buena idea|Ambicioso|Fuego|Me encanta|Reaccionar)$/ })).toHaveCount(0);
    await tarjeta(page, PROYECTOS['2SM'].titulo).getByRole('link', { name: 'Inicia sesión para reaccionar' }).click();
    await expect(page).toHaveURL(/\/proyectos\/entrar\?volver=\/galeria$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Entra para reaccionar');
    // y "Volver a los proyectos" devuelve a la galería
    await page.getByRole('link', { name: 'Volver a los proyectos' }).click();
    await expect(page).toHaveURL(/\/proyectos\/galeria$/);
  });

  test('"Ver proyecto" abre la landing del grupo', async ({ page }) => {
    const t = tarjeta(page, PROYECTOS.WG.titulo);
    await t.getByRole('button', { name: 'Más opciones' }).click();
    await t.getByRole('link', { name: 'Ver proyecto', exact: true }).click();
    await expect(page).toHaveURL(/\/proyectos\/p\/WG\/reservas-talleres\/$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(PROYECTOS.WG.landing);
    await expect(page).toHaveTitle(/Reserva tu taller en 20 segundos/);
  });

  test('la portada va entera en 16:9, sin caja ni velo, con o sin imagen, y las de una fila miden lo mismo (D-48)', async ({ page }) => {
    await portadaEntera(page);
  });

  test.describe('a 390 px', () => {
    test.use({ viewport: { width: 390, height: 844 } });
    test('la portada va entera en 16:9, con o sin imagen (D-48)', async ({ page }) => {
      await portadaEntera(page);
    });
  });
});
