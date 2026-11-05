#!/usr/bin/env bash
# Despliegue del servidor de proyectos (proxy + web): trae el repo, crea los .env que falten, reconstruye lo
# que haya cambiado, espera a que todo esté sano y comprueba las rutas del proxy.
# Se ejecuta EN EL SERVIDOR (a mano, por SSH desde desplegar.ps1, o desde GitHub Actions):
#     bash ~/proyectos_intermodulares/servidor/desplegar.sh
set -u
REPO_DIR="${REPO_DIR:-$HOME/proyectos_intermodulares}"
C_V=$'\e[1;32m'; C_A=$'\e[1;33m'; C_R=$'\e[1;31m'; C_M=$'\e[1;35m'; C_F=$'\e[0m'
ok(){ echo "${C_V}✔${C_F} $*"; }; aviso(){ echo "${C_A}!${C_F} $*"; }; fallo(){ echo "${C_R}✘ $*${C_F}"; }

# Un solo despliegue a la vez: dos "docker compose up" simultáneos se pisan al recrear contenedores.
# El segundo espera a que acabe el primero. Al relanzarse tras el pull, el candado ya lo tiene (fd 9 heredado).
if [ -z "${DESPLEGAR_CANDADO:-}" ]; then
  exec 9>"/tmp/desplegar-pi-$(id -un).lock"
  flock -n 9 || { echo "Hay otro despliegue en marcha: espero a que acabe…"; flock -w 600 9 || { fallo "Sigue ocupado tras 10 min"; exit 1; }; }
  export DESPLEGAR_CANDADO=1
fi

echo "${C_M}══ Despliegue $(date '+%Y-%m-%d %H:%M') ══${C_F}"
cd "$REPO_DIR" || { fallo "No existe $REPO_DIR"; exit 1; }
antes="$(git rev-parse --short HEAD)"
git pull -q --ff-only || { fallo "git pull ha fallado (¿cambios locales en el servidor?). Mira: git status"; exit 1; }
ahora="$(git rev-parse --short HEAD)"
[ "$antes" = "$ahora" ] && ok "Repo ya al día ($ahora)" || ok "Repo actualizado: $antes → $ahora"
git log --oneline "$antes..$ahora" 2>/dev/null | sed 's/^/    /'

# Si el pull ha cambiado este mismo script, se relanza una vez con la versión nueva.
if [ "$antes" != "$ahora" ] && [ -z "${DESPLEGAR_RELANZADO:-}" ] \
   && git diff --name-only "$antes" "$ahora" | grep -q 'servidor/desplegar.sh$'; then
  ok "desplegar.sh ha cambiado: relanzo la versión nueva"
  DESPLEGAR_RELANZADO=1 exec bash "$REPO_DIR/servidor/desplegar.sh"
fi

# Claves: cada aplicación con .env.ejemplo y sin .env recibe uno nuevo (__ALEATORIA__ → clave aleatoria).
for ejemplo in apps/*/.env.ejemplo; do
  [ -f "$ejemplo" ] || continue
  env="${ejemplo%.ejemplo}"
  [ -f "$env" ] && continue
  ( umask 077
    while IFS= read -r linea || [ -n "$linea" ]; do
      case "$linea" in
        *=__ALEATORIA__) printf '%s=%s\n' "${linea%%=*}" "$(tr -dc 'A-Za-z0-9' </dev/urandom | head -c 32)" ;;
        *) printf '%s\n' "$linea" ;;
      esac
    done < "$ejemplo" > "$env" )
  aviso "Creado $env a partir de .env.ejemplo: revisa sus valores (cat $REPO_DIR/$env)"
done
mkdir -p apps/proyectos/datos

# Las landings y proyecto.json se leen directamente de proyectos/ (volumen): con el pull ya están en la web.
# compose reconstruye solo las imágenes cuyo contexto ha cambiado, recrea solo los contenedores afectados
# y, con --wait, espera a que todos estén "healthy" (falla si alguno no llega a estarlo).
docker compose up -d --build --remove-orphans --wait --wait-timeout 180 2>&1 | grep -vE '^\s*$' | sed 's/^/    /'
if [ "${PIPESTATUS[0]}" -ne 0 ]; then
  fallo "docker compose up ha fallado. Estado y últimos logs:"
  docker compose ps -a --format 'table {{.Service}}\t{{.Status}}' | sed 's/^/    /'
  docker compose logs --tail=20 | sed 's/^/    /'
  exit 1
fi
docker image prune -f >/dev/null 2>&1

# Cada ruta del proxy debe contestar. 000 (sin respuesta), 502, 503 y 504 = la aplicación no responde;
# se reintenta unos segundos por si acaba de arrancar.
probar_ruta() {
  local codigo
  for _ in 1 2 3 4 5 6 7 8 9 10; do
    codigo="$(curl -s -o /dev/null -w '%{http_code}' -m 10 "http://localhost$1")"
    case "$codigo" in 000|502|503|504|'') sleep 2 ;; *) break ;; esac
  done
  case "$codigo" in
    000|502|503|504|'') fallo "http://localhost$1 → ${codigo:-sin respuesta}"; return 1 ;;
    *) ok "http://localhost$1 → $codigo" ;;
  esac
}
error=0
for ruta in / /proyectos/ /proyectos/galeria /proyectos/entrar; do
  probar_ruta "$ruta" || error=1
done
# Y la API, de punta a punta: proxy → proyectos-web → proyectos-api
if salud="$(curl -sf -m 10 --retry 10 --retry-delay 2 --retry-connrefused http://localhost/proyectos/api/salud)"; then
  ok "API OK: $salud"
  echo "$salud" | grep -q '"invalidos":\[\]' || aviso "Hay proyectos con proyecto.json inválido (se ignoran): mira \"invalidos\" arriba"
else
  fallo "La API de proyectos no responde a través del proxy"; error=1
fi
docker compose ps --format 'table {{.Service}}\t{{.Status}}' | sed 's/^/    /'
if [ "$error" != 0 ]; then
  fallo "Algo no responde tras el despliegue. Últimos logs:"; docker compose logs --tail=20 | sed 's/^/    /'; exit 1
fi
exit 0
