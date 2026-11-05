# Tiempo de lectura en el blog

> Feature: Muestra el tiempo estimado de lectura junto a la fecha en las entradas del blog y en las tarjetas del listado

## Context
Las entradas se renderizan en `src/views/BlogPostView.vue` (byline con `<time>` dentro de `.blog-post-meta`) y el listado en `src/views/BlogListView.vue` (una tarjeta por entrada, con la fecha en un `<p class="date">`). El markdown de cada entrada llega ya cargado como `content.markdown`. No existe ningún helper de conteo de palabras; `src/blog/splitAtCta.js` es el patrón de helper puro sin dependencias que hay que imitar.

## Requirements
1. Un helper puro `readingTimeMinutes(markdown)` en `src/blog/` que cuente palabras (tokens separados por espacio), divida entre 200 palabras/minuto, redondee hacia arriba y nunca devuelva menos de 1.
2. La entrada muestra `<fecha> · N min de lectura` en la misma línea y con el mismo estilo que la fecha.
3. Cada tarjeta del listado muestra lo mismo, reutilizando el `<p class="date">` existente.
4. Sin dependencias nuevas.

## Acceptance criteria
1. `node -e "import('./src/blog/readingTime.js').then(m=>console.log(m.readingTimeMinutes(''), m.readingTimeMinutes('a '.repeat(199)), m.readingTimeMinutes('a '.repeat(201))))"` imprime `1 1 2`.
2. `npm run build` termina con `✓ built`.
3. Con el servidor de desarrollo en el puerto del job, `/blog/<slug>` muestra bajo el título una línea `<fecha> · N min de lectura` donde `<time>` y el texto tienen el mismo `font-size` y `color`.
4. `/blog` muestra en cada tarjeta `<fecha> · N min de lectura`.
5. `npx eslint src/blog/readingTime.js src/views/BlogPostView.vue src/views/BlogListView.vue` no da errores.

## Out of scope
- No contar de forma distinta los bloques de código.
- No hacer configurable la velocidad de lectura.
- No tocar el orden, filtros ni paginación del listado.

## Assumptions
- 200 palabras por minuto, por ser el valor habitual en blogs. Decisión editorial menor, no de negocio.
- El separador es `·` con espacios, igual que en el pie de página existente.
