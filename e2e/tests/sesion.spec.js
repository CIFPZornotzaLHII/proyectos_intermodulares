// Inicio y cierre de sesión por el formulario (solo en escritorio: cada intento cuenta para el límite de la API).
import { test, expect } from '@playwright/test';
import { SESION } from '../playwright.config.js';
import { ALUMNA } from './datos.js';

test('con credenciales malas avisa; con buenas entra, vuelve a donde estaba y puede salir', async ({ page }) => {
  await page.goto('.');
  const entrar = page.getByRole('banner').getByRole('link', { name: 'Iniciar sesión' });
  await expect(entrar).toHaveAttribute('href', '/proyectos/entrar?volver=%2F');
  await entrar.click();
  await expect(page).toHaveURL(/\/proyectos\/entrar\?volver=%2F$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Entra para reaccionar a los proyectos');
  await expect(page.getByText('Solo para alumnado y profesorado')).toBeVisible();
  await expect(page.getByText('No puedes reaccionar a tu propio proyecto.')).toBeVisible();

  const usuario = page.getByLabel('Usuario');
  const contrasena = page.getByLabel('Contraseña');
  const boton = page.getByRole('button', { name: 'Entrar', exact: true });
  await expect(usuario).toHaveAttribute('autocomplete', 'username');
  await expect(contrasena).toHaveAttribute('type', 'password');

  await usuario.fill(ALUMNA.login);
  await contrasena.fill('incorrecta');
  await boton.click();
  await expect(page.getByRole('alert')).toHaveText('Usuario o contraseña incorrectos.');
  await expect(page).toHaveURL(/\/proyectos\/entrar/);

  await contrasena.fill(ALUMNA.contrasena);
  await boton.click();
  await expect(page).toHaveURL(/\/proyectos\/?$/);         // volver=/ → portada (el router deja /proyectos sin barra)
  await expect(page.getByRole('banner').getByText(ALUMNA.nombre)).toBeVisible();
  expect((await page.request.get('api/sesion')).status()).toBe(200);

  await page.getByRole('button', { name: 'Salir' }).click();
  await expect(page.getByRole('banner').getByRole('link', { name: 'Iniciar sesión' })).toBeVisible();
  expect((await page.request.get('api/sesion')).status()).toBe(401);
  await page.reload();
  await expect(page.getByRole('banner').getByRole('link', { name: 'Iniciar sesión' })).toBeVisible();
});

test.describe('con sesión ya iniciada', () => {
  test.use({ storageState: SESION });

  test('/entrar redirige a la vuelta pedida y una vuelta externa se ignora', async ({ page }) => {
    await page.goto('entrar?volver=//malo.example');
    await expect(page).toHaveURL(/\/proyectos\/galeria$/);
    await page.goto('entrar?volver=https://malo.example/');
    await expect(page).toHaveURL(/\/proyectos\/galeria$/);
    await page.goto('entrar?volver=/galeria?ciclo=WG');
    await expect(page).toHaveURL(/\/proyectos\/galeria\?ciclo=WG$/);
    await page.goto('entrar');
    await expect(page).toHaveURL(/\/proyectos\/galeria$/);
  });
});
