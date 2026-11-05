// Proxy, nginx de la web y API: redirecciones, SPA, landings del alumnado, ficheros que no se sirven y rutas de la API.
// Son peticiones HTTP directas (sin navegador) salvo la página 404 de la web.
import { test, expect } from '@playwright/test';
import { BASE_URL } from '../playwright.config.js';
import { CIFRAS, PROYECTOS } from './datos.js';

const origen = new URL(BASE_URL).origin;   // http://proxy (sin /proyectos/)

test.describe('proxy y rutas de la web', () => {
  test('la raíz y /proyectos redirigen a /proyectos/', async ({ request }) => {
    const destino = res => new URL(res.headers().location, origen).pathname;   // nginx manda la Location absoluta
    const raiz = await request.get(`${origen}/`, { maxRedirects: 0 });
    expect(raiz.status()).toBe(302);
    expect(destino(raiz)).toBe('/proyectos/');
    const sinBarra = await request.get(`${origen}/proyectos`, { maxRedirects: 0 });
    expect(sinBarra.status()).toBe(301);
    expect(destino(sinBarra)).toBe('/proyectos/');
    expect((await request.get(`${origen}/salud`)).ok()).toBeTruthy();
  });

  test('las rutas de la aplicación devuelven la SPA y los nombres antiguos redirigen', async ({ request }) => {
    for (const ruta of ['', 'galeria', 'entrar', 'galeria?ciclo=WG', 'lo-que-sea']) {
      const res = await request.get(ruta);
      expect(res.status(), ruta).toBe(200);
      expect(res.headers()['content-type']).toContain('text/html');
      expect(await res.text()).toContain('<div id="raiz">');
    }
    const antiguas = { 'proyectos.html': '/proyectos/galeria', 'login.html': '/proyectos/entrar' };
    for (const [vieja, nueva] of Object.entries(antiguas)) {
      const res = await request.get(vieja, { maxRedirects: 0 });
      expect(res.status(), vieja).toBe(301);
      expect(new URL(res.headers().location, origen).pathname).toBe(nueva);
    }
  });

  test('una ruta desconocida muestra la página 404 de la web con vuelta a la portada', async ({ page }) => {
    await page.goto('esto-no-existe');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('404');
    await expect(page.getByText('Esta página no existe.')).toBeVisible();
    await page.getByRole('link', { name: 'Ir a la portada' }).click();
    await expect(page).toHaveURL(/\/proyectos\/?$/);   // el router deja /proyectos sin barra al ir a "/"
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Proyectos intermodulares 26-27');
  });

  test('los recursos estáticos llegan con su tipo', async ({ request }) => {
    const logo = await request.get('img/logo.png');
    expect(logo.status()).toBe(200);
    expect(logo.headers()['content-type']).toBe('image/png');
    const favicon = await request.get('img/favicon.svg');
    expect(favicon.headers()['content-type']).toContain('image/svg+xml');
    expect((await request.get('img/portada-defecto.svg')).status()).toBe(200);
  });
});

test.describe('landings del alumnado (/proyectos/p/<ciclo>/<slug>/)', () => {
  test('se sirven con su portada; proyecto.json, los ficheros ocultos y el listado de carpetas no', async ({ request }) => {
    for (const p of Object.values(PROYECTOS)) {
      const landing = await request.get(`p/${p.id}/`);
      expect(landing.status(), p.id).toBe(200);
      expect(landing.headers()['content-type']).toContain('text/html');
      expect(await landing.text()).toContain(p.landing);
      const portada = await request.get(`p/${p.id}/portada.jpg`);
      expect(portada.status(), `${p.id}/portada.jpg`).toBe(200);
      expect(portada.headers()['content-type']).toBe('image/jpeg');
      expect((await request.get(`p/${p.id}/proyecto.json`)).status(), `${p.id}/proyecto.json`).toBe(404);
      expect((await request.get(`p/${p.id}/.gitkeep`)).status()).toBe(404);
    }
    expect((await request.get('p/WG/no-existe/')).status()).toBe(404);
    const listado = await request.get('p/');
    expect(listado.status(), 'sin listado de carpetas').toBeGreaterThanOrEqual(400);
  });

  test('sin la barra final acaba igualmente en la landing', async ({ request }) => {
    // Fallo conocido: el nginx de la web responde 301 a /p/WG/reservas-talleres/ SIN el prefijo /proyectos (su
    // nginx.conf no usa X-Forwarded-Prefix en el location /p/), así que el proxy devuelve 404. La web siempre enlaza
    // con barra final; solo afecta a URLs escritas a mano. Cuando se arregle, esta prueba pasará: quita el test.fail().
    test.fail();
    const res = await request.get(`p/${PROYECTOS.WG.id}`);
    expect(res.status()).toBe(200);
    expect(await res.text()).toContain(PROYECTOS.WG.landing);
  });
});

test.describe('API (/proyectos/api/)', () => {
  test('salud y lista de proyectos', async ({ request }) => {
    const salud = await (await request.get('api/salud')).json();
    expect(salud).toMatchObject({ ok: true, proyectos: CIFRAS.proyectos, invalidos: [] });
    expect(salud.emojis).toEqual(['👏', '💡', '🚀', '🔥', '❤️']);
    expect(salud.usuarios).toBeGreaterThan(0);

    const lista = await (await request.get('api/proyectos')).json();
    expect(lista.ciclos.map(c => c.codigo)).toEqual(['2SM', 'WG', 'PG']);
    expect(lista.ciclos.map(c => c.nombre)).toEqual(['SMR', 'DAW', 'DAM']);
    expect(lista.proyectos.map(p => p.id).sort()).toEqual(Object.values(PROYECTOS).map(p => p.id).sort());
    for (const p of lista.proyectos) {
      expect(p.url, p.id).toBe(`p/${p.id}/`);
      expect(p.portada).toBe(`p/${p.id}/portada.jpg`);
      expect(p.grado).toMatch(/^Grado (medio|superior)$/);
      expect(Object.keys(p.reacciones)).toEqual(salud.emojis);
      expect(p.mias).toEqual([]);          // sin sesión
      expect(p.equipo.length).toBeGreaterThan(0);
      expect(p.autores.length).toBe(p.equipo.length);
    }
    expect(lista.proyectos.find(p => p.ciclo === '2SM').grado).toBe('Grado medio');
    const filtrada = await (await request.get('api/proyectos?ciclo=WG')).json();
    expect(filtrada.proyectos.map(p => p.id)).toEqual([PROYECTOS.WG.id]);
    expect((await (await request.get('api/proyectos?ciclo=XX')).json()).proyectos).toEqual([]);
  });

  test('sin sesión no hay sesión, la administración exige su clave y lo demás es 404', async ({ request }) => {
    expect((await request.get('api/sesion')).status()).toBe(401);
    expect((await request.get('api/admin/usuarios')).status()).toBe(401);
    expect((await request.get('api/admin/usuarios', { headers: { 'X-Clave-Admin': 'incorrecta' } })).status()).toBe(401);
    expect((await request.get('api/admin/reacciones')).status()).toBe(401);
    expect((await request.delete('api/admin/usuarios?confirmar=si')).status()).toBe(401);
    expect((await request.get('api/no-existe')).status()).toBe(404);
    // cuerpo que no es JSON (un Buffer se envía tal cual; una cadena la serializaría Playwright). Cuenta como intento.
    const malo = await request.post('api/sesion', { headers: { 'Content-Type': 'application/json' }, data: Buffer.from('{roto') });
    expect(malo.status()).toBe(400);
    expect((await request.get('api/salud')).headers()['cache-control']).toBe('no-store');
  });
});
