# Web de proyectos intermodulares · cómo funciona

Dos contenedores (los arranca el `docker-compose.yml` de la raíz del repo):

| Servicio | Qué es | Dónde |
|---|---|---|
| `proyectos-web` | nginx con la aplicación React compilada (`web/`: portada, galería `/galeria`, login `/entrar`) y las landings del alumnado (`/p/<ciclo>/<slug>/`, leídas de `proyectos/` en el repo) | `/proyectos/` por el proxy (el `:8080` directo solo sirve para la API: la web está compilada para vivir en `/proyectos/`) |
| `proyectos-api` | Node sin dependencias (`api/server.js`): lista de proyectos, sesión del alumnado, reacciones y administración | `/api/` detrás de la web |

Datos que viven **fuera de git**: `datos/usuarios.json` (cuentas, con la contraseña cifrada) y `datos/reacciones.json`.
Claves: `.env` (lo crea `desplegar.sh` a partir de `.env.ejemplo`).

## De dónde salen los proyectos

La API lee en cada petición (con caché de 10 s) las carpetas `proyectos/<ciclo>/<slug>/` del repo y su `proyecto.json`.
No hay base de datos de proyectos: **un proyecto existe cuando su carpeta está en `main`**. La etiqueta de grado
sale de la carpeta del ciclo (`2SM`, `WG`, `PG`), no de lo que escriba el alumno. Una carpeta con un
`proyecto.json` inválido se ignora y aparece en `GET /api/salud` como `invalidos`.

La portada elige el **proyecto destacado** al azar entre los 10 con más reacciones (cambia en cada visita) y debajo
muestra los 3 siguientes. "Ver todos los proyectos" lleva a la galería con filtros por ciclo y buscador.

## API

| Método y ruta | Qué hace |
|---|---|
| `GET /api/salud` | estado, número de proyectos, inválidos, usuarios y reacciones |
| `GET /api/proyectos[?ciclo=2SM]` | proyectos con sus reacciones (y `mias` si hay sesión) |
| `GET /api/sesion` · `POST /api/sesion {usuario, contrasena}` · `DELETE /api/sesion` | sesión (cookie `pi_sesion`, firmada con `CLAVE_SESION`, 30 días) |
| `POST /api/reacciones {proyecto: "WG/mi-proyecto", emoji}` | añade o quita (si ya estaba) la reacción del usuario; no se puede reaccionar al propio proyecto (`autores` en `proyecto.json`) |
| `… /api/admin/…` con cabecera `X-Clave-Admin` | importar usuarios (CSV o JSON), listar, cambiar contraseña, borrar, ver y borrar reacciones. Lo usa `admin.sh` |

Reacciones posibles: 👏 💡 🚀 🔥 ❤️ (la web las pinta con iconos). Límite de 10 intentos de inicio de sesión por IP cada 10 minutos.

## Alumnado (cuentas)

```bash
bash admin.sh importar alumnos.csv     # login;nombre;ciclo;contraseña — sin contraseña, se genera y se muestra UNA vez
bash admin.sh listar
bash admin.sh contrasena ane.garcia    # nueva contraseña generada
bash admin.sh borrar ane.garcia
```

`alumnos.ejemplo.csv` trae cuentas de prueba (contraseñas `zornotza-2sm`, `zornotza-wg`, `zornotza-pg`): sirven para
probar la web; impórtalas con `admin.sh importar alumnos.ejemplo.csv` y bórralas cuando cargues la lista real.
El login debe ir en minúsculas (letras, números, `.`, `_`, `-`). El ciclo (`2SM`, `WG`, `PG`) solo se muestra en la cabecera.

## Probar en tu PC

```bash
cp apps/proyectos/.env.ejemplo apps/proyectos/.env   # y pon claves (CLAVE_SESION, CLAVE_ADMIN)
docker compose up -d --build                        # desde la raíz del repo
bash apps/proyectos/admin.sh importar apps/proyectos/alumnos.ejemplo.csv
# http://localhost/proyectos/   (proxy)   ·   http://localhost:8080/api/salud   (API directa)
```

Sin Docker, para desarrollar la web:

```bash
CLAVE_SESION=x CLAVE_ADMIN=y DATOS=/tmp/pi PROYECTOS=./proyectos node apps/proyectos/api/server.js   # API en :3000
cd apps/proyectos/web && npm install && npm run dev                                                # http://localhost:5173/proyectos/
npm test        # pruebas (vitest + Testing Library, con una API falsa)
npm run build   # genera dist/ (lo hace el Dockerfile al desplegar)
```

El servidor de desarrollo pasa `/proyectos/api/` a la API del 3000 y sirve las landings de `proyectos/` en `/proyectos/p/`, como hará nginx.

## La web (`web/`)

React 19 + Vite + Tailwind 4 + react-router. Compilada con base `/proyectos/` (`vite.config.js`): si la web cambia de ruta en el proxy, hay que cambiarla ahí.

| Carpeta | Qué hay |
|---|---|
| `src/paginas/` | `Portada` (destacado al azar entre los 10 más votados, tendencias, cifras), `Galeria` (filtros por ciclo, buscador, reacciones), `Entrar` (login) |
| `src/componentes/` | cabecera, pie, llamada a publicar, botón, iconos y las tarjetas (`Tarjeta.jsx`) |
| `src/reactbits/` | componentes de [React Bits](https://reactbits.dev) copiados tal cual (licencia MIT + Commons Clause, `LICENSE.md`): `CountUp` (cifras de la portada), `SpotlightCard` (tarjetas), `DotGrid` (franja de la galería), `Orb` (login) y `AnimatedContent` (aparición al hacer scroll); `LiquidEther` y `BlurText` siguen en la carpeta pero la portada ya no los usa (D-17). No se editan: si hace falta otro, se copia de `src/tailwind/` del repo de React Bits |
| `src/i18n.jsx` | textos ES/EU · `src/api.js` llamadas a la API · `src/sesion.jsx` sesión compartida · `src/index.css` tema (paleta y tipografías en `@theme`) |
| `test/` | pruebas de las tres páginas contra una API falsa |

Paleta: ónice `#01010D` (fondo), índigo `#6331FB` (el héroe de la portada es un campo plano de este color), menta `#70FBB7` (acción principal). Títulos en Impact, con Anton (Google Fonts) de respaldo para Linux y Android, y una palabra por línea del título de la portada en Instrument Serif itálica; texto IBM Plex Sans; etiquetas IBM Plex Mono. Botones en píldora.
La franja de la galería y el orbe del login usan WebGL2 o canvas; donde no hay (navegadores muy viejos), simplemente no se pintan y la web funciona igual.

## Idiomas

Los textos de la web están en `web/src/i18n.jsx` (`TEXTOS`): castellano y euskera, con un selector ES/EU en la cabecera que
se guarda en el navegador y cambia sin recargar. La traducción al euskera está hecha a máquina: **conviene que la revise alguien del centro**.
