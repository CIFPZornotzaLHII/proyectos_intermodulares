STATUS: READY

# Build: Tiempo de lectura en el blog

## Summary
Nuevo helper sin dependencias `readingTimeMinutes(markdown)` en `src/blog/readingTime.js` (`markdown.trim().split(/\s+/)`, 200 ppm, `Math.ceil`, mínimo 1). `BlogPostView.vue` añade `· N min de lectura` tras el `<time>` del byline; `BlogListView.vue` lo añade en el `<p class="date">` de cada tarjeta.

Commit `7f3e2a1 Añade tiempo de lectura al blog`. Ficheros:
- `src/blog/readingTime.js` (nuevo)
- `src/views/BlogPostView.vue`
- `src/views/BlogListView.vue`

## Acceptance criteria
1. [x] El comando del criterio imprime `1 1 2`.
2. [x] `npm run build`: `✓ built in 2.41s`.
3. [x] `/blog/receta-pan-de-centeno` en el puerto 5110: la línea meta muestra `12 de octubre de 2026 · 4 min de lectura`; `<time>` y el span comparten `font-size: 13px` y `color: rgb(107, 114, 128)` (comprobado con agent-browser, captura adjunta en la sesión).
4. [x] `/blog`: las 8 tarjetas muestran `<fecha> · N min de lectura`.
5. [x] `npx eslint` sobre los tres ficheros: sin errores.

## Validation
- `npm test`: 14 passed.
- `npm run build`: pass.
- `npx eslint <3 ficheros>`: pass.
- `npx prettier --check <3 ficheros>`: pass.
- `git status --porcelain`: vacío.

## Log
### Round 1
- Añadido el helper imitando el estilo de `splitAtCta.js` (doc comment de una línea, export nombrado).
- Un único commit. Sin atajos que marcar: no hay límite conocido en el helper.
