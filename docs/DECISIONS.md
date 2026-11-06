# Decisiones

Formato: `### D-n · título · fecha · estado`, la más reciente arriba. En una rama de la fábrica se escribe `D-NEW` y
el orquestador la numera al fusionar. La decisión más reciente manda sobre `SPEC.md`.

### D-NEW · Fila de reacciones sin ceros y con "Es tu proyecto" en línea · 2026-11-06 · vigente
Petición: "En la fila de reacciones de la tarjeta (`Reacciones` en `Tarjeta.jsx`): no pintar el número cuando es 0
(solo el icono), iconos a 18 px con algo más de contraste en reposo, y "Es tu proyecto" en la misma línea que las
píldoras, en el sitio del enlace de login, para que el pie de esa tarjeta no quede más alto que el de las vecinas.
(Evaluación de diseño, puntos 2, 8 y 10.)" Se hace así: cada botón pinta el `<span>` del número solo si es mayor que
0; el icono pasa de 15 a 18 px; en reposo el botón pasa de `border-borde-2 text-texto-3` a `border-borde-claro
text-texto-2` (hover a `text-texto`); marcado y deshabilitado no cambian. "Es tu proyecto" gana `whitespace-nowrap`
y sigue con `ml-auto`: sin los ceros las píldoras caben con él en una línea a 1280 px, y el pie mide lo mismo que el
de las vecinas.

### D-22 · Iniciales cuando la portada no carga · 2026-11-06 · vigente
Petición: "En la tarjeta y en el destacado (`PortadaProyecto` en `Tarjeta.jsx`), si la imagen de portada no carga,
enseñar las iniciales sobre superficie igual que cuando no hay portada (`onError`), en vez del icono de imagen rota del
navegador. (Evaluación de diseño del 5/11, punto 1.)" Se hace así: un hook `usePortada(p)` en `Tarjeta.jsx`, que usan
`PortadaProyecto` y `Destacado`, guarda la ruta cuyo `<img>` disparó `onError` y pinta las iniciales de siempre
mientras `p.portada` sea esa ruta; otro proyecto (otra ruta) vuelve a probar su imagen.

### D-21 · Contraste de la cabecera transparente sobre el héroe índigo · 2026-11-05 · vigente
Petición: "En la cabecera de la portada sobre el héroe índigo (`Cabecera.jsx` en su estado transparente, antes de
hacer scroll), los textos no tienen contraste suficiente: el subtítulo bajo el logo, los enlaces de navegación y el
selector de idioma usan `text-texto-3` (pensado para el fondo ónice) y sobre índigo `#6331FB` quedan apagados. Que
sobre el índigo lleguen a 4,5:1 (blanco pleno o `texto` con opacidad alta), sin tocar la cabecera fija (fondo
ónice), ni tamaños, ni disposición; en ES y EU igual." Se hace así:
- `Cabecera` gana la prop `sobreIndigo` (por defecto `false`); solo la pasa `Portada.jsx`. Galería y Entrar no cambian.
- Con `sobreIndigo` y en estado `'libre'`, el subtítulo, los enlaces inactivos, el botón de idioma inactivo y el ciclo
  del usuario pasan de `text-texto-3` (unos 2,6:1) a `text-texto/90` (unos 4,9:1 sobre `#6331FB`), con
  `hover:text-texto` para que el hover se siga notando. No `/85`: da unos 4,47:1.
- En `fija` y `saliendo` (fondo ónice) siguen en `text-texto-3`. Se aplica en todos los anchos: en móvil el héroe no
  sube bajo la cabecera, pero sobre ónice `texto/90` contrasta aún más.

### D-20 · El destacado de la portada como hero section · 2026-11-05 · vigente
"Rehacer el bloque "Proyecto destacado" de la portada […] como una hero section memorable, no como una tarjeta más",
más alto, con la portada del proyecto dominando el bloque y el texto encima, un efecto de React Bits, mucha más
variedad de tamaños de texto y los botones menos llamativos:
- **Imagen a sangre, texto encima**: `Destacado` (`Tarjeta.jsx`) deja las dos columnas; la foto cubre todo el bloque
  (`min-h-[min(80vh,720px)]`, 560 px en móvil) y el texto va abajo a la izquierda sobre un degradado de ónice. Sin
  portada propia, fondo `superficie-2` con las iniciales enormes en índigo claro. La foto ya no es un enlace (no hay
  enlaces anidados: el título y "Ver proyecto" llevan a la landing); `PortadaProyecto` y `BotonesProyecto` pierden su
  variante `grande`.
