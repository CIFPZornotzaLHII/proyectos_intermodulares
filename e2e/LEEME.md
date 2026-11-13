# Pruebas de extremo a extremo (Playwright en Docker)

Prueban la web **tal como se despliega**: proxy nginx del 80 → nginx de la web → API Node, con los proyectos de
ejemplo del repo y las cuentas de `apps/proyectos/alumnos.ejemplo.csv`. Un Chromium real, en escritorio y en móvil
(Pixel 7). No sustituyen a los tests unitarios de `apps/proyectos/web/test/` (vitest): los complementan.

## Cómo se lanzan

```bash
# 1) la pila, desde la raíz del repo (necesita apps/proyectos/.env; cópialo de .env.ejemplo y pon claves)
docker compose up -d --build --wait

# 2) las pruebas (construye la imagen la primera vez; después solo si cambia package.json)
docker compose -f e2e/docker-compose.yml run --rm --build e2e

# solo un fichero y solo escritorio (en Docker siempre sin ventana)
docker compose -f e2e/docker-compose.yml run --rm e2e npx playwright test tests/galeria.spec.js --project=escritorio
```

Resultados en `e2e/salida/` (ignorada por git):

| Carpeta | Qué hay |
|---|---|
| `informe/` | informe HTML de Playwright: `npx playwright show-report e2e/salida/informe` (o abre `index.html`) |
| `capturas/` | una captura a página completa de cada página, `escritorio-*.png` y `movil-*.png` |
| `resultados/` | capturas y trazas de las pruebas que fallan (`npx playwright show-trace <fichero>.zip`) |
| `sesion-alumna.json` | la cookie de sesión de la alumna de prueba, guardada por `preparar.setup.js` |

El contenedor se une a la red `pi_default` y usa `http://proxy/proyectos/` como un navegador más. Lee `CLAVE_ADMIN`
de `apps/proyectos/.env` para importar las cuentas y vaciar las reacciones antes de empezar. Si quieres lanzarlas
sin Docker (con `npm install` en esta carpeta y `npx playwright install chromium`): `BASE_URL=http://localhost/proyectos/
CLAVE_ADMIN=... npx playwright test`.

## Qué prueban

| Fichero | Qué cubre |
|---|---|
| `preparar.setup.js` | la pila responde y no hay proyectos inválidos; importa las cuentas de ejemplo; deja cero reacciones; guarda una sesión |
| `portada.spec.js` | h1, cifras (3 proyectos, 7 alumnos, reacciones), destacado con su ciclo, tendencias, "Enséñame otro" sin recargar, enlaces y anclas |
| `galeria.spec.js` | las tres tarjetas (ciclo, equipo, etiquetas, vídeo o "Vídeo pendiente", enlaces), la etiqueta "Ejemplo", la portada entera en 16:9 sin caja ni velo (o las iniciales si no carga) con la insignia y el menú sobre la foto y el mismo alto por fila (también a 390 px), filtros con `?ciclo=`, buscador, sin sesión el corazón → login, landing |
| `reacciones.spec.js` | con sesión, con el corazón de la galería: cabecera, propio proyecto bloqueado, añadir, cambiar y quitar, persistencia, la portada suma; reglas de la API (401, 403, 400, 404) |
| `corazon.spec.js` | el corazón de la portada: sin sesión → login con `volver=/`; con sesión, "Es tu proyecto", añadir y quitar desde el abanico, persistencia, teclado, medidas a 390 y 1280 px (solo escritorio), animación y "reducir movimiento" |
| `sesion.spec.js` | formulario: error, entrada, vuelta a la página de origen, salir; `volver` externo ignorado (solo escritorio) |
| `rutas.spec.js` | redirecciones del proxy y de los nombres antiguos, SPA, landings y lo que no se sirve (`proyecto.json`, ocultos), estáticos, API |
| `idioma.spec.js` | ES → EU sin recargar, `lang`, `localStorage`, recarga, galería y login en euskera, vuelta a ES |
| `calidad.spec.js` | sin errores de consola ni peticiones rotas, un h1, `alt`, botones y enlaces con nombre, foco visible, tamaño de botones, `prefers-reduced-motion` |
| `capturas.spec.js` | capturas de cada página para revisarlas a ojo (no comprueban nada más) |

Los datos que esperan (títulos, equipos, cuentas) están en `tests/datos.js`: si cambian los ejemplos, cambia eso.

## Cosas que conviene saber

- **Límite de inicios de sesión.** La API admite 10 intentos por IP cada 10 minutos y cada ejecución gasta unos 5.
  Si `preparar` falla con 429: `docker compose restart proyectos-api` (el contador vive en memoria).
- **En serie.** `workers: 1`, porque las reacciones son estado compartido en `datos/reacciones.json`. Unos 9 minutos
  en total: la portada pinta WebGL por software dentro del contenedor y cada carga suya cuesta 8-10 s (por eso el
  límite por test es de 60 s).
- **Fallo conocido, marcado con `test.fail()`** en `rutas.spec.js`: una landing pedida sin la barra final
  (`/proyectos/p/WG/reservas-talleres`) redirige a `/p/WG/reservas-talleres/` sin el prefijo `/proyectos` y el proxy
  devuelve 404. Lo arregla `apps/proyectos/web/nginx.conf` (zona de despliegue: lo toca Mikel). Cuando pase, Playwright
  avisará de que la prueba "debía fallar y pasó": quita entonces el `test.fail()`.
- Google Fonts puede no cargar si el contenedor no tiene salida a internet; las pruebas lo ignoran.
