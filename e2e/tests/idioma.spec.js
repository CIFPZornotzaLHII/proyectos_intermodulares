// Selector ES/EU de la cabecera: cambia sin recargar, se guarda en el navegador y afecta a todas las páginas
import { test, expect } from '@playwright/test';

test('cambia a euskera sin recargar, lo recuerda tras recargar y vuelve a castellano', async ({ page }) => {
  await page.goto('.');
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  const idioma = page.getByRole('group', { name: 'Idioma' });
  await expect(idioma.getByRole('button', { name: 'ES' })).toHaveAttribute('aria-pressed', 'true');
  await expect(idioma.getByRole('button', { name: 'EU' })).toHaveAttribute('aria-pressed', 'false');

  await idioma.getByRole('button', { name: 'EU' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'eu');
  await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName('Proiektu intermodularrak 26-27');
  await expect(page.getByRole('heading', { level: 2, name: 'Proiektu nabarmendua' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Joerak' })).toBeVisible();
  await expect(page.locator('dl dt')).toHaveText(['Proiektuak', 'Ikasleak', 'Erreakzioak']);
  await expect(page.getByRole('button', { name: 'Erakutsi beste bat' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('pi_idioma'))).toBe('eu');

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'eu');
  await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName('Proiektu intermodularrak 26-27');

  // la galería y el login también salen en euskera
  await page.getByRole('banner').getByRole('link', { name: 'Proiektuak', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Proiektu guztiak');
  await expect(page.getByRole('group', { name: 'Zikloka filtratu' }).getByRole('button', { name: 'Guztiak · 3' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Hasi saioa erreakzionatzeko' }).first()).toBeVisible();
  await page.getByRole('banner').getByRole('link', { name: 'Saioa hasi' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sartu eta erreakzionatu');
  await expect(page.getByLabel('Erabiltzailea')).toBeVisible();

  await page.getByRole('group', { name: 'Hizkuntza' }).getByRole('button', { name: 'ES' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Entra para reaccionar');
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  expect(await page.evaluate(() => localStorage.getItem('pi_idioma'))).toBe('es');
});