- **Escala**: título en Impact a `clamp(48px,7vw,112px)` que parte palabras antes que desbordar; la cifra de
  reacciones en Impact grande y menta con "reacciones en total" pequeño al lado (clave nueva
  `reacciones_total_texto`, para que el elemento siga diciendo exactamente `reacciones_total`); resumen a 19 px y
  60 ch; equipo y ciclo en mono de 12 px en mayúsculas.
- **Efecto**: sigue el `SpotlightCard` (brillo del borde) y sobre la foto va `Noise`, el mismo grano del héroe índigo,
  quieto con `prefers-reduced-motion`. Ningún componente de React Bits nuevo ni modificado.
- **Acciones**: "Ver proyecto" es la única en menta; "Vídeo · 5 min" y "Código" pasan a enlaces discretos de 44 px y
  "Vídeo pendiente" a texto atenuado. La galería no cambia.

### D-19 · Medidas de seguridad de la evaluación del 5-11 · 2026-11-05 · vigente
"aplica las medidas de seguridad", tras la evaluación hecha antes de subir el repo (sin secretos ni datos en el
histórico; cuatro riesgos de diseño):
- **Landings en sandbox**: `apps/proyectos/web/nginx.conf` manda `Content-Security-Policy: sandbox …` sin
  `allow-same-origin` en `/p/`. El HTML y JS del alumnado deja de compartir origen con la web y la API: no ve la
  cookie de sesión, no puede reaccionar ni cerrar sesión en nombre de quien lo visita (las reacciones deciden la
  portada) ni usar `localStorage`. Avisado en `proyectos/LEEME.md`.
- **`validar-pr.yml` sin inyección**: las salidas derivadas de los nombres de fichero de la PR entran al paso "Solo
  tu carpeta" por `env` y no interpoladas en el shell; delimitador aleatorio en `GITHUB_OUTPUT`. Y `main`
  protegida en GitHub: el check `comprobar` es obligatorio para las PR (los administradores pueden seguir
  haciendo push directo; si no, las fusiones de la fábrica no entrarían).
- **IP real en la API**: el nginx de la web usa `set_real_ip_from 172.16.0.0/12` + `real_ip_header X-Real-IP`,
  así el límite de diez intentos de login por IP es por visitante y no por todo el centro; solo se cree la cabecera
  cuando viene de la red de Docker (el proxy), no si alguien entra directo por el :8080.
- **Clave de admin en tiempo constante** (`timingSafeEqual`), como ya se hacía con contraseñas y firmas.
- Queda documentado y sin hacer: TLS (la cookie sin `Secure`) antes de abrir la web fuera de la VPN.

### D-18 · Sin filete en la costura del héroe con el destacado · 2026-11-05 · vigente
Mikel, en el backlog: "La costura entre el héroe de la portada y la sección "Proyecto destacado" (`Portada.jsx`) sigue
marcada por una línea sólida de lado a lado: el filete `border-t border-blanco/30` de la fila de cifras cruza las patas
desvanecidas de la mascota y señala el corte; desde que la mascota está más abajo queda peor. Quitar esa línea (o
sustituirla por espacio o un escalón de tono)". La fila de cifras pierde el filete y se separa solo con espacio (`pt-6`)
para que mascota, héroe y ónice se fundan: el degradado ya acaba en ónice opaco, así que un escalón de tono añadiría
otro corte. No cambian el degradado, ni la mascota (posición, `Magnet`, máscara), ni los filetes de la lista del héroe.

