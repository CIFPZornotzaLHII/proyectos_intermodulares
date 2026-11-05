---
name: factory
description: Ejecuta la fábrica de software. Úsala cuando el usuario escriba /factory <feature>, /factory next, /factory resume <job-id>, /factory approve <job-id>, /factory rework <job-id> <nota> o /factory status. La sesión que la ejecuta se convierte en el orquestador del bucle spec → build → review → approve.
argument-hint: "<feature> | next | resume <job-id> | approve <job-id> | rework <job-id> <nota> | status"
disable-model-invocation: true
---

# Factory

Eres el orquestador de un job. Ejecutas el bucle de abajo, lanzas cada agente
y eres el único que escribe el `job.json` de tu job. **Nunca escribes código,
specs, reviews ni decisiones tú mismo.** Los agentes hacen el trabajo y cada
uno escribe un único fichero; tú mueves el job de etapa en etapa y mantienes
`job.json` al día.

Argumentos recibidos: `$ARGUMENTS`

## El bucle

```
feature → spec-writer → builder → [reviewers en paralelo] → ESPERAR A TODOS
                           ▲                                      │
                           └──── algún CHANGES: reanudar builder ◄─┤
                                                                  ▼ todos PASS
                     main con conflicto → builder fusiona main (una vez) ◄─┐
                                                                  ▼
                               merge a main ◄─ APPROVE ─ approver ─ ESCALATE → needs-human
```

Las ramas escriben su decisión como `D-NEW`; el número lo pones tú en **Merge**
(`factory-doc/DECISIONES.md`). Un conflicto con `main` no es cosa del humano: antes de aprobar, un
builder fusiona `main` en la rama.

| Paso    | Agente (`subagent_type`)     | Escribe                                      |
| ------- | ---------------------------- | -------------------------------------------- |
| spec    | `spec-writer`                | `spec.md`                                    |
| build   | `builder`                    | `build.md` + commits en `factory/<job-id>`   |
| review  | `reviewer-<lente>` (uno por lente de `config.reviewers`) | `round-N/review-<lente>.md` |
| approve | `approver`                   | `decision.md`                                |

**Cada agente se lanza en primer plano** (`run_in_background: false`) y se
espera su resultado en el mismo turno; los reviewers de una ronda van en un
solo mensaje con varias llamadas en primer plano, que corren en paralelo.
Nunca termines el turno con un agente en marcha "esperando el aviso": el cron
corre `claude -p`, que acaba con el turno y mata a los agentes en segundo
plano (así quedaron seis jobs en `build` sin `build.md` en un proyecto real).

Cada agente lleva un bloque «Contexto a dieta»: salida corta de los comandos, diff por partes, repo por su mapa,
`CLAUDE.md` por secciones y sin logs en los ficheros de la fábrica. `factory/metrics.py` (lo corre el cron tras cada vuelta)
mide por job minutos, turnos, tokens y tamaño de contexto en `factory/metrics.json`.

Todos los agentes leen `CLAUDE.md` (o `AGENTS.md`) del repo para saber cómo
instalar, arrancar el servidor de desarrollo, validar y qué convenciones
seguir. Nada específico del repo vive en los ficheros de la fábrica.

## Configuración

Antes de nada lee `factory/config.json`:

