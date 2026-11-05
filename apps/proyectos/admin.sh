#!/usr/bin/env bash
# Administración de la web de proyectos (usuarios y reacciones) desde el servidor.
# Habla con la API con la clave CLAVE_ADMIN del .env de esta carpeta.
#     bash admin.sh importar alumnos.csv      # login;nombre;ciclo;contraseña (contraseña vacía = se genera y se muestra)
#     bash admin.sh listar                    # usuarios con su último acceso
#     bash admin.sh contrasena <login> [nueva]  # cambia la contraseña (sin "nueva": genera una y la muestra)
#     bash admin.sh borrar <login>            # borra el usuario y sus reacciones
#     bash admin.sh vaciar                    # borra TODOS los usuarios y reacciones (pide confirmación)
#     bash admin.sh reacciones [ciclo/slug]   # volcado de reacciones (todas o de un proyecto)
#     bash admin.sh quitar-reacciones <ciclo/slug>
#     bash admin.sh salud
# Variables: API (por defecto http://localhost:8080/api), ENV (ruta del .env)
set -u
AQUI="$(cd "$(dirname "$0")" && pwd)"
ENV="${ENV:-$AQUI/.env}"
API="${API:-http://localhost:8080/api}"
[ -f "$ENV" ] || { echo "No existe $ENV (cópialo de .env.ejemplo o despliega primero)"; exit 1; }
CLAVE_ADMIN="$(grep -E '^CLAVE_ADMIN=' "$ENV" | cut -d= -f2-)"
[ -n "$CLAVE_ADMIN" ] || { echo "CLAVE_ADMIN vacía en $ENV"; exit 1; }
tiene_jq=0; command -v jq >/dev/null && tiene_jq=1
bonito() { if [ "$tiene_jq" = 1 ]; then jq .; else cat; echo; fi; }
llamar() { curl -sS -H "X-Clave-Admin: $CLAVE_ADMIN" "$@"; }

case "${1:-}" in
  importar)
    [ -f "${2:-}" ] || { echo "Uso: admin.sh importar fichero.csv"; exit 1; }
    r="$(llamar -X POST -H 'Content-Type: text/csv' --data-binary "@$2" "$API/admin/usuarios/importar")"
    if [ "$tiene_jq" = 1 ]; then
      echo "$r" | jq -r '"Creados: \(.creados|length)  Actualizados: \(.actualizados|length)  Errores: \(.errores|length)",
        (.creados[] | "  + \(.login)\t\(.nombre)\t\(.ciclo)\tcontraseña: \(.contrasena)"),
        (.actualizados[] | "  ~ \(.login)\t\(.nombre)\t\(.ciclo)\tcontraseña: \(.contrasena)"),
        (.errores[] | "  ! \(.login): \(.error)")'
      echo "Guarda las contraseñas generadas: no se vuelven a mostrar."
    else echo "$r"; echo; fi ;;
  listar)
    r="$(llamar "$API/admin/usuarios")"
    if [ "$tiene_jq" = 1 ]; then echo "$r" | jq -r '.[] | "\(.login)\t\(.nombre)\t\(.ciclo)\túltimo acceso: \(.ultimo_acceso // "nunca")"' | column -t -s $'\t'; else echo "$r"; echo; fi ;;
  contrasena)
    [ -n "${2:-}" ] || { echo "Uso: admin.sh contrasena <login> [nueva]"; exit 1; }
    llamar -X PUT -H 'Content-Type: application/json' -d "{\"contrasena\":\"${3:-}\"}" "$API/admin/usuarios/$2/contrasena" | bonito ;;
  borrar)
    [ -n "${2:-}" ] || { echo "Uso: admin.sh borrar <login>"; exit 1; }
    llamar -X DELETE "$API/admin/usuarios/$2" | bonito ;;
  vaciar)
    read -r -p "¿Borrar TODOS los usuarios y reacciones? Escribe SI: " ok
    [ "$ok" = "SI" ] && llamar -X DELETE "$API/admin/usuarios?confirmar=si" | bonito ;;
  reacciones)
    if [ -n "${2:-}" ]; then llamar "$API/admin/reacciones" | { if [ "$tiene_jq" = 1 ]; then jq --arg p "$2" '[.[] | select(.proyecto == $p)]'; else cat; fi; }
    else llamar "$API/admin/reacciones" | bonito; fi ;;
  quitar-reacciones)
    [ -n "${2:-}" ] || { echo "Uso: admin.sh quitar-reacciones <ciclo/slug>"; exit 1; }
    llamar -X DELETE "$API/admin/reacciones?proyecto=$2" | bonito ;;
  salud)
    curl -sS "$API/salud" | bonito ;;
  *)
    sed -n '2,12p' "$0" ;;
esac