### D-17 · Portada como la referencia: campo índigo plano y título partido · 2026-11-05 · vigente
Mikel manda una captura (WhatsApp, 5/11 14:43) con la paleta de D-04 y una portada que le gusta ("una página web de
ejemplo con los colores que quiero y un estilo de página principal que me gusta"): héroe de índigo eléctrico plano,
título enorme en condensada partido a los dos lados de un retrato en duotono, una palabra en serif itálica por línea,
botón menta en píldora, lista corta con filetes a la derecha y fila de logos abajo. Se aplica así:
- **Colores**: vuelven los valores de D-04 para fondo, superficies y bordes (ónice `#01010D`…); D-15 queda solo en
  la menta (`#70FBB7`, más saturada). Lo que faltaba de azul no era el fondo sino un campo índigo grande: el héroe.
- **Héroe**: `bg-indigo` plano, sin degradado (sustituye a D-09) y sin LiquidEther (sale de la lista de D-07; el
  fichero se queda en `reactbits/` por si vuelve). Título partido: "PROYECTOS / *intermodulares*" a la izquierda y
  "26·27 / *Zornotza LHII*" a la derecha (Impact + Instrument Serif itálica, Google Fonts; el `h1` sigue siendo
  "Proyectos intermodulares 26-27", D-05, en `sr-only`). En medio, la portada del proyecto destacado teñida de
  índigo con `mix-blend-luminosity` y una máscara radial: la foto cambia en cada visita, como el destacado.
  Debajo, la entradilla y los dos botones (textos de D-05), la lista de lo que se pide a cada grupo (`hero_1..4`) y
  las cifras como fila de cierre. BlurText deja de usarse en la portada.
- **Botones en píldora** (`rounded-full`) en toda la web, como los chips y las reacciones; variante `claro` (borde
  blanco) para el índigo.
- La captura no entra en el repo (es una pantalla de un vídeo ajeno con una persona); queda en Descargas de Mikel.
- Segunda vuelta, con la primera versión a la vista: "las secciones de héroes quedan muy poco memorables, tienen poca
  altura, las imágenes no se están integrando bien y el texto tampoco se ve bien porque las letras de Impact están
  demasiado juntas y brillan mucho". Héroe a pantalla completa (`100vh` menos la cabecera), título a 9,5 vw con
  `tracking 0.03em` y blanco al 90 %, la foto grande detrás del título (46 vw, máscara radial amplia, las letras pisan
  sus bordes), tracking global de h1-h3 a 0.025em, y la franja de la galería a 46 vh con su título a tamaño de
  portada. El job del backlog que pedía bajar esa franja a la mitad se retira: Mikel decide lo contrario.
- Tercera vuelta: "Reemplaza la imagen esa por la de img/patata y agrega un par de gradientes onyx desde abajo, ahora
  se ve azul plano la página principal", "que no tiene sentido que esté ahí". La foto del destacado sale del héroe;
  en su lugar, la mascota `img/patata.png` (recorte 3D con fondo transparente, ya en índigo y menta; copiada a
  `apps/proyectos/web/public/img/`), sin máscara ni mezcla, detrás del título. Y dos degradados de ónice desde
  abajo (uno vertical y otro radial desde la esquina inferior izquierda): la regla "sin degradado" de arriba queda
  anulada por Mikel. El PNG pesa 890 KB; conviene pasarlo a WebP cuando se cierre la mascota. Mikel manda después otro recorte
  ("reemplaza por esta", mismas medidas, 748 KB), que sustituye al anterior.
- Cabecera: "haz que la cabecera sea transparente y cuando deje de verse por el scroll esta aparece desde arriba con
  una animación, ease-in", "al volver a subir esta desaparece y deja ver la cabecera transparente". `Cabecera.jsx`
  escucha el scroll: en reposo es transparente y el héroe sube hasta debajo (`-mt-20 pt-20` en escritorio); pasada
  su altura, la misma cabecera se vuelve fija con fondo ónice y entra con `animate-bajar` (0,35 s, ease-in; sin
  animación con `prefers-reduced-motion`), dejando un hueco de su alto para que la página no salte; al volver arriba
  deja de ser fija y vuelve la transparente.
- Cuarta vuelta, con las capturas a la vista: "Las partes no se funden bien" (la costura entre el héroe y la sección
  siguiente). El degradado vertical acababa en ónice al 92 %, con lo que la última fila del héroe quedaba violácea
  sobre el fondo ónice puro; ahora acaba en ónice opaco y el héroe se funde con la página.
- Quinta vuelta: "El gradiente está bien, que no sea lineal, pero la patata tiene que ser más grande y estar más
  abajo, casi fundiéndose con la parte negra (…) casi el doble grande". El degradado vertical pasa a curva en S (seis
  paradas: arranca despacio, acelera en el centro, remata en ónice opaco). La mascota deja de centrarse en el bloque
  del título: ocupa el alto del héroe (`100vh - 40px`, tope 1040 px, ancho automático), con la cola bajo la
  cabecera transparente y las patas en la zona oscura, justo encima de la fila de cifras. A 1080p mide 832 px de
  ancho (1,8 veces los 460 de antes); a 900 px de alto, 688. En móvil no cambia. Después, "Mueven un poco más
  abajo": 64 px más abajo, y la fila de cifras baja otros 64 (`md:mt-16`) para que las patas no la pisen.
