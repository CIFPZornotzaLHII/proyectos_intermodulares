import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, devices } from '@playwright/test';

// Pruebas de extremo a extremo contra la pila completa (proxy + web + API) levantada con Docker.
// BASE_URL: dónde está la web, con la barra final. Dentro del contenedor de pruebas (docker-compose.yml de esta
// carpeta) es http://proxy/proyectos/; desde tu PC, http://localhost/proyectos/. Las pruebas usan rutas relativas
// a esa base ('galeria', 'api/salud'…), nunca con barra inicial.
const AQUI = path.dirname(fileURLToPath(import.meta.url));
export const BASE_URL = (process.env.BASE_URL || 'http://localhost/proyectos/').replace(/\/?$/, '/');
export const SALIDA = path.resolve(AQUI, process.env.SALIDA || 'salida');   // informe, capturas, trazas y sesión guardada
export const SESION = path.join(SALIDA, 'sesion-alumna.json');             // cookie de la alumna de prueba (la crea preparar.setup.js)

export default defineConfig({
  testDir: './tests',
  outputDir: path.join(SALIDA, 'resultados'),
  fullyParallel: false,
  workers: 1,               // las reacciones cambian datos compartidos (reacciones.json): las pruebas van en serie
  retries: 0,
  // La portada pinta WebGL (LiquidEther) por software en el contenedor: cada carga suya cuesta 8-10 s, y los tests
  // que la visitan varias veces pasan de los 30 s por defecto
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [['list'], ['html', { outputFolder: path.join(SALIDA, 'informe'), open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    locale: 'es-ES',
    timezoneId: 'Europe/Madrid',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    // 1) comprueba la pila, importa las cuentas de ejemplo, vacía las reacciones y guarda una sesión
    { name: 'preparar', testMatch: /preparar\.setup\.js/ },
    // 2) todo en un Chrome de escritorio
    { name: 'escritorio', use: { ...devices['Desktop Chrome'] }, dependencies: ['preparar'] },
    // 3) lo mismo en un móvil, menos el inicio de sesión por formulario (la API limita a 10 intentos por IP cada 10 min)
    { name: 'movil', use: { ...devices['Pixel 7'] }, dependencies: ['preparar'], testIgnore: /sesion\.spec\.js/ },
  ],
});
