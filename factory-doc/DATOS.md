# Los datos de la fábrica: contrato para cualquier interfaz

La fábrica no tiene base de datos ni servidor. Todo su estado son **ficheros bajo `factory/`**, escritos por el orquestador
(`/factory`), por los agentes y por el cron. Una interfaz (el dashboard de `factory/dashboard/`, una pestaña en otra app, un
bot, un script) solo necesita leer esos ficheros y, como mucho, escribir las tres señales de §3. Este fichero es el contrato:
si se cumple, la interfaz se puede hacer en cualquier stack y sustituir sin tocar la fábrica.

## 1. Qué hay en `factory/`

| Ruta | Quién la escribe | En git | Qué es |
| --- | --- | --- | --- |
| `config.json` | el humano | sí | Lentes, puertos, modelos (ver `DOCUMENTACION.md` §6) |
| `backlog.md` | el humano y `/factory next` | sí | Cola de features: `- [ ] <texto>` pendiente; `- [x] <texto> → <job-id>` reclamada |
| `jobs/<job-id>/` | el orquestador y los agentes | **no** | Un job. `<job-id>` = `NNN-slug-kebab` (`^\d{3}-[a-z0-9][a-z0-9-]*$`) |
| `jobs/<job-id>/job.json` | el orquestador | no | Estado del job (§2). Se reescribe entero en cada cambio |
| `jobs/<job-id>/spec.md` | spec-writer | no | La spec. Markdown libre con secciones fijas (`## Context`, `## Requirements`, `## Acceptance criteria`, `## Out of scope`, `## Assumptions`) |
| `jobs/<job-id>/build.md` | builder | no | Primera línea `STATUS: READY` o `STATUS: BLOCKED`; luego `## Summary`, `## Acceptance criteria`, `## Validation`, `## Log` |
| `jobs/<job-id>/round-<N>/review-<lente>.md` | reviewer-&lt;lente&gt; | no | Primera línea `VERDICT: PASS` o `VERDICT: CHANGES`; luego `## Findings`, `## Notes` |
| `jobs/<job-id>/decision.md` | approver (o el orquestador al escalar) | no | Primera línea `APPROVE` o `ESCALATE`; luego el porqué y `## For the human` |
| `jobs/<job-id>/rework-<k>.md` | el orquestador | no | Nota literal de un `/factory rework` o de una fusión de `main` |
| `metrics.json` | `factory/metrics.py` (el cron, tras cada vuelta) | no | Coste por job (§2.2) |
| `approvals/<job-id>` | **una interfaz** | no | Fichero vacío: «fusiona este job». Lo consume el cron (§3) |
| `PAUSED` | **una interfaz** o el humano | no | Si existe, el cron no empieza vueltas (§3) |
| `renumerar.py`, `metrics.py`, `cron/` | el repo | sí | Herramientas; no son datos |
| `examples/jobs/` | el repo | sí | Tres jobs de muestra para probar una interfaz sin lanzar nada |

Lo que no está en git es estado de ejecución de **esta máquina**: una interfaz lo lee del disco donde corre la fábrica
(mismo host o un volumen montado de solo lectura), no de GitHub.

## 2. Esquemas

### 2.1 `job.json`

```json
{ "id": "003-rate-limiting", "feature": "Limitar el ritmo del formulario de alta",
  "branch": "factory/003-rate-limiting",
  "worktree": "/ruta/absoluta/mi-app-factory/003-rate-limiting",
  "stage": "review", "round": 2,
  "reviewers": ["security", "code", "ux", "ui"],
  "reviews": { "security": "CHANGES", "code": "PASS", "ux": "PASS", "ui": "pending" },
  "created": "2026-10-20T07:00:00Z", "updated": "2026-10-20T07:41:12Z",
  "merge_commit": null }
```