- Sexta vuelta: "agrega alguno de los efectos de React Bits sin afectar al mood o al tono general". Entran en la lista
  de D-07 dos componentes sin dependencias, copiados de `src/tailwind/` del repo: **Noise** (grano de película sobre
  el héroe, `soft-light` al 14 %, 12 fps, quieto con `prefers-reduced-motion`: textura sin cambiar el color) y
  **Magnet** alrededor de la mascota (se desplaza hasta 28 px hacia el cursor, sin inclinación 3D: "La imagen se ha
  deformado"; nada en táctil ni con
  reduced-motion). SplitText se descarta porque pide `@gsap/react`, que no está instalado.
- Séptima vuelta: "Más grande y más abajo la imagen y no deformarla". La deformación era real: al envolverla en Magnet,
  la caja del envoltorio salía más estrecha que la imagen y el `max-width: 100%` del preflight de Tailwind la
  aplastaba en horizontal (la altura estaba fijada). Ahora la mascota se posiciona respecto al contenedor del héroe
  (`inset-0`, centrada con flex), con el alto en cadena hasta la imagen (`h-full`), `max-w-none` y ancho automático:
  ocupa todo el alto del héroe, cola bajo la cabecera y patas en el borde inferior, por detrás de la fila de cifras
  (`relative`, sin el margen extra de la vuelta anterior). La capa de la mascota no recibe el puntero. El test
  "Enséñame otro" espera al destacado antes de leer el primer `h3`: leía a veces una tendencia y fallaba al azar.
  Después, "Mueve la patata hacia abajo un poquito, muy poco, lo justo para que se fundan las patas": 40 px más abajo
  (`top-10 -bottom-10`) y una máscara (`mask-b-from-80%`) que desvanece el 20 % inferior de la mascota: las patas se
  funden con el ónice en vez de cortarse en el borde del héroe, y las cifras se leen mejor encima.
- Octava vuelta: "La barra de menú, igual que aparece, tiene que desaparecer con una animación, y esta tiene que
  ser más sutil". La cabecera fija pasa por tres estados (`libre`, `fija`, `saliendo`): al volver arriba sale con
  `animate-subir` (la inversa de la entrada) y al acabar vuelve a ser la transparente. Las dos animaciones se
  acortan a 12 px con fundido (0,28 s la entrada, 0,22 s la salida, ease-in las dos); con `prefers-reduced-motion`
  duran 0,01 ms en vez de anularse, para que `animationend` siga disparándose.

### D-16 · La fábrica completa, según la guía del boilerplate · 2026-11-05 · vigente
"Integrame bien la factory mira en factory boilerplate", "asi es como tienes que hacerlo". Se sigue §11 de
`DOCUMENTACION.md` ("Instalación en tu proyecto") y SCAFFOLD §3.2 (app existente) tomando como referencia
`origin/main` de `mikeldalmauc/factory-boilerplate` (el clon local iba cuatro commits por detrás; los agentes y la
skill `factory` del repo ya eran los de esa versión y no se tocan). Entran: `factory/dashboard/` nuevo (botones
"Aprobar y fusionar" y pausa, que escriben `factory/approvals/<job>` y `factory/PAUSED`), `factory/cron/factory-next.sh`
(fusiona lo aprobado y encadena `/factory next`; corre en Linux: servidor o contenedor), `docker/` (Dockerfile y
compose de la fábrica desatendida, con `REPO_DIR_NAME` por defecto `proyectos_intermodulares`), `factory/examples/`
(tres jobs de muestra para `--examples`), `factory-doc/DOCUMENTACION.md` y `DATOS.md`, y `factory/worktrees/` en
`.gitignore`. Quedan fuera a propósito `nuevo-proyecto` y `bin/nuevo-proyecto.sh` (crear un proyecto desde cero) y
las plantillas de SPEC y DECISIONS (ya existen los nuestros). Aprobar desde la interfaz requiere el cron en marcha;
sin cron, `/factory approve <id>` en una sesión abierta dentro del repo. Completa D-12.