| Clave                | Significado                                                                                          |
| -------------------- | ---------------------------------------------------------------------------------------------------- |
| `reviewers`          | Lentes de revisión que corren en cada ronda. Para cada `<lente>` existe `.claude/agents/reviewer-<lente>.md`. |
| `optional_reviewers` | Lentes disponibles pero apagadas. Solo corren si el usuario las pasa en el comando (ver `--with`). |
| `web_reviewers`      | Lentes que solo corren si el diff del build toca `web_paths`. Se deciden una vez, al pasar el build a la ronda 1, y quedan fijas para el job. |
| `web_paths`          | Globs (relativos al repo) que definen «toca la interfaz web». Se comprueban con `git diff --name-only main...factory/<job-id> -- ':(glob)<path>'…`. |
| `reviewers_policy`   | `siempre` (por defecto): `REVIEWERS` es `config.reviewers`. `segun-cambio`: la lente `security` solo corre si el diff del build toca `security_paths` (se decide una vez, junto a las lentes web, en **Comprobación del build**); `code` corre siempre. Antes de usarla, ajusta `security_paths` a las carpetas de tu proyecto. |
| `security_paths`     | Globs que definen «toca algo con riesgo»: API, servidor, docker, scripts, dependencias. Se comprueban igual que `web_paths`. |
| `builder_small_model`| Modelo del builder cuando la spec dice `Tamaño: pequeño` en las primeras líneas. `null` = el del frontmatter. Solo cambia el modelo al lanzar el builder; reanudarlo mantiene el de su sesión. |
| `modo`, `intervalo_min` | Los lee `factory/cron/factory-next.sh`, no el orquestador: `encadenado` empieza un job en cuanto el anterior acaba (el cron pasa cada 5 min), `cron` espera `intervalo_min` minutos entre un inicio y el siguiente. |
| `max_resumes`        | Veces que el builder puede reanudarse tras la ronda 1. Con 2, un job tiene como mucho 3 rondas.      |
| `port_base`          | Base de los puertos del servidor de desarrollo (ver **Prompts**).                                    |
| `worktree_dir`       | Dónde se crean los worktrees. Relativo a `<repo>`; `{name}` se sustituye por el nombre de la carpeta del repo. Por defecto `../{name}-factory` (al lado del repo). |
| `ponytail`           | Lo usa el hook `.claude/hooks/ponytail-inject.js`, no tú.                                            |
| `models`             | Modelo por agente. `null` = el `model:` del frontmatter del agente. Si no es `null`, pásalo como parámetro `model` al lanzar ese agente. |

`REVIEWERS` = `config.reviewers` más las lentes extra que el usuario haya
pedido con `--with <lente>[,<lente>]` al final del comando (solo se admiten
lentes de `optional_reviewers` o de `web_reviewers`), más las de `web_reviewers`
que añade **Comprobación del build** si el diff toca `web_paths`. Desde
ese momento el conjunto es fijo para todo el job y se guarda en `job.json`.
Antes del build, `job.json` lleva solo las lentes conocidas.

## Jobs en paralelo

**Recomendado: un job a la vez.** Dos jobs construyendo a la par costaron el
doble en un proyecto real (cada uno rebasa al otro) y comparten la cuota de la
suscripción. La fábrica lo permite; el cron (`factory/cron/factory-next.sh`) no.

Cada job corre en su propio git worktree y su propia rama, así que pueden
correr varios a la vez, uno por sesión de Claude Code. Para tres features, abre
tres sesiones en este repo y lanza `/factory` en cada una. Tu sesión orquesta
solo el job que ella empezó o que le han pasado.

- Tu sesión se queda en el checkout principal. Los agentes trabajan en el
  worktree del job. El checkout principal es del usuario: puede estar sucio o
  en otra rama. Solo **Merge** lo toca.
- El estado del job vive en `factory/jobs/<job-id>/` del checkout principal,
  nunca en un worktree. Cada job tiene su propio `job.json`, así que dos
  sesiones nunca escriben el mismo fichero.
- Cada job recibe sus propios puertos y sesiones de `agent-browser` (ver
  **Prompts**), de modo que los reviewers de jobs distintos nunca ven las
  páginas del otro.

## Ficheros

`<repo>` es el checkout principal (`git rev-parse --show-toplevel` desde tu
sesión) y `<name>` el nombre de su carpeta. `factory/jobs/` está en
`.gitignore`: es estado de ejecución y nunca entra en un commit.

```
<repo>/factory/config.json                     configuración (ver arriba)
<repo>/factory/backlog.md                      cola para /factory next
<repo>/factory/jobs/<job-id>/job.json          estado del job (lo escribes tú, lo lee el dashboard)
<repo>/factory/jobs/<job-id>/spec.md
<repo>/factory/jobs/<job-id>/build.md
<repo>/factory/jobs/<job-id>/rework-<k>.md     lo escribes tú, desde /factory rework
<repo>/factory/jobs/<job-id>/round-<N>/review-<lente>.md
<repo>/factory/jobs/<job-id>/decision.md
<repo>/../<name>-factory/<job-id>/             el worktree del job (config.worktree_dir), en la rama factory/<job-id>
```

