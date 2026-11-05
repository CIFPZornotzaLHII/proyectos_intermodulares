# Evaluación de diseño · consejo de diseñadores · 2026-11-05

Revisión de la web desplegada en local (`http://localhost/proyectos/`, con las fotos de D-14) a partir de las capturas
de `e2e/salida/capturas/` (escritorio 1280 px y móvil Pixel 7). Cinco lentes, una nota de 1 a 5 cada una, y al final
la lista de cambios por orden de valor. Es una crítica, no un encargo: nada de esto está hecho.

| Lente | Pregunta | Nota |
|---|---|---|
| Ive · material | ¿De qué está hecha y lo honra? | 4 |
| Rams · economía | ¿Cada elemento se gana su sitio? | 3 |
| Hadid · recorrido | ¿Se siente coreografiado el movimiento? | 4 |
| Ingels · juego | ¿Hay un momento que sorprende o premia? | 3 |
| Norman · claridad | ¿Se usa sin instrucciones? | 4 |

La base es buena: paleta con sentido, una entrada de verdad, estados vacíos escritos a mano. Lo que falta es
**quitar**, no añadir.

## Ive · material (4)

- **La paleta es material, no decoración.** Ónice como vacío, índigo como luz dentro del vacío, menta como la única
  cosa que se puede tocar. La portada lo cuenta sola: la corriente de LiquidEther es luz en un espacio oscuro, no un
  banner. El degradado de D-09 lo refuerza.
- **Impact en todos los títulos (D-10) funciona a 64 y 32 px** y en las cifras. A 20 px, en el h3 de las tarjetas
  ("Red segura para una asesoría"), la condensada se aprieta y pierde el aire de cartel que la justifica. Si D-10 se
  mantiene, al menos subir el h3 a 22 px y darle `tracking` 0.02em; si se abre, Plex Sans 600 en las tarjetas y
  Impact solo donde manda (h1, h2, cifras).
- **Radios coherentes**: tarjetas 16, botones 10, píldoras completas. Un solo lenguaje, cercano sin ser blando.
- **Un estado deshonesto**: si la portada de un proyecto no carga, la tarjeta enseña el icono de imagen rota del
  navegador (se vio durante la prueba al cambiar las portadas). El material aquí debería ser el de siempre: las
  iniciales sobre superficie. `onError` → iniciales.

## Rams · economía (3)

- **Portada: cinco llamadas para tres destinos.** "Ver todos los proyectos", "Descubre los proyectos", "Ver los 3
  proyectos", "Enséñame otro" y "Guía para publicar". Dos van a la galería. Los textos son de Mikel (D-05), así que
  la duda no es el texto sino la cantidad: con más de diez proyectos la portada se defenderá sola y "Ver los N
  proyectos" sobrará junto al botón del héroe.
- **"Cambia en cada visita"** explica un mecanismo que a nadie le hace falta saber; "Enséñame otro" ya lo dice todo.
  Prueba de sustracción: quitarlo no rompe nada.
- **Quince ceros.** Con cero reacciones, cada tarjeta enseña cinco píldoras "0"; tres tarjetas, quince ceros sin
  información. Mostrar solo el icono hasta que haya un voto (el número aparece cuando es mayor que 0).
- **Catorce elementos por tarjeta**: título, equipo, resumen, cuatro etiquetas, tres botones, cinco reacciones y un
  enlace. Las etiquetas admiten seis: con seis, ruido. Tope visible de tres y "+n". "Vídeo" y "Código" podrían ser
  enlaces con icono bajo el principal, dejando un único botón.
- **Tipografía con pasos intermedios**: cuerpo a 15, 17 y 18 px según la página. Dos tamaños (16 y 18) bastan;
  el 15 es indecisión.
- **El buscador se corta**: "Buscar por título, equipo o etiquet". El texto largo ya está como etiqueta accesible;
  el placeholder puede ser "Buscar".

## Hadid · recorrido (4)

- **Hay entrada.** El héroe ocupa la pantalla, se llega, no se lee. Las cifras cuentan hacia arriba, el título entra
  por palabras. Es la catedral.
