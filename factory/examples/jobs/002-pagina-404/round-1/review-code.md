VERDICT: CHANGES

## Checks
`npm run build`: pass
`npx eslint src/views/NotFoundView.vue src/router.js`: pass

## Findings
1. `src/router.js:41` La página 404 se sirve con HTTP 200 porque `firebase.json` reescribe cualquier ruta a `index.html`. Los buscadores indexarán URLs rotas como páginas válidas. Hace falta que el hosting devuelva 404 real para la ruta comodín, o documentar explícitamente por qué no.

## Notes
None.