### job.json

```json
{ "id": "003-rate-limiting", "feature": "Limitar el ritmo del formulario de alta",
  "branch": "factory/003-rate-limiting",
  "worktree": "/Users/tu/code/mi-app-factory/003-rate-limiting",
  "stage": "review", "round": 2,
  "reviewers": ["security", "ux", "ui", "code"],
  "reviews": { "security": "CHANGES", "ux": "PASS", "ui": "pending", "code": "PASS" },
  "created": "2026-10-20T07:00:00Z", "updated": "2026-10-20T07:41:12Z",
  "merge_commit": null }
```

- `stage` es uno de `spec`, `build`, `review`, `approve`, `merged`,
  `needs-human`. Preparar el worktree cuenta como `spec`.
- `round` es la ronda de revisión actual (0 hasta que empieza la primera).
- `reviewers` es el conjunto `REVIEWERS` del job; `reviews` tiene una clave por
  cada uno, solo de la ronda actual, con valor `pending`, `PASS` o `CHANGES`.
  Las rondas anteriores viven en sus carpetas `round-<N>/`, que el dashboard
  lee directamente.
- `created` se escribe una vez; `updated` en cada cambio (ISO 8601, UTC).
- `merge_commit` es `null` hasta el merge; después, el hash del commit de merge.
  El dashboard lo usa para enseñar el diff de un job ya fusionado.
- Reescribe el fichero entero en cada cambio. `worktree` es siempre una ruta
  absoluta.

### Prompts

Todo prompt de agente empieza con las rutas absolutas del job:
`Job folder: <repo>/factory/jobs/<job-id>/. Worktree: <worktree>. Branch: factory/<job-id>.`
Abajo, `<paths>` representa esa frase.

Los agentes que abren páginas reciben además un puerto. Con `n` el número del
job (`003` → 3) y `B` = `config.port_base`: el builder recibe `B + 10n`,
`reviewer-ux` recibe `B + 10n + 1` y `reviewer-ui` recibe `B + 10n + 2`,
añadido como ` Port: <puerto>.`

Si `config.models["<agente>"]` no es `null`, lanza ese agente con el parámetro
`model` igual a ese valor. Si es `null`, no pases `model`: manda el frontmatter
del agente.

## /factory <feature>

Si el comando termina en `--with <lente>[,<lente>]`, quita ese sufijo: la
feature es el texto anterior y las lentes van a `REVIEWERS`.

1. **Crea el job.** `mkdir -p factory/jobs`; elige el siguiente número de 3
   cifras después de la carpeta de número más alto en `factory/jobs/` (`001` si
   no hay ninguna) y un slug kebab-case de 2–4 palabras de la feature:
   `004-tiempo-de-lectura`. Reclámalo con `mkdir factory/jobs/<job-id>` (sin
   `-p`). Si falla porque otra sesión cogió el número, prueba el siguiente.
   La ruta del worktree es `<repo>/<config.worktree_dir>/<job-id>` con `{name}`
   sustituido por `$(basename "$PWD")`, resuelta a ruta absoluta desde `<repo>`
   (con el valor por defecto: `$(cd .. && pwd)/$(basename "$PWD")-factory/<job-id>`). Escribe `job.json` con ese `worktree`,
   `stage: "spec"`, `round: 0`, `reviewers: REVIEWERS`, todas las reviews
   `pending`, `created` y `updated` ahora y `merge_commit: null`.
2. **Worktree.** Crea la rama y su worktree desde `main`:
   ```bash
   git worktree add -b factory/<job-id> <worktree> main
   ```
   Después, dentro del worktree, ejecuta la preparación que `CLAUDE.md` indica
   para un checkout nuevo (instalar dependencias, por ejemplo). Si algo falla,
   para y díselo al usuario.
3. **Spec.** Lanza `spec-writer` con el prompt
   `<paths> Feature: <feature, literal>`.
   Espera a que termine y comprueba que existe `spec.md`.
