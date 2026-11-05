VERDICT: PASS

## Checks
`npm test`: pass (14)
`npm run build`: pass
`npx eslint src/blog/readingTime.js src/views/BlogPostView.vue src/views/BlogListView.vue`: pass

## Findings
None.

## Notes
`''.trim().split(/\s+/)` devuelve `['']` (longitud 1), y el mínimo de 1 lo cubre; comentado en el helper. Cambio mínimo, sin abstracciones de más.