### D-15 · Paleta con más azul, menos negro y la menta más saturada · 2026-11-05 · vigente
"los colores no me gustan, tiene poco azul y mucho negro y el verde tiene que ser ligerametne más saturado". El fondo
pasa de ónice casi negro (`#01010D`) a índigo profundo (`#0B0A36`) y las superficies y bordes suben en la misma
dirección (`#15134A`, `#1E1B5A`, `#2A2670`, `#332E7E`, `#5A54A8`); el degradado del héroe arranca en ese azul y
pasa por `#1E1570`; la menta pasa de `#88F9C0` a `#70FBB7` (un punto más saturada y menos pastel; su clara, a
`#8FFCC6`). El índigo eléctrico `#6331FB` y los textos no cambian. Los nombres de los tokens (`onice`, `menta`…) se
mantienen para no tocar los componentes. Cambiado también en favicon, `theme-color`, `portada-defecto.svg`, la
plantilla del alumnado y las tres landings de ejemplo, para que la landing no desentone al abrirla desde la tarjeta.
Sustituye los valores de D-04; la idea (una sola acción principal en menta) sigue.

### D-14 · Fotos de prueba en los proyectos de ejemplo · 2026-11-05 · vigente
"Añade unas imagenes de prueba para los proyectos de ejemplo": los tres ejemplos de `proyectos/` llevan una foto
real como `portada.jpg` (1200×750, menos de 110 KB cada una) en vez del `portada.svg` esquemático, y sus landings la
usan también. Son fotos de Unsplash servidas por picsum.photos (ids 160, 180 y 42; licencia Unsplash, sin atribución
obligatoria). `_plantilla/` conserva su `portada.svg` y `proyectos/LEEME.md` sigue valiendo tal cual.

### D-13 · Pruebas de extremo a extremo con Playwright en Docker · 2026-11-05 · vigente
"prueba la web con playwright tienes docker", "prepara multiples tests", "luego levántala aquí en local para que
vea cómo ha quedado". Carpeta `e2e/` con su propio `package.json` (solo `@playwright/test`, misma versión que la
imagen oficial `mcr.microsoft.com/playwright`): la web no gana dependencias (D-07). Las pruebas corren en un
contenedor unido a la red de la pila y atacan `http://proxy/proyectos/`, como un navegador real; en serie (las
reacciones son estado compartido) y con dos proyectos, escritorio y móvil (Pixel 7). Un setup importa las cuentas de
ejemplo con `CLAVE_ADMIN`, vacía las reacciones y guarda una sesión para no gastar el límite de 10 intentos por IP.
La primera pasada destapó un fallo que los tests unitarios no veían: `Desplazamiento` (`App.jsx`) devolvía el
resultado de `window.scrollTo` desde el `useEffect`; en jsdom es `undefined`, en Chromium no, y React lo ejecutaba
como limpieza al cambiar de página → `TypeError` y la app entera en negro al ir a `/entrar` o pulsar un ancla.
Corregido en la misma ronda, igual que el segundo que salió en móvil: al llegar a `/#publicar` desde otra página,
la lista de proyectos se pintaba después del scroll y empujaba el ancla (se acababa en el destacado); ahora
`Desplazamiento` recoloca el ancla mientras cambie la altura de la página durante dos segundos. Fallo conocido que
dejan documentado con `test.fail()`: una landing sin barra final
(`/proyectos/p/WG/x`) redirige sin el prefijo `/proyectos` y acaba en 404 (el `location /p/` de
`apps/proyectos/web/nginx.conf` no usa `X-Forwarded-Prefix`); arreglo pendiente de Mikel por ser zona de despliegue.

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
