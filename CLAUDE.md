# Instrucciones del proyecto para los agentes

Lo leen Claude Code y los agentes de la fábrica (`factory-boilerplate`, D-12). Las secciones siguen su plantilla; si
una no aplica, dice "No aplica". Todo en castellano.

## Qué es este proyecto

**proyectos_intermodulares**: la web donde el alumnado de 2.º de SMR (`2SM`), DAW (`WG`) y DAM (`PG`) del CIFP
Zornotza LHII publica su proyecto intermodular (curso 2026-27) como tarjeta y landing, y reacciona a los de los demás
grupos; su API; y el servidor que la sirve (Ubuntu en IsardVDI, Docker). Web en React 19 + Vite 6 + Tailwind 4 +
react-router, con componentes animados de React Bits; API en Node sin dependencias; proyectos del alumnado como
carpetas que llegan por pull request. Convenciones copiadas de `mikeldalmauc/server_isard_som`: scripts idempotentes,
`.env.ejemplo` con `__ALEATORIA__`, despliegue por el bastión de Isard. Qué se construye y qué no: `docs/SPEC.md`;
decisiones `D-n` en `docs/DECISIONS.md` (la más reciente arriba y **manda sobre el SPEC**).

## Rutas importantes

- `apps/proyectos/web/`: la web. `src/paginas/` (`Portada`, `Galeria`, `Entrar`), `src/componentes/` (cabecera, pie,
  llamada, botón, iconos, `Tarjeta.jsx` con la tarjeta, el destacado y las reacciones), `src/i18n.jsx` (textos ES/EU,
  `TEXTOS`), `src/api.js` (llamadas a la API; `BASE` = `import.meta.env.BASE_URL`), `src/sesion.jsx` (sesión
  compartida), `src/useProyectos.js`, `src/datos.js` (ordenar por votos, azar, filtros, `REACCIONES`), `src/index.css`
  (tema Tailwind en `@theme`: paleta y tipografías). `vite.config.js` fija la base `/proyectos/` (D-06) y sirve las
  landings en desarrollo. Tests en `test/` (vitest + Testing Library, API falsa). `Dockerfile` compila y sirve con
  `nginx.conf` (SPA, `/p/` landings, `/api/`).
- `apps/proyectos/web/src/reactbits/`: componentes de React Bits copiados tal cual (MIT + Commons Clause,
  `LICENSE.md`). **No se modifican ni se sustituyen por versiones propias** (D-07): si falta uno, se copia de
  `src/tailwind/` del repo de React Bits y se adapta por props.
- `apps/proyectos/api/server.js`: la API. Lee `proyectos/<ciclo>/<slug>/proyecto.json` (no hay BD de proyectos);
  usuarios y reacciones en JSON en `datos/`. Sesión = cookie HMAC con `CLAVE_SESION`. `CICLOS` traduce la carpeta a
  ciclo y grado. `admin.sh` habla con `/api/admin/*`.
- `proyectos/`: contenido del alumnado. **Nunca** se editan sus carpetas desde aquí salvo que lo pida Mikel;
  `_plantilla/` es lo que copian; `LEEME.md` es su guía. `2SM/`, `WG/` y `PG/` traen un ejemplo cada una.
- `scripts/validar-proyectos.js`: las reglas de las PR. Si cambia una regla, cambia también `proyectos/LEEME.md`.
- `proxy/`, `servidor/`, `.github/workflows/`: proxy nginx del 80, instalación y despliegue (`desplegar.sh`
  comprueba `/proyectos/`, `/proyectos/galeria`, `/proyectos/entrar` y `/proyectos/api/salud`), Actions
  (`validar-pr.yml`, `desplegar.yml`).
- `factory/`: configuración (`config.json`), `backlog.md`, métricas; `factory/jobs/` es estado de ejecución (ignorado).
  `.claude/agents/` y `.claude/skills/` son la fábrica; su documentación completa está en
  `factory-doc/DOCUMENTACION.md` del repo `mikeldalmauc/factory-boilerplate`.

## Preparar un checkout nuevo

```bash
npm --prefix apps/proyectos/web install
```

No hace falta nada más: la API no tiene dependencias y los proyectos de ejemplo están en el repo.

## Servidor de desarrollo

Dos procesos. La API, en un puerto propio y con datos temporales; la web, en el puerto que te den (falla si está
ocupado) y apuntando a esa API:

