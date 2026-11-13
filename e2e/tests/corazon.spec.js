// Corazón de la portada (D-47): sin sesión lleva a entrar; con la sesión guardada por preparar.setup.js, el propio
// proyecto no reacciona y en otro el abanico añade, persiste y quita; teclado; medidas a 390 y 1280 px; "reducir
// movimiento". Cambiar de reacción no se prueba aquí: depende de la API del job 025. Deja las reacciones a cero.
import { test, expect } from '@playwright/test';
import { SESION } from '../playwright.config.js';
import { PROYECTOS, tarjeta } from './datos.js';

const corazon = (page, titulo) => tarjeta(page, titulo).getByRole('button', { name: /^(Reaccionar|Tu reacción: .+)$/ });
const abanico = async (page, titulo) => page.locator(`[id="${await corazon(page, titulo).getAttribute('aria-controls')}"]`).getByRole('button');
// "Me gusta" exacto: "Tu reacción: Me gusta" también lo contiene
const reaccion = (page, titulo, nombre) => tarjeta(page, titulo).getByRole('button', { name: nombre, exact: true });

// Elige (o quita) una reacción y espera a que responda el servidor
async function pulsar(page, titulo, nombre) {
  await corazon(page, titulo).click();
  await reaccion(page, titulo, nombre).click();
  await expect(corazon(page, titulo)).toHaveAttribute('aria-busy', 'false');
}

test('sin sesión, el corazón de una tarjeta lleva a entrar con vuelta a la portada', async ({ page }) => {
  await page.goto('.');
  const enlace = tarjeta(page, PROYECTOS['2SM'].titulo).getByRole('link', { name: 'Inicia sesión para reaccionar' });
  await expect(enlace).toHaveAttribute('href', '/proyectos/entrar?volver=/');
  await expect(page.getByRole('button', { name: 'Reaccionar' })).toHaveCount(0);
  await enlace.click();
  await expect(page).toHaveURL(/\/proyectos\/entrar\?volver=\/$/);
});