4. **Build.** Pon `stage: "build"`. Lanza `builder` **con el nombre
   `builder-<job-id>`** y el prompt `<paths> Build round 1. Port: <puerto>.`
   Si `config.builder_small_model` no es `null` y `spec.md` lleva `Tamaño: pequeño` en las primeras líneas, pasa ese
   valor como parámetro `model` al lanzar el builder; con `medio`, `grande` o sin la línea, manda lo de
   `config.models.builder` o el frontmatter.
   Espera a que termine y ve a **Comprobación del build**.

### Comprobación del build

Lee la primera línea de `build.md`.

- `STATUS: READY`: si es la primera comprobación del job (aún no hay `round-1/`), decide las
  lentes web: ejecuta en `<repo>`
  `git diff --name-only main...factory/<job-id> -- ':(glob)<glob-1>' ':(glob)<glob-2>' …`
  (un `:(glob)` por cada entrada de `config.web_paths`). Si imprime algún fichero, añade `config.web_reviewers` a `REVIEWERS`
  y escribe en `job.json` `reviewers` y una review `pending` por lente nueva. Si no imprime nada, esas lentes no
  corren en este job; basta con que no estén en `reviewers`.
  Con `reviewers_policy: "segun-cambio"`, decide también `security` en este momento: ejecuta
  `git diff --name-only main...factory/<job-id> -- ':(glob)<cada glob de config.security_paths>'…`; si no imprime nada,
  quita `security` de `REVIEWERS` y de `job.json` (ni review pendiente ni ronda para esa lente) y escribe una línea en
  el log del job («security omitida: el diff no toca security_paths»).
  Después empieza la siguiente ronda de revisión.
- `STATUS: BLOCKED`: ve a **Needs human**.

### Ronda de revisión N

1. Pon `stage: "review"`, `round: N` y todas las reviews a `pending`. Crea
   `factory/jobs/<job-id>/round-<N>/`.
2. Lanza todos los reviewers de `REVIEWERS` **en un solo mensaje**, para que
   corran en paralelo. Cada uno recibe el prompt `<paths> Review round N.`,
   más su puerto en el caso de `reviewer-ux` y `reviewer-ui`.
3. **ESPERA A TODOS.** Cada vez que un reviewer termine, lee la primera línea
   de su fichero (`VERDICT: PASS` o `VERDICT: CHANGES`) y escribe ese veredicto
   en `job.json` de inmediato, para que los chips del dashboard se vayan
   rellenando. La ronda termina solo cuando existen todos los
   `review-<lente>.md` de `round-<N>/`. Nunca reanudes el builder a mitad de
   ronda. Si un reviewer termina sin escribir su fichero, o su primera línea no
   es un veredicto, relánzalo una vez con el mismo prompt más
   `Escribir ese fichero es tu entrega: créalo.` Si vuelve a pasar, escribe tú
   `decision.md` con `ESCALATE`, una línea en blanco y
   `reviewer-<lente> no escribió round-<N>/review-<lente>.md (dos intentos).`, y ve
   a **Needs human**: así el dashboard lo enseña como esperando al humano.
4. Decide:
   - **Todos PASS**: ve a **Approve**.
   - **Algún CHANGES y quedan reanudaciones** (`N - 1 < max_resumes`): pon
     `stage: "build"` y reanuda el mismo builder con `SendMessage` a
     `builder-<job-id>`:
     `Round N reviews are in factory/jobs/<job-id>/round-<N>/. Address every review with VERDICT: CHANGES, commit, and update build.md for round N+1.`
     Espera a que termine y ve a **Comprobación del build**.
   - **Algún CHANGES y no quedan reanudaciones**: escribe tú `decision.md` con
     `ESCALATE`, una línea en blanco y
     `Rondas de revisión agotadas. CHANGES pendientes en round-<N>/ de: <lentes>.`
     Ve a **Needs human**.

### Approve

Pon `stage: "approve"`. Antes de lanzar al approver, comprueba que la rama
entra en `main`:

```bash
git merge-tree --write-tree main factory/<job-id>
```

Si imprime conflictos (código de salida 1) y el job aún no ha tenido una
**Fusión de main**, ve a **Fusión de main**. Si ya la tuvo y sigue chocando,
escribe tú `decision.md` con `ESCALATE`, una línea en blanco y
`Sigue en conflicto con main después de fusionarlo: <ficheros>.`, y ve a
**Needs human**.

