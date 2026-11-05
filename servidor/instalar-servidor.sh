#!/usr/bin/env bash
# =============================================================================
#  Instalación del SERVIDOR de proyectos intermodulares (Ubuntu Server en IsardVDI) desde cero.
#  Idempotente: se puede ejecutar las veces que haga falta. La red NO se toca (el escritorio de Isard
#  ya trae su red y el acceso por bastión / WireGuard).
#
#  Uso (como usuario normal con sudo, NO como root):
#     git clone https://github.com/CIFPZornotzaLHII/proyectos_intermodulares.git
#     bash proyectos_intermodulares/servidor/instalar-servidor.sh
#
#  Hace, en este orden:
#    1. paquetes base + idioma castellano + teclado es + sshd
#    2. Docker + compose v2, usuario en el grupo docker
#    3. aplicaciones: .env con claves, docker compose up (proxy + web de proyectos)
#    4. regla de sudoers para que el bastión (usuario isard) pueda lanzar desplegar.sh como este usuario
#    5. acceso SSH: las claves públicas de github.com/GITHUB_USER.keys → ~/.ssh/authorized_keys
#  Cada paso se puede saltar con SALTAR_PAQUETES=1, SALTAR_DOCKER=1, SALTAR_APPS=1, SALTAR_SUDO=1, SALTAR_SSH=1
# =============================================================================
set -u

# ---------------------------- CONFIGURACIÓN ----------------------------------
REPO_URL="${REPO_URL:-https://github.com/CIFPZornotzaLHII/proyectos_intermodulares.git}"
REPO_DIR="${REPO_DIR:-$HOME/proyectos_intermodulares}"
GITHUB_USER="${GITHUB_USER:-mikeldalmauc}"    # sus claves públicas SSH (github.com/USUARIO.keys) entran en authorized_keys
USUARIO_BASTION="${USUARIO_BASTION:-isard}"  # usuario con el que entra el bastión de Isard
# -----------------------------------------------------------------------------

C_V=$'\e[1;32m'; C_A=$'\e[1;33m'; C_R=$'\e[1;31m'; C_M=$'\e[1;35m'; C_F=$'\e[0m'
paso()  { echo; echo "${C_M}══ $* ══${C_F}"; }
ok()    { echo "${C_V}✔${C_F} $*"; }
aviso() { echo "${C_A}!${C_F} $*"; }
fallo() { echo "${C_R}✘ $*${C_F}"; }

[ "$(id -u)" -eq 0 ] && { fallo "Ejecútalo como tu usuario normal, no como root (el script usa sudo cuando toca)."; exit 1; }
sudo -v || { fallo "Necesito sudo."; exit 1; }
export DEBIAN_FRONTEND=noninteractive

# ============================ 1. PAQUETES E IDIOMA ============================
if [ "${SALTAR_PAQUETES:-0}" != 1 ]; then
  paso "1/5 Paquetes base e idioma"
  sudo apt-get update -qq
  sudo apt-get install -y -qq git curl ca-certificates jq locales console-setup openssh-server htop tree bash-completion >/dev/null
  sudo systemctl enable --now ssh >/dev/null 2>&1 || sudo systemctl enable --now sshd >/dev/null 2>&1
  sudo sed -i 's/^# *es_ES.UTF-8 UTF-8/es_ES.UTF-8 UTF-8/' /etc/locale.gen
  grep -q '^es_ES.UTF-8' /etc/locale.gen || echo 'es_ES.UTF-8 UTF-8' | sudo tee -a /etc/locale.gen >/dev/null
  sudo locale-gen >/dev/null; sudo update-locale LANG=es_ES.UTF-8 LC_ALL=
  sudo sed -i 's/^XKBLAYOUT=.*/XKBLAYOUT="es"/' /etc/default/keyboard
  sudo localectl set-keymap es 2>/dev/null || true
  ok "Paquetes instalados · sshd activo · idioma es_ES.UTF-8 (efectivo al volver a entrar)"
fi

# ================================ 2. DOCKER ===================================
if [ "${SALTAR_DOCKER:-0}" != 1 ]; then
  paso "2/5 Docker y compose v2"
  command -v docker >/dev/null || sudo apt-get install -y -qq docker.io >/dev/null
  docker compose version >/dev/null 2>&1 || sudo apt-get install -y -qq docker-compose-v2 >/dev/null
  sudo systemctl enable --now docker >/dev/null 2>&1
  id -nG "$USER" | grep -qw docker || { sudo usermod -aG docker "$USER"; aviso "Añadido al grupo docker: cierra sesión y vuelve a entrar para usar docker sin sudo"; }
  ok "Docker $(docker --version | cut -d' ' -f3 | tr -d ,) · $(docker compose version --short 2>/dev/null)"