test.describe('corazón con sesión', () => {
  test.use({ storageState: SESION });

  test('el propio proyecto dice "Es tu proyecto"; en otro, el abanico añade, persiste y se quita', async ({ page, request }) => {
    await page.goto('.');
    const propia = tarjeta(page, PROYECTOS.WG.titulo);
    await expect(propia.getByText('Es tu proyecto')).toBeVisible();
    await expect(propia.getByRole('button', { name: /^(Reaccionar|Tu reacción)/ })).toHaveCount(0);

    const titulo = PROYECTOS['2SM'].titulo;
    await expect(corazon(page, titulo)).toHaveAccessibleName('Reaccionar');
    await pulsar(page, titulo, 'Me gusta');
    await expect(corazon(page, titulo)).toHaveAccessibleName('Tu reacción: Me gusta');
    await expect(corazon(page, titulo)).toHaveAttribute('aria-expanded', 'false');
    await expect(tarjeta(page, titulo).getByText(/^1 reacciones( en total)?$/)).toHaveCount(1);
    const api = await (await request.get('api/proyectos')).json();
    const p = api.proyectos.find(x => x.id === PROYECTOS['2SM'].id);
    expect(p.reacciones['👏']).toBe(1);
    expect(p.mias).toEqual(['👏']);

    await page.reload();
    await expect(corazon(page, titulo)).toHaveAccessibleName('Tu reacción: Me gusta');
    await corazon(page, titulo).click();
    await expect(reaccion(page, titulo, 'Me gusta')).toHaveAttribute('aria-pressed', 'true');
    await reaccion(page, titulo, 'Me gusta').click();
    await expect(corazon(page, titulo)).toHaveAttribute('aria-busy', 'false');
    await expect(corazon(page, titulo)).toHaveAccessibleName('Reaccionar');
    const despues = await (await request.get('api/proyectos')).json();
    expect(Object.values(despues.proyectos.find(x => x.id === PROYECTOS['2SM'].id).reacciones)).toEqual([0, 0, 0, 0, 0]);
    expect((await (await request.get('api/salud')).json()).reacciones).toBe(0);
  });

  test('con teclado: Enter abre, Tab llega a "Me gusta" y Escape cierra con el foco en el corazón', async ({ page }) => {
    await page.goto('.');
    const titulo = PROYECTOS['2SM'].titulo;
    await corazon(page, titulo).focus();
    await page.keyboard.press('Enter');
    await expect(corazon(page, titulo)).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Tab');
    await expect(reaccion(page, titulo, 'Me gusta')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(corazon(page, titulo)).toHaveAttribute('aria-expanded', 'false');
    await expect(corazon(page, titulo)).toBeFocused();
  });

  for (const [ancho, alto] of [[390, 844], [1280, 800]]) {
    test(`a ${ancho} px el abanico abierto cabe en la tarjeta y en la pantalla, con botones de 44×44`, async ({ page }, info) => {
      test.skip(info.project.name !== 'escritorio', 'solo escritorio: setViewportSize fija el ancho');
      await page.setViewportSize({ width: ancho, height: alto });
      await page.goto('.');
      // el destacado tiene que llevar corazón: si sale el propio, otro
      const destacado = page.locator('#destacado').getByRole('heading', { level: 3 });
      await expect(destacado).not.toHaveText('');
      while (await destacado.textContent() === PROYECTOS.WG.titulo) await page.getByRole('button', { name: 'Enséñame otro' }).click();
      for (const titulo of [PROYECTOS['2SM'].titulo, PROYECTOS.PG.titulo]) {   // uno es el destacado y el otro una tendencia
        await corazon(page, titulo).click();
        const botones = await abanico(page, titulo);
        await expect(botones).toHaveCount(5);
        await botones.evaluateAll(bs => Promise.all(bs.flatMap(b => b.getAnimations().map(a => a.finished))).then(() => null));
        const fuera = await botones.evaluateAll(bs => {
          const caja = bs[0].closest('article, [role="article"]').getBoundingClientRect();   // tarjeta (article, D-48) o destacado
          return bs.filter(b => {
            const r = b.getBoundingClientRect();
            // 1 px de margen: "Me encanta" va en la fila del corazón, que es la última de la tarjeta (D-48), y queda al ras
            return r.left < caja.left - 1 || r.right > caja.right + 1 || r.top < caja.top - 1 || r.bottom > caja.bottom + 1 || r.left < 0 || r.right > innerWidth;
          }).map(b => b.getAttribute('aria-label'));
        });
        expect(fuera, `${titulo}: botones fuera de la tarjeta o de la pantalla`).toEqual([]);
        for (const [w, h] of await botones.evaluateAll(bs => bs.map(b => [b.offsetWidth, b.offsetHeight]))) {
          expect(w).toBeGreaterThanOrEqual(44);
          expect(h).toBeGreaterThanOrEqual(44);
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'sin scroll horizontal').toBe(true);
        await page.keyboard.press('Escape');
      }
    });
  }

  test('sin "reducir movimiento", el abanico y el meneo del corazón están animados', async ({ page }) => {
    await page.goto('.');
    const titulo = PROYECTOS['2SM'].titulo;
    await corazon(page, titulo).click();
    for (const nombre of await (await abanico(page, titulo)).evaluateAll(bs => bs.map(b => getComputedStyle(b).animationName))) expect(nombre).not.toBe('none');
    await reaccion(page, titulo, 'Me gusta').click();
    await expect(corazon(page, titulo)).toHaveAttribute('aria-busy', 'false');
    expect(await corazon(page, titulo).locator('svg').evaluate(s => getComputedStyle(s).animationName)).not.toBe('none');
    await pulsar(page, titulo, 'Me gusta');
    await expect(corazon(page, titulo)).toHaveAccessibleName('Reaccionar');
  });
});

test.describe('corazón con "reducir movimiento"', () => {
  test.use({ storageState: SESION, reducedMotion: 'reduce' });

  test('el abanico aparece sin animación y el corazón no se menea', async ({ page }) => {
    await page.goto('.');
    const titulo = PROYECTOS['2SM'].titulo;
    await corazon(page, titulo).click();
    const botones = await abanico(page, titulo);
    for (const b of await botones.all()) await expect(b).toBeVisible();
    expect(await botones.evaluateAll(bs => bs.map(b => getComputedStyle(b).animationName))).toEqual(Array(5).fill('none'));
    await reaccion(page, titulo, 'Me gusta').click();
    await expect(corazon(page, titulo)).toHaveAttribute('aria-busy', 'false');
    await expect(corazon(page, titulo)).toHaveAccessibleName('Tu reacción: Me gusta');
    expect(await corazon(page, titulo).locator('svg').evaluate(s => getComputedStyle(s).animationName)).toBe('none');
    await pulsar(page, titulo, 'Me gusta');
    await expect(corazon(page, titulo)).toHaveAccessibleName('Reaccionar');
  });
});
