# Decisiones

Formato: `### D-n · título · fecha · estado`, la más reciente arriba. En una rama de la fábrica se escribe `D-NEW` y
el orquestador la numera al fusionar. La decisión más reciente manda sobre `SPEC.md`.

### D-12 · La fábrica va dentro del repo · 2026-11-05 · vigente
Agentes, skills (ponytail, thermo-nuclear) y `factory/` copiados de `mikeldalmauc/factory-boilerplate`, como en
mikels-core. Nivel ponytail `full`. Las carpetas de `proyectos/` quedan fuera de lo que la fábrica puede tocar.

### D-11 · Etiqueta de la tarjeta solo con el ciclo · 2026-11-05 · vigente
"quita la etiqueta de grado solo deja DAM DAW o MS": la insignia de cada tarjeta lleva solo `ciclo_nombre` (SMR, DAW,
DAM). El grado sigue saliendo de la carpeta del ciclo en la API por si hace falta.

### D-10 · Títulos en Impact · 2026-11-05 · vigente
"Esto no es IMPACT": todos los títulos (h1, h2, h3, cifras, iniciales) en Impact, peso 400, con Anton (Google Fonts)
como respaldo para Linux y Android. Sustituye a Syne. Texto IBM Plex Sans, etiquetas IBM Plex Mono.

### D-09 · Gradiente índigo en la portada · 2026-11-05 · vigente
"No estás metiendo electric indigo de fondo, crea un gradiente": la portada lleva `linear-gradient(135deg, #01010D,
#150C4A 45%, #6331FB)` debajo de la animación; el velo oscuro de la izquierda se mantiene por legibilidad.

### D-08 · Títulos de landing cortos · 2026-11-05 · vigente
"Demasiado texto para un título": el h1 de cada landing es una línea que dice qué resuelve; la plantilla lo indica.

### D-07 · Web en React con Tailwind y componentes de React Bits sin inventar ninguno · 2026-11-05 · vigente
"convierte la web en una de React", "No te inventes componentes", "Usa ponytail". React 19 + Vite 6 + Tailwind 4 +
react-router 7; componentes de React Bits (variante JS-Tailwind) copiados tal cual en `src/reactbits/` con su licencia
(MIT + Commons Clause): LiquidEther (portada), BlurText, CountUp, SpotlightCard, DotGrid (galería), Orb (login),
AnimatedContent. Chroma Current es de pago y no se copia; LiquidEther es el equivalente gratuito. Sustituye a la web
vanilla (HTML + JS sin dependencias).

### D-06 · Base `/proyectos/` fijada en la compilación · 2026-11-05 · vigente
El proxy quita el prefijo `/proyectos` y la web se compila con `base: '/proyectos/'` (`vite.config.js`); rutas
`/`, `/galeria`, `/entrar`, con redirección de los nombres antiguos (`proyectos.html`, `login.html`). Si la web cambia
de ruta en el proxy, se cambia la base y se reconstruye.

### D-05 · Portada: destacado al azar entre los diez más votados y tres tendencias · 2026-11-05 · vigente
Textos fijados por Mikel en el lienzo: "Proyecto destacado", "Tendencias", "Descubre los proyectos", "¿No has
publicado todavía tu proyecto?", h1 "Proyectos intermodulares 26-27". Botón "Enséñame otro" cambia el destacado sin
recargar.

### D-04 · Paleta ónice, índigo eléctrico y menta tropical · 2026-11-05 · vigente
Ónice `#01010D` y electric indigo `#6331FB` principales (mood), tropical mint `#88F9C0` como acento: una sola acción
principal (menta) por bloque. Logo oficial del centro en blanco sobre transparente.

### D-03 · Publicación por pull request y despliegue al fusionar · 2026-11-04 · vigente
Cada grupo copia `proyectos/_plantilla/` a `proyectos/<ciclo>/<slug>/` y abre una PR; `validar-pr.yml` comprueba solo
esa carpeta; al fusionar en `main`, `desplegar.yml` despliega por el bastión de Isard. El ciclo y el grado salen de la
carpeta, no de lo que escriba el alumno.

### D-02 · Servidor calcado de server_isard_som · 2026-11-04 · vigente
Ubuntu en IsardVDI, Docker Compose con `include`, proxy nginx con `resolver 127.0.0.11`, scripts idempotentes en
castellano, `.env.ejemplo` con `__ALEATORIA__`, sin configurar red (bastión y WireGuard ya existen).

### D-01 · API Node sin dependencias y datos en JSON · 2026-11-04 · vigente
Proyectos leídos de las carpetas (no hay BD); usuarios (scrypt) y reacciones en `datos/*.json`; sesión en cookie HMAC;
administración con `X-Clave-Admin` desde `admin.sh`. Nadie reacciona a su propio proyecto (`autores`).
