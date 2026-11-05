STATUS: READY

# Build: Límite de ritmo en el alta al newsletter

## Summary
`functions/src/subscribe.js` consulta y actualiza `rate_limits/{ip}` en una transacción antes de escribir; a partir de 5 envíos en la ventana responde 429. `NewsletterForm.vue` muestra el mensaje de error específico para 429. Test nuevo en `functions/test/subscribe.test.js`.

Commit `e51c0aa Limita el alta al newsletter a 5 envíos por IP y hora`.

## Acceptance criteria
1. [x] Test de 6 llamadas: la sexta devuelve 429.
2. [x] `npm --prefix functions test`: 9 passed.
3. [x] Con el emulador en 5130: el mensaje aparece tras el sexto envío.
4. [x] `npm run build`: `✓ built`.

## Validation
- `npm --prefix functions test`: pass.
- `npm run build`: pass.
- `npx eslint functions/src/subscribe.js src/components/NewsletterForm.vue`: pass.
- `git status --porcelain`: vacío.

## Log
### Round 1
- Transacción de Firestore para leer-incrementar el contador sin carreras.
- `shortcut: la IP sale de x-forwarded-for sin validar, revisar si se pone un proxy delante`.
