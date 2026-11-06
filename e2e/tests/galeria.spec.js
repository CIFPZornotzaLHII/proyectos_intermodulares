// Galería (/proyectos/galeria): tarjetas, filtro por ciclo en la URL, buscador y la invitación a entrar
import { test, expect } from '@playwright/test';
import { PROYECTOS, tarjeta } from './datos.js';

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
      await expect(t.getByText(p.equipo)).toBeVisible();
      await expect(t.getByText(p.etiqueta, { exact: true })).toBeVisible();
      await expect(t.getByRole('link', { name: 'Ver proyecto', exact: true })).toHaveCount(0);   // las acciones van en el menú (D-NEW)
      await t.getByRole('button', { name: 'Más opciones' }).click();
      await expect(t.getByRole('link', { name: 'Ver proyecto', exact: true })).toHaveAttribute('href', `/proyectos/p/${p.id}/`);
      await expect(t.getByRole('link', { name: `Ver proyecto: ${p.titulo}` })).toHaveAttribute('href', `/proyectos/p/${p.id}/`);
      await expect(t.getByRole('link', { name: 'Código' })).toHaveAttribute('target', '_blank');
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

  test('filtra por ciclo (y la URL se puede compartir) y busca por título, equipo o etiqueta', async ({ page }) => {
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
    await expect(buscador).toHaveAccessibleName('Buscar por título, equipo o etiqueta');
    await buscador.fill('laravel');                 // etiqueta
    await expect(page.getByRole('article')).toHaveCount(1);
    await expect(tarjeta(page, PROYECTOS.WG.titulo)).toBeVisible();
    await buscador.fill('OIER');                    // equipo, sin distinguir mayúsculas
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

  test('sin sesión invita a entrar y pulsar una reacción lleva al inicio de sesión', async ({ page }) => {
    const invitaciones = page.getByRole('link', { name: 'Inicia sesión para reaccionar' });
    await expect(invitaciones).toHaveCount(3);
    await expect(invitaciones.first()).toHaveAttribute('href', '/proyectos/entrar?volver=/galeria');
    const megusta = tarjeta(page, PROYECTOS['2SM'].titulo).getByRole('button', { name: 'Me gusta' });
    await expect(megusta).toBeEnabled();
    await expect(megusta).toHaveText('');
    await megusta.click();
    await expect(page).toHaveURL(/\/proyectos\/entrar\?volver=\/galeria$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Entra para reaccionar a los proyectos');
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
});