| Campo | Valores | Notas |
| --- | --- | --- |
| `stage` | `spec` · `build` · `review` · `approve` · `merged` · `needs-human` | Las cuatro primeras son «vivas». `needs-human` es lo que una interfaz tiene que enseñar primero |
| `round` | entero ≥ 0 | 0 hasta la primera ronda de revisión |
| `reviewers` | lista de lentes | Fija desde que el build pasa a la ronda 1 (antes puede faltar `ux`/`ui`) |
| `reviews` | por lente: `pending` · `PASS` · `CHANGES` | **Solo la ronda actual.** Las anteriores se leen de `round-<N>/review-<lente>.md` (primera línea) |
| `created`, `updated` | ISO 8601 UTC | `updated` de hace más de 3 h con etapa viva = job huérfano (`/factory resume`) |
| `merge_commit` | `null` o hash | Con hash, el diff del job es `git diff <hash>^1 <hash>`; sin él, `git diff main...<branch>` |

Derivados que toda interfaz calcula igual: **veredicto de una ronda pasada** = primera línea de cada `review-<lente>.md`
(`missing` si no existe, `invalid` si no empieza por `VERDICT:`); **por qué espera un job** = primera línea de
`decision.md` o, si `build.md` empieza por `STATUS: BLOCKED`, su sección `## Blocked`; **duración** = `created`→`updated`
solo si `stage` es `merged` (si no, el job acumula espera).

### 2.2 `metrics.json`

```json
{ "updated": "2026-10-29T10:15:00",
  "jobs": [ { "id": "001-…", "stage": "merged", "round": 1, "sessions": 5, "shared": 0,
              "minutes": 17, "turns": 136, "output_tokens": 25731, "input_tokens": 5378231,
              "ctx_max": 195336, "ctx_avg": 66368, "models": { "opus-5-5": 88, "sonnet-5-5": 48 } } ] }
```

`minutes` es tiempo de pared de las sesiones del job (no la espera entre vueltas); `input_tokens` incluye la caché;
`shared` > 0 marca una sesión repartida entre jobs. Totales y medias los calcula la interfaz.

## 3. Lo que una interfaz puede escribir

Tres cosas y nada más. **Nunca `job.json`** ni los ficheros de los agentes: son del orquestador.

| Señal | Cómo | Quién la consume |
| --- | --- | --- |
| Aprobar un job en `needs-human` | Crear el fichero vacío `factory/approvals/<job-id>` (solo si `stage` es `needs-human`) | `factory/cron/factory-next.sh` lo borra y ejecuta `/factory approve <job-id>` en su siguiente vuelta. Si la fusión falla, el job sigue en `needs-human` y se puede aprobar otra vez |
| Pausar o reanudar la fábrica | Crear o borrar `factory/PAUSED` | El cron sale sin hacer nada mientras exista |
| Editar el backlog | Reescribir `factory/backlog.md` respetando el formato de §1 | `/factory next`. Si la interfaz permite editar, debe releer antes de guardar: el orquestador puede haber reclamado una línea entre medias |

Un `rework` (devolver un job con una nota) no tiene señal de fichero: se hace con `/factory rework <job-id> <nota>` en Claude
Code. Si una interfaz lo necesita, la señal natural sería `factory/reworks/<job-id>.md` con la nota; el cron de este repo no
la lee todavía.

## 4. Lo que una interfaz tiene que enseñar

Mínimo, por este orden (es lo que una semana de uso real pidió):

1. **Esperan tu OK**: los jobs en `needs-human`, con su porqué (§2.1) y la acción de aprobar. Es la única pantalla que el
   humano necesita mirar; lo demás es curiosidad.
2. **Jobs**: lista por etapa, con los veredictos por ronda como chips, y el detalle de cada uno (spec, build, reviews,
   decisión, diff y commits de la rama).
3. **Backlog**: lo pendiente y lo reclamado.
4. **Métricas**: por job y totales (`metrics.json`); el reparto por modelo dice cuánta cuota se va en cada cosa.
5. **Interruptor** (`PAUSED`) y, si hay cron, cuándo es la siguiente vuelta (eso lo sabe el crontab, no la fábrica).

El dashboard de `factory/dashboard/` cumple 1, 2, 4 (crudo) y 5 y sirve de referencia: `node factory/dashboard/server.mjs
--examples` lo enseña con los jobs de muestra. Corre como servicio de desarrollo aparte (`docker compose -f
docker/compose.yaml --profile dev up -d dashboard`), nunca dentro del producto.
