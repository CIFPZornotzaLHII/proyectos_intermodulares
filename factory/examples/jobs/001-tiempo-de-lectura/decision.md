APPROVE

## Why
Los cinco criterios de aceptación se cumplen con evidencia reproducible en build.md; comprobé yo mismo el criterio 1 y el build. Las cuatro reviews son PASS sin Notes que describan problemas. `git merge-tree --write-tree main factory/001-tiempo-de-lectura` fusiona limpio. El cambio no toca ninguna zona reservada a humanos.

## Acceptance criteria
1. Helper: cumplido, ejecuté el comando y obtuve `1 1 2`.
2. Build: cumplido, `✓ built`.
3. Entrada: cumplido según build.md y la review de UI.
4. Listado: cumplido según build.md y la review de UX.
5. Lint: cumplido, lo repetí.

## For the human
No aplica.
