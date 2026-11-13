// Reacciones en la galería con la sesión guardada por preparar.setup.js, con el corazón de cada tarjeta (D-47, D-48):
// añadir, cambiar (una por proyecto, D-46), quitar, persistencia, el propio proyecto y las reglas de la API (D-01).
// Las pruebas dejan las reacciones a cero al terminar.
import { test, expect } from '@playwright/test';
import { SESION } from '../playwright.config.js';
import { ALUMNA, PROYECTOS, tarjeta } from './datos.js';

const corazon = (page, titulo) => tarjeta(page, titulo).getByRole('button', { name: /^(Reaccionar|Tu reacción: .+)$/ });
const total = (page, titulo) => tarjeta(page, titulo).getByText(/^\d+ reacciones$/);
// Elige (o quita) una reacción con el abanico y espera a que responda el servidor
async function pulsar(page, titulo, nombre) {
  await corazon(page, titulo).click();
  await tarjeta(page, titulo).getByRole('button', { name: nombre, exact: true }).click();
  await expect(corazon(page, titulo)).toHaveAttribute('aria-busy', 'false');
}

test.describe('reacciones con sesión', () => {
  test.use({ storageState: SESION });

  test('la cabecera muestra a la alumna y su propio proyecto no admite reacciones', async ({ page }) => {
    await page.goto('galeria');
    const cabecera = page.getByRole('banner');
    await expect(cabecera.getByText(ALUMNA.nombre)).toBeVisible();
    await expect(cabecera.getByText(ALUMNA.ciclo, { exact: true })).toBeVisible();
    await expect(cabecera.getByRole('button', { name: 'Salir' })).toBeVisible();
    await expect(cabecera.getByRole('link', { name: 'Iniciar sesión' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Inicia sesión para reaccionar' })).toHaveCount(0);

    const propia = tarjeta(page, PROYECTOS.WG.titulo);
    await expect(propia.getByText('Es tu proyecto')).toBeVisible();
    await expect(corazon(page, PROYECTOS.WG.titulo)).toHaveCount(0);
    const ajena = tarjeta(page, PROYECTOS['2SM'].titulo);
    await expect(ajena.getByText('Es tu proyecto')).toHaveCount(0);
    await expect(corazon(page, PROYECTOS['2SM'].titulo)).toBeEnabled();
  });

  test('una reacción por proyecto: otra la sustituye, se guarda en el servidor, la portada suma y al repetir se quita', async ({ page, request }) => {
    await page.goto('galeria');
    const red = PROYECTOS['2SM'].titulo, tpv = PROYECTOS.PG.titulo;
    await expect(corazon(page, red)).toHaveAccessibleName('Reaccionar');
    await expect(total(page, red)).toHaveText('0 reacciones');
    await pulsar(page, red, 'Me gusta');
    await expect(corazon(page, red)).toHaveAccessibleName('Tu reacción: Me gusta');
    await expect(total(page, red)).toHaveText('1 reacciones');
    // otra reacción en el mismo proyecto sustituye a la anterior (D-46)
    await pulsar(page, red, 'Fuego');
    await expect(corazon(page, red)).toHaveAccessibleName('Tu reacción: Fuego');
    await expect(total(page, red)).toHaveText('1 reacciones');

    // persiste al recargar y la API lo cuenta (con "mias" para esta sesión)
    await page.reload();
    await expect(corazon(page, red)).toHaveAccessibleName('Tu reacción: Fuego');
    const api = await (await request.get('api/proyectos')).json();
    const p = api.proyectos.find(x => x.id === PROYECTOS['2SM'].id);
    expect(p.reacciones).toMatchObject({ '👏': 0, '🔥': 1 });
    expect(p.mias).toEqual(['🔥']);

    // una en otro proyecto: la portada suma las dos en la cifra
    await pulsar(page, tpv, 'Me gusta');
    await expect(corazon(page, tpv)).toHaveAccessibleName('Tu reacción: Me gusta');
    await page.goto('.');
    await page.locator('dl').scrollIntoViewIfNeeded();
    await expect(page.locator('dl dd').nth(2)).toHaveText('2');

    // repetir la misma la quita
    await page.goto('galeria');
    await pulsar(page, red, 'Fuego');
    await expect(corazon(page, red)).toHaveAccessibleName('Reaccionar');
    await pulsar(page, tpv, 'Me gusta');
    await expect(corazon(page, tpv)).toHaveAccessibleName('Reaccionar');
    const despues = await (await request.get('api/proyectos')).json();
    for (const id of [PROYECTOS['2SM'].id, PROYECTOS.PG.id])
      expect(Object.values(despues.proyectos.find(x => x.id === id).reacciones)).toEqual([0, 0, 0, 0, 0]);
  });

  test('la API aplica las reglas: nunca el propio proyecto, solo emojis permitidos y proyectos existentes', async ({ request }) => {
    const propio = await request.post('api/reacciones', { data: { proyecto: PROYECTOS.WG.id, emoji: '🔥' } });
    expect(propio.status()).toBe(403);
    const emoji = await request.post('api/reacciones', { data: { proyecto: PROYECTOS.PG.id, emoji: '🍕' } });
    expect(emoji.status()).toBe(400);
    const inexistente = await request.post('api/reacciones', { data: { proyecto: 'PG/no-existe', emoji: '🔥' } });
    expect(inexistente.status()).toBe(404);
    const roto = await request.post('api/reacciones', { headers: { 'Content-Type': 'application/json' }, data: Buffer.from('{no es json') });
    expect(roto.status()).toBe(400);
    // nada de lo anterior ha dejado reacciones
    const salud = await (await request.get('api/salud')).json();
    expect(salud.reacciones).toBe(0);
  });
});

test.describe('reacciones sin sesión', () => {
  test('la API exige sesión para reaccionar', async ({ request }) => {
    const r = await request.post('api/reacciones', { data: { proyecto: PROYECTOS.PG.id, emoji: '🔥' } });
    expect(r.status()).toBe(401);
  });
});
