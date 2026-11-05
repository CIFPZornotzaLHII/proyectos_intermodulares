# Límite de ritmo en el alta al newsletter

> Feature: Limita el ritmo del formulario de alta al newsletter a 5 envíos por IP y hora

## Context
El formulario está en `src/components/NewsletterForm.vue` y llama a la Cloud Function `subscribe` en `functions/src/subscribe.js`, que escribe en la colección `subscribers`. No hay ningún límite: un bot puede llenar la colección.

## Requirements
1. La función `subscribe` rechaza con HTTP 429 a partir del sexto envío desde la misma IP en una ventana de 60 minutos.
2. El contador vive en Firestore (`rate_limits/{ip}`), con expiración por TTL.
3. El formulario muestra un mensaje claro cuando recibe 429.

## Acceptance criteria
1. Los tests de `functions/` incluyen un caso con 6 llamadas seguidas de la misma IP; la sexta devuelve 429.
2. `npm --prefix functions test` pasa.
3. Con el emulador, el formulario muestra "Demasiados intentos, prueba en una hora" tras recibir 429.
4. `npm run build` termina con `✓ built`.

## Out of scope
- No añadir captcha.
- No limitar por email.

## Assumptions
- 5 envíos por hora es suficiente para un uso humano normal.
