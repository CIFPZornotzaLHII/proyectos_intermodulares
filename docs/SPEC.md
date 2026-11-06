# SPEC · Web de proyectos intermodulares (CIFP Zornotza LHII)

Qué se construye en este repo y qué no. Las decisiones concretas, con fecha, están en `DECISIONS.md` (la más reciente
manda sobre este documento).

## 1. Para quién y para qué

- **Alumnado de 2.º** de SMR (`2SM`, grado medio), DAW (`WG`) y DAM (`PG`), grados superiores. Curso 2026-27, módulo
  Proyecto intermodular (50 h). Publican su proyecto como tarjeta y landing, y reaccionan a los de los demás grupos.
- **Mikel** (profesor): revisa y acepta las pull requests, gestiona las cuentas y despliega.
- **Visitantes** (familias, otros docentes, empresas): ven los proyectos sin cuenta.

## 2. Qué hace

1. **Portada** (`/proyectos/`): cabecera con logo del centro; héroe de índigo eléctrico plano (D-17) con el título
   partido a los dos lados de la portada del proyecto destacado teñida de índigo, una palabra en serif itálica por
   línea, entradilla, dos botones, la lista de lo que se pide a cada grupo y las cifras como fila de cierre;
   **proyecto destacado** elegido al azar entre los 10 con más reacciones (botón "Enséñame otro"); **Tendencias**:
   los 3 siguientes; enlace "Ver los N proyectos"; llamada a publicar; pie.
2. **Galería** (`/proyectos/galeria`): todas las tarjetas con filtro por ciclo (chips con recuento, `?ciclo=`),
   buscador (título, resumen, equipo, etiquetas) y las cinco reacciones (👏 💡 🚀 🔥 ❤️, pintadas con iconos). Sin sesión
   se invita a entrar; con sesión se añade o quita la reacción; nadie reacciona a su propio proyecto.
3. **Entrar** (`/proyectos/entrar`): usuario y contraseña del centro (cuentas creadas por el profesorado), sesión de 30
   días en cookie firmada, vuelta a la página de origen.
4. **Landings** (`/proyectos/p/<ciclo>/<carpeta>/`): el `index.html` de cada grupo, servido tal cual desde `proyectos/`.
5. **Publicación por pull request**: fork → copiar `proyectos/_plantilla/` → PR. `validar-pr.yml` comprueba la carpeta
   (`scripts/validar-proyectos.js`) y que la PR no toque nada más; al fusionar en `main`, `desplegar.yml` despliega en el
   servidor de Isard por el bastión SSH.
6. **API** (`apps/proyectos/api`, Node sin dependencias): proyectos leídos de las carpetas, sesión, reacciones y
   administración de usuarios con `admin.sh`. Datos en JSON (`datos/`), fuera de git.
7. **Idiomas**: castellano y euskera (selector ES/EU, guardado en el navegador).

## 3. Cómo se ve

Paleta: ónice `#01010D` (fondo), índigo eléctrico `#6331FB` (el campo del héroe de la portada y acentos secundarios),
menta tropical `#70FBB7` (única acción principal por bloque). Títulos en Impact (Anton de respaldo), una palabra en
Instrument Serif itálica por línea en el título de la portada, texto IBM Plex Sans, etiquetas IBM Plex Mono. Botones
en píldora. Componentes animados **de React Bits, copiados tal cual** (`apps/proyectos/web/src/reactbits/`), nunca
reimplementados. Tarjetas con `SpotlightCard`; aparición al hacer scroll con `AnimatedContent`. Estados vacíos reales,
focus visible, toques de 44 px, `prefers-reduced-motion` respetado. En móvil la cabecera va en dos filas (marca, idioma y
sesión; debajo, la navegación) y sin "Cómo publicar" (D-30). Cinco tamaños de letra (display, título, entradilla 18 px,
cuerpo 16 px, pequeño 13 px) y nada legible por debajo de 13 px (D-NEW). El diseño de referencia es el artefacto "Diseño web
Proyectos intermodulares · Zornotza LHII" (Claude Design).

## 4. Dónde corre

Ubuntu en IsardVDI con Docker Compose: `proxy` (nginx, puerto 80, `/` → `/proyectos/`), `proyectos-web` (nginx con la
web compilada + landings) y `proyectos-api`. Estructura y scripts copiados de `mikeldalmauc/server_isard_som`
(`servidor/instalar-servidor.sh`, `desplegar.sh`, GitHub Actions por el bastión). La web está compilada con base
`/proyectos/`.

## 5. Calidad

- Tests de la web con vitest + Testing Library contra una API falsa (`apps/proyectos/web/test/`): portada, galería,
  reacciones, login, idioma. La API se prueba a mano con `curl` (ver `apps/proyectos/LEEME.md`).
- Pruebas de extremo a extremo con Playwright en Docker contra la pila entera (`e2e/`, D-13): portada, galería,
  reacciones reales, sesión, rutas del proxy y de nginx, landings, API, idioma, calidad (consola, accesibilidad
  básica, teclado, `prefers-reduced-motion`) y capturas de cada página en escritorio y móvil.
- Validación de PR del alumnado automática; nada se despliega sin pasar por `main`.

## 6. Lo que NO se hace

- Ni base de datos ni backend con dependencias: proyectos = carpetas en `main`; usuarios y reacciones = JSON.
- Ni registro de usuarios ni recuperación de contraseña: las cuentas las da el profesorado.
- Ni comentarios de texto, ni ranking público con nombres: solo reacciones por emoji y el "más votados" de la portada.
- Ni vídeos en el repo (se enlazan), ni ficheros de más de 2 MB por proyecto (20 MB por carpeta).
- Ni componentes de animación propios: si falta uno, se copia de React Bits.
- Ni modificar las carpetas del alumnado desde la fábrica: solo el alumnado (por PR) o Mikel.
