// Reacciones con la sesión guardada por preparar.setup.js: añadir, cambiar (una por proyecto, D-NEW), quitar, persistencia, el propio proyecto y las
// reglas de la API (D-01). Las pruebas dejan las reacciones a cero al terminar.
import { test, expect } from '@playwright/test';
import { SESION } from '../playwright.config.js';
import { ALUMNA, PROYECTOS, REACCIONES, tarjeta } from './datos.js';

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
    for (const nombre of REACCIONES) await expect(propia.getByRole('button', { name: nombre })).toBeDisabled();
    const ajena = tarjeta(page, PROYECTOS['2SM'].titulo);
    await expect(ajena.getByText('Es tu proyecto')).toHaveCount(0);
    for (const nombre of REACCIONES) await expect(ajena.getByRole('button', { name: nombre })).toBeEnabled();
  });

  test('una reacción por proyecto: otra la sustituye, se guarda en el servidor, la portada suma y al repetir se quita', async ({ page, request }) => {
    await page.goto('galeria');
    const megusta = () => tarjeta(page, PROYECTOS['2SM'].titulo).getByRole('button', { name: 'Me gusta' });
    const fuego = () => tarjeta(page, PROYECTOS['2SM'].titulo).getByRole('button', { name: 'Fuego' });
    const otra = () => tarjeta(page, PROYECTOS.PG.titulo).getByRole('button', { name: 'Me gusta' });
    await expect(megusta()).toHaveText('');
    await expect(megusta()).toHaveAttribute('aria-pressed', 'false');
    await megusta().click();
    await expect(megusta()).toHaveAttribute('aria-pressed', 'true');
    await expect(megusta()).toHaveText('1');
    // otra reacción en el mismo proyecto sustituye a la anterior (D-NEW)
    await fuego().click();
    await expect(fuego()).toHaveAttribute('aria-pressed', 'true');
    await expect(fuego()).toHaveText('1');
    await expect(megusta()).toHaveAttribute('aria-pressed', 'false');
    await expect(megusta()).toHaveText('');

    // persiste al recargar y la API lo cuenta (con "mias" para esta sesión)
    await page.reload();
    await expect(fuego()).toHaveAttribute('aria-pressed', 'true');
    await expect(fuego()).toHaveText('1');
    await expect(megusta()).toHaveAttribute('aria-pressed', 'false');
    const api = await (await request.get('api/proyectos')).json();
    const p = api.proyectos.find(x => x.id === PROYECTOS['2SM'].id);
    expect(p.reacciones).toMatchObject({ '👏': 0, '🔥': 1 });
    expect(p.mias).toEqual(['🔥']);

    // una en otro proyecto: la portada suma las dos en la cifra
    await otra().click();
    await expect(otra()).toHaveAttribute('aria-pressed', 'true');
    await page.goto('.');
    await page.locator('dl').scrollIntoViewIfNeeded();
    await expect(page.locator('dl dd').nth(2)).toHaveText('2');

    // repetir la misma la quita
    await page.goto('galeria');
    await fuego().click();
    await expect(fuego()).toHaveAttribute('aria-pressed', 'false');
    await expect(fuego()).toHaveText('');
    await otra().click();
    await expect(otra()).toHaveAttribute('aria-pressed', 'false');
    await expect(otra()).toHaveText('');
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
