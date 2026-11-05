STATUS: READY

# Build: Página 404

## Summary
`src/views/NotFoundView.vue` nueva (patrón `<main class="page">`), ruta comodín al final de `src/router.js` y `document.title` fijado en `onMounted`. En la ronda 2, además, `firebase.json` devuelve código 404 real para la ruta comodín mediante un `rewrite` a una función de estado, a petición de la review de código.

Commits:
- `c9d81e0 Añade página 404`
- `4a77b12 Devuelve estado 404 desde hosting para rutas desconocidas`

Ficheros: `src/views/NotFoundView.vue` (nuevo), `src/router.js`, `firebase.json`.

## Acceptance criteria
1. [x] `/esto-no-existe` en 5120 muestra `Página no encontrada` y un enlace a `/`.
2. [x] `/` y `/blog` cargan igual (comprobado en el navegador).
3. [x] `npm run build`: `✓ built`.
4. [x] `npx eslint` sobre los dos ficheros: pass.

## Validation
- `npm test`: 14 passed.
- `npm run build`: pass.
- `npx eslint src/views/NotFoundView.vue src/router.js`: pass.
- `git status --porcelain`: vacío.

## Log
### Round 1
- Vista y ruta comodín. `document.title` en `onMounted`.
### Round 2
- review-code CHANGES: "la 404 devuelve HTTP 200 porque el hosting reescribe todo a index.html; los buscadores la indexarán". Añadido `rewrite` en `firebase.json` para que la ruta comodín devuelva 404 real. Marcado con `shortcut: solo cubre rutas de primer nivel, ampliar cuando haya rutas anidadas`.
- review-ux Notes atendida: el enlace a la portada ahora dice "Volver a la portada".
