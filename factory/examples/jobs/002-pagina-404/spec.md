# Página 404

> Feature: Añade una página 404 para rutas desconocidas en vez de dejar la pantalla en blanco

## Context
El router está en `src/router.js` (Vue Router, modo history). No hay ruta comodín: una URL desconocida deja el `<router-view>` vacío. El hosting es Firebase (`firebase.json` reescribe todo a `index.html`), así que la 404 se decide en el cliente. `src/views/` tiene vistas simples con `<main class="page">` como patrón.

## Requirements
1. Una vista `NotFoundView.vue` con título, una frase y un enlace a la portada.
2. Una ruta comodín `/:pathMatch(.*)*` al final de `src/router.js`.
3. El `<title>` del documento pasa a ser `Página no encontrada`.

## Acceptance criteria
1. Con el servidor de desarrollo, `/esto-no-existe` muestra el título `Página no encontrada` y un enlace a `/`.
2. Las rutas existentes siguen funcionando: `/` y `/blog` cargan como antes.
3. `npm run build` termina con `✓ built`.
4. `npx eslint src/views/NotFoundView.vue src/router.js` no da errores.

## Out of scope
- No añadir buscador ni sugerencias de rutas.
- No tocar la configuración de hosting.

## Assumptions
- El texto de la página es editorial, no de negocio: "No encontramos esa página."