Si entra limpio, lanza `approver` con el prompt `<paths> Final round: N.`
Cuando termine, lee la primera línea de `decision.md`:

- `APPROVE`: ve a **Merge**.
- `ESCALATE`: ve a **Needs human**.

### Fusión de main

`main` avanzó mientras el job se construía (otro job entró antes, casi siempre
con su decisión en `docs/DECISIONS.md`). Es un
rework automático, sin pedir nada a nadie:

1. Escribe `factory/jobs/<job-id>/rework-<k>.md` (`k`, el siguiente número
   libre) con, literal:
   `Fusión de main: main avanzó mientras se construía esta rama. Ejecuta git merge main en el worktree, resuelve los conflictos conservando los dos lados (en docs/DECISIONS.md la decisión de esta rama, D-NEW, va arriba del todo; se conservan los tests de las dos ramas), commitea el merge y vuelve a validar con los comandos de CLAUDE.md §Validación. No cambies nada más. Actualiza build.md.`
2. Pon `stage: "build"` y lanza un `builder` nuevo, `builder-<job-id>`, con
   `<paths> Rework: read rework-<k>.md and address it, then update build.md for round N+1. Port: <puerto>.`
   Espera a que termine.
3. **Comprobación del build** y, con `STATUS: READY`, vuelve a **Approve** sin
   ronda de revisión nueva: la rama solo ha absorbido `main`, y el diff
   `main...factory/<job-id>` que ve el approver es el mismo que revisaron las
   lentes. `round` no cambia. Con `STATUS: BLOCKED`, **Needs human**. Si el
   builder cambió más de lo que pedía el merge, **no escales por eso**: lo juzga
   el approver sobre el diff (ficheros generados incluidos). Solo
   `STATUS: BLOCKED` lleva a Needs human.

### Merge

El merge ocurre en el checkout principal, así que tiene que estar limpio y en
`main`: `git status --porcelain -- . ':!factory/backlog.md'` no imprime nada y
`git branch --show-current` imprime `main`. `factory/backlog.md` está exento:
cada `/factory next` lo edita y las ramas de job nunca lo tocan, así que un
backlog sucio no puede chocar con el merge. Si no está limpio, pon
`stage: "needs-human"` y di al usuario que el job está aprobado pero el
checkout principal está ocupado; cuando lo limpie, ejecutará
`/factory approve <job-id>`. Si está limpio:

1. **Numera la decisión.** La rama escribe su decisión como `D-NEW`.
   `factory/renumerar.py` calcula el siguiente número libre (el mayor
   `### D-nn` de `docs/DECISIONS.md` en `main` más uno) y sustituye `D-NEW`
   solo en las líneas que la rama añade, para no tocar la prosa que habla de
   la convención:
   ```bash
   python3 factory/renumerar.py <worktree>      # imprime los ficheros y D-nn
   git -C <worktree> commit -am "D-NEW pasa a D-<nn>"
   ```
   Si sale con código 3 (`sin D-NEW`), la rama no trae decisión: sigue sin
   commit. Es la única edición que haces en un worktree, y es mecánica.
2. **Fusiona.**
   ```bash
   git merge --no-ff factory/<job-id> -m "Merge factory/<job-id>"
   git rev-parse HEAD
   git worktree remove <worktree>
   git branch -d factory/<job-id>
   ```

Guarda el hash que imprime `git rev-parse HEAD` en `merge_commit` y pon
`stage: "merged"`. Si el merge falla, ejecuta `git merge --abort` (si hay un
merge en curso), pon `stage: "needs-human"` y di al usuario por qué. Si falla
quitar el worktree, el job sigue fusionado: enseña al usuario lo que imprimió
`git worktree remove`. **Nunca hagas push.**

Un `/factory approve` manual de un job que lleva tiempo en `needs-human` pasa
por la misma comprobación de **Approve**: si `main` avanzó, primero **Fusión
de main**, luego el merge.

### Needs human

Pon `stage: "needs-human"`. La rama y su worktree se quedan para que el humano
los inspeccione. Di al usuario qué job espera, dale la ruta del worktree y
cita `decision.md` (o el motivo BLOCKED de `build.md`).

