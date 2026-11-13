// Capturas de pantalla de cada página, en escritorio y en móvil, para revisarlas a ojo:
// e2e/salida/capturas/<proyecto>-<pagina>.png
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { SALIDA, SESION } from '../playwright.config.js';
import { PROYECTOS, recorrer, tarjeta } from './datos.js';

const CAPTURAS = path.join(SALIDA, 'capturas');

async function capturar(page, info, nombre) {
  await page.waitForLoadState('networkidle');
  await recorrer(page);                   // dispara las apariciones al hacer scroll
  await page.waitForTimeout(1500);        // BlurText, CountUp y las animaciones de entrada
  await page.screenshot({ path: path.join(CAPTURAS, `${info.project.name}-${nombre}.png`), fullPage: true });
}

const PAGINAS = [
  ['portada', '.'],
  ['galeria', 'galeria'],
  ['galeria-filtrada-daw', 'galeria?ciclo=WG'],
  ['entrar', 'entrar'],
  ['landing-wg', `p/${PROYECTOS.WG.id}/`],
  ['landing-2sm', `p/${PROYECTOS['2SM'].id}/`],
  ['landing-pg', `p/${PROYECTOS.PG.id}/`],
  ['404', 'no-existe'],
];
for (const [nombre, ruta] of PAGINAS) {
  test(`captura: ${nombre}`, async ({ page }, info) => {
    await page.goto(ruta);
    await expect(page.getByRole('heading', { level: 1 })).toBeAttached();
    await capturar(page, info, nombre);
  });
}

test('captura: formulario de entrada relleno', async ({ page }, info) => {
  await page.goto('entrar');
  await page.getByLabel('Usuario').fill('nadie');
  await page.getByLabel('Contraseña').fill('nada');
  // no se envía: enviar gastaría un intento del límite de la API
  await capturar(page, info, 'entrar-relleno');
});

test.describe('con sesión', () => {
  test.use({ storageState: SESION });
  test('captura: galería con sesión y una reacción puesta', async ({ page }, info) => {
    await page.goto('galeria');
    const t = tarjeta(page, PROYECTOS['2SM'].titulo);
    const corazon = t.getByRole('button', { name: /^(Reaccionar|Tu reacción: .+)$/ });
    await corazon.click();
    await t.getByRole('button', { name: 'Me gusta', exact: true }).click();
    await expect(corazon).toHaveAccessibleName('Tu reacción: Me gusta');
    await expect(corazon).toHaveAttribute('aria-busy', 'false');
    await capturar(page, info, 'galeria-con-sesion');
    await corazon.click();                // deja las reacciones como estaban
    await t.getByRole('button', { name: 'Me gusta', exact: true }).click();
    await expect(corazon).toHaveAccessibleName('Reaccionar');
  });
});