```bash
CLAVE_SESION=x CLAVE_ADMIN=y DATOS=/tmp/pi-<puerto> PROYECTOS=./proyectos PUERTO=<puerto-api> node apps/proyectos/api/server.js &
API_URL=http://localhost:<puerto-api> npm --prefix apps/proyectos/web run dev -- --port <puerto> --strictPort
# http://localhost:<puerto>/proyectos/   ·   cuentas de prueba: bash apps/proyectos/admin.sh importar apps/proyectos/alumnos.ejemplo.csv (con API en :8080) o curl a /api/admin/usuarios/importar con X-Clave-Admin
```

Con Docker (como en producción): `cp apps/proyectos/.env.ejemplo apps/proyectos/.env`, `docker compose up -d --build`
y `http://localhost/proyectos/`.

## Validación

- Tests de la web: `npm --prefix apps/proyectos/web test`
- Build: `npm --prefix apps/proyectos/web run build`
- Validador de proyectos (lo mismo que corre en cada PR): `node scripts/validar-proyectos.js proyectos/WG/reservas-talleres`
- API: arrancarla como arriba y `curl -s localhost:<puerto-api>/api/salud` (`invalidos` debe ser `[]`).
- Lint y formato: No aplica (no hay eslint ni prettier configurados; no añadirlos sin preguntar).

## Convenciones

- Castellano en código, comentarios, commits y docs; euskera solo en los textos de la web (`TEXTOS.eu`), pendientes de
  revisión por un hablante.
- Commits: una línea, en imperativo, sin prefijos (`Añade el filtro por etiqueta a la galería (D-13)`). Autor Mikel
  Dalmau `<mikeldalmauc@gmail.com>`. Ningún identificador de modelo en commits ni en el código.
- Reutiliza antes de crear: `Boton`, `Icono`, `Insignia`, utilidades `contenedor`, `etiqueta-mono`, `insignia`,
  `pildora`, `vacio` de `index.css`. Colores solo los del tema (`bg-onice`, `text-menta`…): la paleta por defecto de
  Tailwind está desactivada a propósito.
- Una sola acción principal (menta) por bloque; el resto, botones con borde. Estados vacíos reales, nunca datos de
  relleno. Toques de 44 px, foco visible, `prefers-reduced-motion` respetado.
- Textos nuevos: siempre en `TEXTOS.es` y `TEXTOS.eu` (`i18n.jsx`); nunca cadenas sueltas en los componentes.
- La API no gana dependencias; la web no gana dependencias sin preguntar (D-07 fija las actuales).
- Cada atajo deliberado lleva `// shortcut: <límite>, <cuándo mejorarlo>` (lo recoge `/ponytail-debt`).
- Cada ronda de cambios que pide Mikel lleva su decisión en `docs/DECISIONS.md` (`D-n`, arriba del todo, con su frase
  literal). En una rama de la fábrica se escribe `D-NEW`; quien fusiona la numera.
- Scripts y ficheros con LF (`.gitattributes`); nada de vídeos ni datos (`datos/`, `.env`) en el repo.

## Cambios que siempre necesitan un humano

- Todo lo que toca sesión, contraseñas, `CLAVE_SESION`/`CLAVE_ADMIN`, el límite de intentos o las reglas de reacciones.
- `proxy/`, `servidor/`, `.github/workflows/`, `docker-compose.yml`, Dockerfiles y `nginx.conf`: despliegue y CI.
- Las carpetas del alumnado en `proyectos/` (salvo `_plantilla/`), y las reglas de `scripts/validar-proyectos.js`
  (cambian lo que se pide a los grupos).
- Dependencias nuevas o subir React, Vite o Tailwind de versión mayor.
- Textos públicos sobre la evaluación, las fechas o lo que se pide a cada ciclo.
- Borrar o reescribir `datos/` en el servidor.

## Documentación que hay que leer antes de tocar cada zona

- Cualquier pantalla: `docs/SPEC.md` §3 y las decisiones D-04, D-05, D-07, D-09, D-10, D-11.
- Publicación del alumnado o el validador: `proyectos/LEEME.md` y D-03.
- Servidor y despliegue: `servidor/LEEME.md`, `apps/proyectos/LEEME.md` y D-02, D-06.