## /factory next

Antes del backlog, **reanuda un huérfano**: si algún `factory/jobs/*/job.json`
tiene `stage` en `spec`, `build`, `review` o `approve` y `updated` de hace más
de 3 h (el tope del cron), nadie lo está moviendo. Coge el de número más bajo,
ejecuta `/factory resume <job-id>` y para: el backlog espera a la siguiente
vuelta.

Si no hay ninguno, lee `factory/backlog.md` y coge el primer ítem `- [ ]` con texto (una línea vacía `- [ ]` se salta). Reclámalo con un único
Edit que sustituya su línea exacta por `- [x] <ítem> → claimed`. Si el Edit
falla porque la línea cambió, otra sesión lo reclamó: relee el backlog y prueba
el siguiente `- [ ]`. Si no queda ninguno, dilo y para.

Ejecuta `/factory <ítem>` y, en cuanto el paso 1 le dé un job id, sustituye
`claimed` en su línea del backlog por el job id.

## /factory resume <job-id>

Para un job cuyo orquestador murió a medias (límite de uso, timeout, sesión
cerrada). Continúa desde su etapa real, sin rehacer lo entregado:

1. Si el worktree tiene un merge a medias (`git -C <worktree> rev-parse -q --verify MERGE_HEAD`),
   ejecuta `git -C <worktree> merge --abort`. Pon `updated` ahora.
2. Según lo que hay en la carpeta del job:
   - sin `spec.md`: paso 3 de `/factory <feature>` (spec) y sigue;
   - `stage` `spec` o `build` y sin `build.md`, o con `build.md` más viejo que
     el último commit de la rama o que los cambios sin commit del worktree:
     pon `stage: "build"` y lanza un `builder` nuevo, `builder-<job-id>`, con
     `<paths> Resume: el builder anterior murió a medias. Los commits de la rama y los cambios sin commit del worktree son su trabajo: revísalo, termínalo, fusiona main si va por detrás, valida y escribe build.md para la ronda N+1. Port: <puerto>.`
     (`N` es `round`; si existe `round-<N>/` con algún CHANGES, añade
     `Atiende también las reviews CHANGES de round-<N>/.`). Sigue en
     **Comprobación del build**;
   - `build.md` con `STATUS: READY` y al día: siguiente ronda de revisión
     (`round + 1`, o la misma `round` si `stage` es `review` y faltan ficheros
     de esa ronda: entonces lanza solo los reviewers que faltan);
   - `stage` `approve` sin `decision.md`: **Approve**.

## /factory approve <job-id>

El job debe estar en `needs-human`. Comprueba `git merge-tree` como en
**Approve** (con **Fusión de main** si hace falta, y entonces vuelve aquí en
vez de al approver) y ejecuta **Merge** con ese job id.

## /factory rework <job-id> <nota>

El job debe estar en `needs-human`.

1. Escribe la nota, literal, en `factory/jobs/<job-id>/rework-<k>.md`, donde
   `k` es el siguiente número libre.
2. Pon `stage: "build"`.
3. Lanza un `builder` nuevo con el nombre `builder-<job-id>` y el prompt
   `<paths> Rework: read rework-<k>.md and address it, then update build.md for round N+1. Port: <puerto>.`
   (`N` es la última ronda del job.) Un rework recibe `max_resumes` de nuevo.
4. Continúa desde **Comprobación del build**, exactamente como un job nuevo.

## /factory status

No lanza nada. Lee cada `factory/jobs/*/job.json` y muestra una tabla con
`id`, `stage`, `round` y los veredictos de la ronda actual, y debajo los jobs
en `needs-human` con la primera línea de su `decision.md`. Recuerda al usuario
que el dashboard (`node factory/dashboard/server.mjs`, o cualquier interfaz que
siga `factory-doc/DATOS.md`) enseña lo mismo en vivo.

## Informar

Mantén al usuario al día con una línea corta por transición, por ejemplo
`003-rate-limiting: ronda 2, security CHANGES, ux/ui/code PASS → reanudando builder`.
Cuando el job termine, di si se fusionó o necesita un humano, y por qué.
