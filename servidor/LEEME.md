# Servidor de proyectos · instalación y despliegue

Ubuntu Server (escritorio de IsardVDI) con bastión SSH accesible desde fuera y acceso por WireGuard para el
alumnado. La red no se toca: la trae el escritorio. Un solo script lo deja todo:

```bash
git clone https://github.com/CIFPZornotzaLHII/proyectos_intermodulares.git
bash proyectos_intermodulares/servidor/instalar-servidor.sh
```

Como usuario normal con sudo (no root). Se puede repetir sin miedo: cada paso comprueba lo que ya hay.
Al acabar: cerrar sesión y volver a entrar.

| Paso | Qué deja | Saltarlo |
|---|---|---|
| 1 | git, curl, jq, openssh-server…; idioma `es_ES.UTF-8`; teclado `es` | `SALTAR_PAQUETES=1` |
| 2 | docker.io + compose v2; tu usuario en el grupo `docker` | `SALTAR_DOCKER=1` |
| 3 | clona/actualiza el repo, crea `apps/proyectos/.env` (claves aleatorias) si no existe, `docker compose up -d --build` (proxy + web) | `SALTAR_APPS=1` |
| 4 | regla en `/etc/sudoers.d/despliegue-pi`: el usuario del bastión (`isard`) puede lanzar `desplegar.sh` como tú | `SALTAR_SUDO=1` |
| 5 | las claves públicas de `github.com/mikeldalmauc.keys` en `~/.ssh/authorized_keys` | `SALTAR_SSH=1` |

Variables: `REPO_URL`, `REPO_DIR`, `GITHUB_USER`, `USUARIO_BASTION`.

Después: `bash ~/proyectos_intermodulares/apps/proyectos/admin.sh importar alumnos.csv` para dar de alta al alumnado
(ver `apps/proyectos/LEEME.md`), `cat ~/proyectos_intermodulares/apps/proyectos/.env` para ver las claves.

El repo es público: el servidor hace `git pull` por HTTPS sin claves. Si algún día pasa a privado, añade una
deploy key de solo lectura (como en `server_isard_som`).

## Despliegue

Tres formas, de menos a más automática. Todas ejecutan `desplegar.sh` en el servidor, que:

- espera si hay otro despliegue en marcha (nunca hay dos a la vez);
- hace `git pull` y, si el pull trae un `desplegar.sh` nuevo, se relanza con él;
- crea el `.env` de cada aplicación que tenga `.env.ejemplo` y aún no tenga `.env`;
- lanza `docker compose up -d --build --wait`: solo reconstruye lo que cambió y espera a que todos los
  servicios pasen su healthcheck. Las carpetas de `proyectos/` se sirven directamente del repo, así que una
  pull request aceptada solo necesita el `git pull`;
- comprueba `/`, `/proyectos/`, la galería y la API (`/proyectos/api/salud`). Si algo no responde, sale con
  error y enseña los últimos logs; si hay proyectos con `proyecto.json` inválido, lo avisa.

1. **A mano, por SSH**: `ssh servidor-pi 'sudo -n -u administrador -H /home/administrador/proyectos_intermodulares/servidor/desplegar.sh'` (el bastión entra como `isard`; de ahí el sudo)
2. **Desde Windows en un paso**: `.\servidor\desplegar.ps1 "mensaje del commit"` → `git add -A`, commit, push y despliegue (sin mensaje solo despliega).
3. **GitHub Actions al hacer push a `main`** (`.github/workflows/desplegar.yml`), si cambia algo en `docker-compose.yml`,
   `proxy/`, `apps/`, `proyectos/` o `servidor/`. **Así es como una pull request aceptada llega al servidor.**
   Llega por el bastión SSH de Isard. Configuración, una vez:
   - En Windows, una clave **solo para esto**: `ssh-keygen -t ed25519 -f $HOME\.ssh\despliegue-pi -C despliegue-github -N '""'`
   - La pública (`despliegue-pi.pub`) **en Isard**: escritorio del servidor → editar → Bastión → SSH → claves autorizadas.
     El bastión solo mira las claves de Isard; el `authorized_keys` del servidor no le sirve.
   - En el servidor, la regla de sudoers (la deja el paso 4 de `instalar-servidor.sh`):
     ```bash
     echo 'isard ALL=(administrador) NOPASSWD: /home/administrador/proyectos_intermodulares/servidor/desplegar.sh' \
       | sudo tee /etc/sudoers.d/despliegue-pi >/dev/null \
       && sudo chmod 440 /etc/sudoers.d/despliegue-pi && sudo visudo -cf /etc/sudoers.d/despliegue-pi
     ```
     Si el usuario no es `administrador`, cambia la regla y pon la variable `DESPLIEGUE_USUARIO` en GitHub.
   - En GitHub, repo → Settings → Secrets and variables → Actions:
     - Variable `DESPLIEGUE_AUTOMATICO` = `si` (ponla en `no` para pausarlo sin borrar nada).
     - Secrets `DESPLIEGUE_SSH_KEY` (contenido completo de `despliegue-pi`, la privada),
       `DESPLIEGUE_SSH_HOST` = `vdi.fpzornotzalh.eus`, `DESPLIEGUE_SSH_PORT` = `443`,
       `DESPLIEGUE_SSH_USER` = ID del bastión de **este** escritorio (un UUID, sin espacios ni saltos de línea).
   - Prueba: pestaña Actions → "Desplegar servidor" → Run workflow. Luego cada push despliega solo.
     El workflow no hace `ssh-keyscan` (el bastión no lo contesta): lleva la clave pública de host del bastión
     fijada en el propio `desplegar.yml` (la misma que en `server_isard_som`).
   Si el servidor está apagado, el workflow falla y lo verás en rojo en Actions: no pasa nada, despliega al
   siguiente push o con "Run workflow".

## Acceso del alumnado

La web se sirve en HTTP dentro de la red de Isard / WireGuard: `http://IP-DEL-SERVIDOR/proyectos/`. Las
contraseñas viajan sin cifrar dentro de la VPN; si la web se abre a internet, pon TLS delante (Caddy o
certbot en el proxy) antes de dar cuentas reales.
