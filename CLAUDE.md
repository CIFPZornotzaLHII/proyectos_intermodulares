# proyectos_intermodulares · guía para Claude Code

Repo de la web de proyectos intermodulares del CIFP Zornotza LHII y de su servidor (IsardVDI + Docker). Estructura y
convenciones copiadas de `mikeldalmauc/server_isard_som`: todo en castellano, scripts idempotentes, Node sin
dependencias, `.env.ejemplo` con `__ALEATORIA__`, despliegue por el bastión de Isard.

- `apps/proyectos/api/server.js`: la API. Lee `proyectos/<ciclo>/<slug>/proyecto.json` (no hay BD de proyectos); usuarios y reacciones en JSON en `datos/`. Sesión = cookie firmada (HMAC) con `CLAVE_SESION`.
- `apps/proyectos/web/`: la web, React 19 + Vite + Tailwind 4 + react-router (`npm run dev` / `npm test` / `npm run build`; el Dockerfile compila y la sirve con nginx). Páginas en `src/paginas/`, textos ES/EU en `src/i18n.jsx` (`TEXTOS`), tema en `src/index.css` (`@theme`): ónice `#01010D`, índigo `#6331FB`, menta `#88F9C0`; títulos Impact/Anton, texto IBM Plex Sans, etiquetas IBM Plex Mono. Logo: `public/img/logo.png`. Base `/proyectos/` fijada en `vite.config.js`.
- `apps/proyectos/web/src/reactbits/`: componentes de React Bits copiados tal cual (MIT + Commons Clause). **No se modifican ni se sustituyen por versiones propias**: si falta uno, se copia de `src/tailwind/` del repo de React Bits y se adapta por props.
- `proyectos/`: contenido del alumnado. **Nunca** editar sus carpetas desde aquí salvo que lo pida Mikel; `_plantilla/` es lo que copian.
- `scripts/validar-proyectos.js`: reglas de las PR. Si cambias una regla, cámbiala también en `proyectos/LEEME.md`.
- Ciclos y etiquetas de grado: salen del nombre de carpeta (`2SM` → SMR grado medio, `WG` → DAW, `PG` → DAM grado superior), definidos en `CICLOS` del `server.js`.
- Para probar sin Docker: `CLAVE_SESION=x CLAVE_ADMIN=y DATOS=/tmp/pi PROYECTOS=./proyectos node apps/proyectos/api/server.js` y, en `apps/proyectos/web/`, `npm run dev` (abre `http://localhost:5173/proyectos/`; pasa `/proyectos/api/` al 3000 y sirve las landings).
- No subir vídeos ni datos (`datos/`, `.env`) al repo. Los commits y scripts van con LF (`.gitattributes`).
