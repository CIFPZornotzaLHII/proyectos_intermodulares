ESCALATE

## Why
El cambio es correcto y las cuatro reviews de la ronda 2 son PASS, pero la ronda 2 modificó `firebase.json`, que es configuración de hosting: está en la lista de cambios que siempre necesitan un humano. Además, `CLAUDE.md` dice que el hosting no se toca sin aprobación. El merge es limpio (`git merge-tree` sin conflictos).

## Acceptance criteria
1. Ruta desconocida: cumplido, lo comprobé en el puerto 5120.
2. Rutas existentes: cumplido según build.md y la review de UX.
3. Build: cumplido, lo repetí.
4. Lint: cumplido, lo repetí.

## For the human
Decide si el `rewrite` nuevo de `firebase.json` (líneas 12–18) es aceptable: devuelve 404 real para rutas desconocidas, con el coste de una Cloud Function de estado. Si prefieres no tocar hosting, ejecuta `/factory rework 002-pagina-404 "quita el cambio de firebase.json y documenta en NotFoundView por qué la 404 devuelve 200"`. Si es correcto, `/factory approve 002-pagina-404`.

Ficheros: `firebase.json`, `src/router.js`, `src/views/NotFoundView.vue`.