fi

# ============================== 3. APLICACIONES ===============================
if [ "${SALTAR_APPS:-0}" != 1 ]; then
  paso "3/5 Aplicaciones (repo, claves y contenedores)"
  if [ -d "$REPO_DIR/.git" ]; then git -C "$REPO_DIR" pull -q --ff-only && ok "Repo actualizado"; else git clone -q "$REPO_URL" "$REPO_DIR" && ok "Repo clonado en $REPO_DIR"; fi
  A="$REPO_DIR/apps/proyectos"
  if [ ! -f "$A/.env" ]; then
    ( umask 077
      while IFS= read -r linea || [ -n "$linea" ]; do
        case "$linea" in
          *=__ALEATORIA__) printf '%s=%s\n' "${linea%%=*}" "$(tr -dc 'A-Za-z0-9' </dev/urandom | head -c 32)" ;;
          *) printf '%s\n' "$linea" ;;
        esac
      done < "$A/.env.ejemplo" > "$A/.env" )
    aviso "Creado $A/.env con claves nuevas (las ves con: cat $A/.env)"
  else ok "Ya existe $A/.env, se conserva"; fi
  mkdir -p "$A/datos"
  ( cd "$REPO_DIR" && sudo docker compose up -d --build --wait --wait-timeout 180 2>&1 | tail -3 )   # --wait: espera a los healthchecks
  if curl -sf -m 10 --retry 5 --retry-delay 2 --retry-connrefused http://localhost/proyectos/api/salud >/dev/null; then
    ok "Web de proyectos en marcha: http://$(hostname -I | awk '{print $1}')/proyectos/"
    echo "    Alumnado de prueba: bash $A/admin.sh importar $A/alumnos.ejemplo.csv   (luego importa la lista real)"
  else fallo "La web no responde; mira: cd $REPO_DIR && docker compose logs"; fi
fi

# ============================ 4. SUDO PARA EL BASTIÓN ==========================
if [ "${SALTAR_SUDO:-0}" != 1 ]; then
  paso "4/5 Regla de sudoers para el despliegue por el bastión"
  # El bastión de Isard entra como $USUARIO_BASTION, que no tiene ni el repo ni Docker: GitHub Actions y
  # desplegar.ps1 lanzan desplegar.sh con sudo como este usuario, solo ese script y sin contraseña.
  if id "$USUARIO_BASTION" >/dev/null 2>&1; then
    echo "$USUARIO_BASTION ALL=($USER) NOPASSWD: $REPO_DIR/servidor/desplegar.sh" | sudo tee /etc/sudoers.d/despliegue-pi >/dev/null
    sudo chmod 440 /etc/sudoers.d/despliegue-pi && sudo visudo -cf /etc/sudoers.d/despliegue-pi >/dev/null && ok "sudoers: $USUARIO_BASTION puede lanzar desplegar.sh como $USER"
  else
    aviso "No existe el usuario $USUARIO_BASTION (el del bastión). Crea la regla a mano cuando lo sepas (servidor/LEEME.md)"
  fi
  chmod +x "$REPO_DIR/servidor/desplegar.sh" "$REPO_DIR/apps/proyectos/admin.sh" 2>/dev/null
fi

# ============================== 5. ACCESO SSH =================================
if [ "${SALTAR_SSH:-0}" != 1 ]; then
  paso "5/5 Claves SSH de github.com/$GITHUB_USER"
  mkdir -p "$HOME/.ssh" && chmod 700 "$HOME/.ssh"; touch "$HOME/.ssh/authorized_keys"; chmod 600 "$HOME/.ssh/authorized_keys"
  if claves="$(curl -fsSL "https://github.com/$GITHUB_USER.keys")" && [ -n "$claves" ]; then
    n=0
    while IFS= read -r k; do [ -n "$k" ] && ! grep -qF "$k" "$HOME/.ssh/authorized_keys" && echo "$k" >> "$HOME/.ssh/authorized_keys" && n=$((n+1)); done <<< "$claves"
    ok "$n clave(s) nueva(s) en ~/.ssh/authorized_keys"
  else aviso "No he podido leer github.com/$GITHUB_USER.keys (¿sin internet?)"; fi
fi

echo; ok "Listo. Si te ha añadido al grupo docker, cierra sesión y vuelve a entrar."