- **El umbral entre el héroe y el cuerpo es una línea.** El degradado índigo acaba en un borde recto y debajo
  empieza el vacío: dos habitaciones pegadas con cinta. Dejar que el índigo muera en ónice (degradado hasta el fondo,
  sin `border-b`) o solapar la cabecera del destacado unos píxeles sobre el héroe.
- **Las habitaciones existen**: héroe (índigo), destacado y tendencias (vacío), llamada a publicar (superficie),
  pie. El destacado a dos columnas es el elemento que rompe la retícula, y rompe bien.
- **La galería tiene dos catedrales.** La franja de puntos (DotGrid) mide lo mismo que un héroe y la página es un
  pasillo: el visitante viene a ver tarjetas. Bajar la franja a la mitad (título y una línea) devuelve el peso a la
  retícula.
- **Tendencias con tres proyectos deja un hueco** en la tercera columna. Se arregla solo con más proyectos; no
  tocar.
- **Móvil**: ver el apartado al final.

## Ingels · juego (3)

- **"Enséñame otro" es la pista de esquí sobre la central**: convierte un ranking en un juego de barajar. Mantener.
- **Las coordenadas del pie** (43°13′ N · 2°44′ W) son el huevo de pascua: casi nadie las lee, quien las lee sabe
  dónde está el centro. Mantener.
- **El vacío de la portada** ("El primero que llegue por pull request se lleva esta portada") es un texto con
  intención. Bien.
- **Las reacciones son cinco iconos grises de 15 px** y se parecen entre sí (pulgar, bombilla, cohete, llama,
  corazón). El efecto faro (se encienden en menta al votar) existe pero el reposo es demasiado apagado para invitar.
  Iconos a 18 px y un pelín más de contraste en reposo.
