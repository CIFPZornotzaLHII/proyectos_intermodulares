// Se ejecuta antes que el resto (proyecto "preparar" de playwright.config.js): comprueba que la pila responde, deja
// las cuentas de ejemplo y cero reacciones (estado conocido) y guarda la sesión de la alumna de prueba para que
// las demás pruebas no gasten intentos de inicio de sesión (la API admite 10 por IP cada 10 minutos).
import fs from 'node:fs';
import path from 'node:path';
import { test as preparar, expect } from '@playwright/test';
import { SESION } from '../playwright.config.js';
import { ALUMNA, CIFRAS } from './datos.js';

const CLAVE_ADMIN = process.env.CLAVE_ADMIN || '';
const CSV = process.env.CSV_ALUMNOS || path.resolve(path.dirname(SESION), '../../apps/proyectos/alumnos.ejemplo.csv');

preparar('la pila responde, las cuentas de prueba existen y no hay reacciones', async ({ request }) => {
  const salud = await request.get('api/salud');
  expect(salud.ok(), 'GET api/salud (¿está levantada la pila? docker compose up -d --build --wait)').toBeTruthy();
  const s = await salud.json();
  expect(s.ok).toBe(true);
  expect(s.invalidos, 'proyectos con proyecto.json inválido').toEqual([]);
  expect(s.proyectos).toBe(CIFRAS.proyectos);

  if (CLAVE_ADMIN) {
    const admin = { 'X-Clave-Admin': CLAVE_ADMIN };
    const importar = await request.post('api/admin/usuarios/importar', { headers: { ...admin, 'Content-Type': 'text/csv' }, data: fs.readFileSync(CSV, 'utf8') });
    expect(importar.status(), 'importar cuentas de ejemplo (¿CLAVE_ADMIN correcta?)').toBe(200);
    expect((await importar.json()).errores).toEqual([]);
    const vaciar = await request.delete('api/admin/reacciones', { headers: admin });
    expect(vaciar.ok()).toBeTruthy();
  } else {
    console.warn('Sin CLAVE_ADMIN: no se importan las cuentas de ejemplo ni se vacían las reacciones; tienen que estar ya.');
  }

  // Una sesión por la API (cuenta como un intento de inicio de sesión) guardada para las demás pruebas
  const sesion = await request.post('api/sesion', { data: { usuario: ALUMNA.login, contrasena: ALUMNA.contrasena } });
  expect(sesion.status(), 'sesión de la alumna de prueba (si da 429, reinicia la API: docker compose restart proyectos-api)').toBe(200);
  expect(await sesion.json()).toEqual({ login: ALUMNA.login, nombre: ALUMNA.nombre, ciclo: ALUMNA.ciclo });
  fs.mkdirSync(path.dirname(SESION), { recursive: true });
  await request.storageState({ path: SESION });
});
