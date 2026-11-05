#!/bin/sh
# La fábrica sola, por cron: cada vuelta fusiona lo aprobado desde una interfaz (factory/approvals/<job-id>, ver
# factory-doc/DATOS.md) y después construye el primer ítem sin hacer de factory/backlog.md con /factory next.
# Un job a la vez (flock). Usa la sesión de Claude Code del usuario, nunca la API. Fusiona en main local; nunca hace push.
# Interruptor: `touch factory/PAUSED` para parar; borrarlo para seguir. El dashboard lo pone y lo quita.
# crontab de ejemplo (cada 5 min; `modo` e `intervalo_min` de factory/config.json deciden cuándo empieza un job):
#   */5 * * * * /ruta/al/repo/factory/cron/factory-next.sh >> "$HOME/factory-<repo>.log" 2>&1
set -eu
cd "$(dirname "$0")/../.."
export PATH="$PATH:$HOME/.local/bin"   # cron no trae ~/.local/bin, donde suele estar claude
unset ANTHROPIC_API_KEY                 # si estuviera definida, se facturaría como API
MODEL="${FACTORY_ORCHESTRATOR_MODEL:-sonnet}"   # el orquestador solo coordina; cada agente lleva su modelo
now() { date '+%F %T'; }

exec 9>"/tmp/factory-$(basename "$PWD").lock"
flock -n 9 || { echo "$(now) sigue el job anterior"; exit 0; }
[ -f factory/PAUSED ] && { echo "$(now) en pausa (factory/PAUSED)"; exit 0; }
# el merge necesita main limpio (el backlog aparte): si alguien trabaja en el repo, esta vuelta no empieza
if [ "$(git branch --show-current)" != main ] || [ -n "$(git status --porcelain -- . ':!factory/backlog.md')" ]; then
  echo "$(now) el checkout principal no está limpio en main: no se empieza"
  exit 0
fi

# aprobaciones de una interfaz: un fichero vacío por job. Se borra antes de lanzar para no repetirlo si falla;
# el job sigue en needs-human y se puede aprobar otra vez. El nombre se valida antes de ir a un prompt con permisos auto.
for f in factory/approvals/*; do
  [ -e "$f" ] || continue
  id=$(basename "$f"); rm -f "$f"
  expr "$id" : '[0-9][0-9][0-9]-[a-z0-9-]*$' >/dev/null || { echo "$(now) aprobación descartada: $id"; continue; }
  echo "$(now) /factory approve $id"
  if timeout 1h claude -p "/factory approve $id" --permission-mode auto --model "$MODEL"; then rc=0; else rc=$?; fi
  echo "$(now) fin de /factory approve $id (código $rc)"
done

grep -q '^- \[ \] .' factory/backlog.md || { echo "$(now) backlog vacío"; exit 0; }
# modo e intervalo, de factory/config.json: `encadenado` empieza un job en cuanto el anterior acaba (el cron pasa cada 5 min y el
# lock impide dos a la vez); `cron` espera `intervalo_min` minutos entre un inicio y el siguiente. Sin las claves, `cron` con 30.
read -r modo intervalo <<EOF2
$(python3 -I -c 'import json,sys
try:
    c=json.load(open(sys.argv[1]))
except (OSError, ValueError):
    c={}
m=c.get("modo","cron"); i=c.get("intervalo_min",30)
print(m if m in ("cron","encadenado") else "cron", i if isinstance(i,int) and 1<=i<=1440 else 30)' factory/config.json)
EOF2
ultimo=$(cat "/tmp/factory-$(basename "$PWD").last" 2>/dev/null || echo 0)
if [ "$modo" = cron ] && [ $(( $(date +%s) - ultimo )) -lt $((intervalo * 60)) ]; then
  exit 0
fi
date +%s > "/tmp/factory-$(basename "$PWD").last"
echo "$(now) /factory next"
if timeout 3h claude -p "/factory next" --permission-mode auto --model "$MODEL"; then rc=0; else rc=$?; fi
echo "$(now) fin (código $rc)"
python3 -I factory/metrics.py >/dev/null 2>&1 || true