- **El 404 es una página en blanco con un número.** Oportunidad de doble uso: error *y* llamada a publicar ("Este
  proyecto todavía no existe. ¿Es el tuyo?" con el enlace a la guía), con cabecera y pie como el resto.
- **La landing de ejemplo** tiene una caja de vídeo vacía de 600 px: en una plantilla se entiende, en un ejemplo
  desanima. O se incrusta un vídeo o la caja mide 240 px.

## Norman · claridad (4)

- **Tres caminos a la landing** (imagen, título y "Ver proyecto") y los tres consistentes. Bien.
- **"Vídeo pendiente" como botón fantasma a trazos** es un estado honesto: dice "aún no" sin parecer roto.
- **Los filtros enseñan recuento** (SMR · 1): el usuario sabe qué va a pasar antes de pulsar.
- **Reacciones y filtros comparten forma** (píldora con borde). Uno filtra, otro vota. El contexto lo salva, pero
  un cambio de forma (reacciones sin borde, solo icono y número) separaría los dos verbos.
- **Dos flechas, dos significados** en el héroe: "→ Ver todos" navega, "↓ Descubre" desplaza. Correcto, pero el
  segundo botón con borde al lado del principal en menta compite. Como enlace de texto con la flecha abajo se
  entiende igual y jerarquiza mejor.
- **Login**: el placeholder "ane.garcia" en un campo oscuro parece un valor escrito. Mejor como texto de ayuda bajo
  el campo ("por ejemplo, ane.garcia").
- **Sin sesión, pulsar una reacción te lleva al login** sin avisar. El texto "Inicia sesión para reaccionar" está al
  lado, así que se entiende; la vuelta a la galería después del login cierra el círculo. Bien.
- **El propio proyecto** se ve claro: píldoras apagadas y "Es tu proyecto". Lo único: esa fila ocupa dos líneas y
  el pie de esa tarjeta queda más alto que el de las vecinas. Poner "Es tu proyecto" donde iría el enlace de login,
  en la misma línea, lo iguala.

## Tensiones

- **Rams contra Hadid en la galería**: drama (franja de puntos) contra utilidad (tarjetas). Resolución: estructura
  dramática, superficie quieta; la franja se queda pero a la mitad.
- **Ive contra Norman en Impact**: material (D-10) contra legibilidad a 20 px. Resolución: Impact donde es cartel;
  en las tarjetas, o más grande o Plex. Es decisión de Mikel.
- **Rams contra Ingels en el héroe**: menos llamadas contra más juego. Resolución: el juego ya está en "Enséñame
  otro"; sobran las llamadas duplicadas, no el juego.

## Qué cambiar, por orden de valor

1. Portada rota → iniciales (`onError` en `PortadaProyecto`). Norman, Ive. Diez minutos.
2. Ocultar el "0" de las reacciones hasta que haya votos. Rams. Diez minutos.
3. Placeholder del buscador: "Buscar". Rams. Un minuto.
4. 404 con cabecera, pie y texto de doble uso. Ingels, Norman. Media hora.
5. Quitar "Cambia en cada visita". Rams. Un minuto (texto en `i18n.jsx`, no hace falta borrar la clave).
6. Héroe que muere en ónice sin línea. Hadid. Un cuarto de hora.
7. Franja de la galería a la mitad. Hadid, Rams. Un cuarto de hora.
8. "Es tu proyecto" en la misma línea que las reacciones. Norman. Diez minutos.
9. Cuerpo a 16 y 18 px, sin 15 ni 17. Rams, Ive. Media hora y una pasada visual.
10. Iconos de reacción a 18 px y más contraste en reposo. Ingels. Diez minutos.
11. Login: ejemplo de usuario como ayuda, no como placeholder. Norman. Cinco minutos.
12. Landing de ejemplo: caja de vídeo más baja o vídeo real. Ingels. Cinco minutos (es `proyectos/`: lo toca Mikel).
13. Impact en h3: 22 px con tracking, o Plex. Ive, Norman. Decisión de Mikel (D-10).

Los puntos 1 a 11 y el 14 son cambios de la web (`apps/proyectos/web/`) que la fábrica puede hacer y están en
`factory/backlog.md` como nueve jobs, en este orden (los puntos 2, 8 y 10 van juntos, y el 3 con el 5); el 12 y el
13 son de Mikel. Ninguno toca sesión, API ni despliegue.

## Móvil (Pixel 7)

- **La cabecera ocupa tres filas** (logo y marca; Proyectos, Cómo publicar y ES/EU; "Iniciar sesión" solo en la
  tercera) y se come el umbral: en un móvil la primera pantalla es media cabecera y medio héroe. Hadid y Rams de
  acuerdo: una fila para marca, idioma y sesión; otra para la navegación; y "Cómo publicar" fuera del menú en móvil
  (ya está en la llamada del final de cada página).
- **El héroe se adapta bien**: sin altura mínima, el velo oscuro vertical deja legible el texto y la corriente queda
  como un brillo arriba. Las cifras en fila de tres caben.
- **Tarjetas a una columna, correctas.** Los tres botones ("Ver proyecto", "Vídeo", "Código") pasan a dos filas: es
  otro argumento para dejar un solo botón y "Vídeo" y "Código" como enlaces con icono (punto 4 de Rams).
- **Las cinco reacciones caben en una fila** a 412 px; con el "0" oculto cabrían con más aire.
- **Login**: el orbe desaparece (`max-md:hidden`), el formulario va a ancho completo con campos de 46 px y botón
  de 48: cómodo con el pulgar. Bien.
- **Landings** del alumnado: la plantilla responde (rejillas a una columna, tabla con scroll horizontal). Bien.

Añadido a la lista: **14. Cabecera móvil en dos filas, sin "Cómo publicar"** (Hadid, Rams; media hora), que iría
entre el 4 y el 5 por valor.

## Medición con tasteskill (inspector en navegador, 1440 / 768 / 390 px)

Segunda pasada, con otra vara: `design-taste-frontend` mide la página en un Chrome real contra sus reglas de casa
(sin etiquetas pequeñas sobre los títulos, sin monoespaciada fuera de código, sin degradados, sombras ni filetes,
dos tipografías como mucho, cinco tamaños, nada legible por debajo de 13 px) y puntúa como un jurado de Awwwards.
Conviene separar lo que mide de lo que opina.

**Lo que mide y es un defecto con cualquier vara:**

| Dónde | Medido | Qué pasa |
|---|---|---|
| Portada, móvil de 390 px | título en 3 líneas (40 px); la etiqueta de encima también parte en dos ("…CURSO 2026-/27") | la primera pantalla del móvil es cabecera de tres filas, etiqueta partida y título partido: lo que importa llega cuarto |
| Portada | 11 tamaños de letra (11 a 64 px); galería 10; entrar 10 | una escala de cinco bastaría |
| Galería | cuerpo a 15 px; 4 bloques de texto por debajo de 13 px (etiquetas, "Es tu proyecto", "Inicia sesión para reaccionar", subtítulo de la cabecera) | texto que se lee, por debajo del mínimo |
| Galería | primera pantalla sin elemento dominante: el mayor texto mide 44 px (3,1 vw) y ninguna imagen ocupa un tercio | la franja pesa pero nada manda; casa con el punto 7 si al bajar la franja el título sube a 64 px |
| Portada | el título no se lee hasta pasado 1,2 s (BlurText lo trae palabra a palabra; el `h1` real es `sr-only`) | el movimiento de firma retrasa lo primero que debería verse; con 60 ms por palabra en vez de 110 entra en plazo |
| Entrar | sin elemento dominante (título a 40 px, 31 en tableta) y nada se mueve | la página más quieta de las tres; el orbe es decorado, no foco |

**Lo que marca como FAIL y aquí es decisión** (D-04, D-07, D-09, D-10, SPEC §3), para que Mikel lo decida y no la
fábrica: las etiquetas monoespaciadas en mayúsculas sobre los títulos (`etiqueta-mono`, seis en la portada), el
degradado índigo del héroe (D-09), las sombras y el brillo de `SpotlightCard` (React Bits, D-07), los filetes de la
cabecera, del héroe, de la llamada y de la fila de reacciones, la píldora "Solo alumnado y profesorado" sobre el
título del login, y las tres tipografías (Impact, Plex Sans, Plex Mono). Dos avisos no cuentan: "Impact no cargada"
(es fuente del sistema en Windows, no una webfont; en Linux y Android entra Anton por D-10) y "texto cubierto" en una
tarjeta (es la capa transparente del foco de `SpotlightCard`, no tapa nada a la vista). "Pocas fotos" (3) es
estructural: hay tres proyectos de ejemplo.

```
ROUND 1 (portada, con la vara de tasteskill)
Seen in one second: el título en Impact sobre la corriente índigo.
Idea (one sentence): la portada es una vitrina viva: el destacado cambia en cada visita y las reacciones del
  alumnado deciden quién sale.
Live thing: "Enséñame otro" y las reacciones (con sesión).
Layout words by section: héroe=statement / destacado=split / tendencias=grid / llamada=band / pie=line
Scores: design 7 · usability 7 · creativity 6.5 · content 7 → overall 6.9, con tope 6.0 mientras haya FAIL del
  inspector (las etiquetas mono, el degradado y las sombras son decisión, así que el tope se queda salvo que Mikel
  las cambie).
Caps applied: FAIL del inspector (6.0); título de tres líneas a 390 px (6.5).
Top three problems:
1. La primera pantalla en móvil (mobile-fold.jpg): tres filas de cabecera, etiqueta partida y título en tres
   líneas. Cabecera en dos filas, etiqueta más corta o fuera en móvil, y mínimo del clamp del título a 34 px.
2. Once tamaños de letra y texto por debajo de 13 px (desktop-page-01.jpg, galería): una escala de cinco, cuerpo
   a 16 y 18, nada por debajo de 13.
3. La galería sin elemento que mande (galeria/desktop-fold.jpg): franja a la mitad y título a 64 px.
```

Los tres están en el backlog de la fábrica (cabecera móvil, título a 390 px, tipografía, franja de la galería). El
resto de FAIL son de Mikel: si decide mantener etiquetas mono, degradado y spotlight, la web no pasará nunca esta
vara, y no pasa nada; es una vara concreta, no la única.
