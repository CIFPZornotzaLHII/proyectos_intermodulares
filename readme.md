<p align="center"><img src="img/logo-zornotza.png" alt="CIFP Zornotza LHII" width="460"></p>

# Proyectos intermodulares · CIFP Zornotza LHII

Web donde el alumnado de **SMR (2SM), DAW (WG) y DAM (PG)** publica su proyecto intermodular, y el servidor que la
sirve (Ubuntu en IsardVDI, Docker). Cada proyecto es una tarjeta con título, imagen, etiqueta del ciclo y enlace a
su landing; con cuenta del centro se puede reaccionar a los proyectos de los demás grupos.

```
http://IP-DEL-SERVIDOR/proyectos/                       → portada: proyecto destacado + 3 destacados + "ver todos"
http://IP-DEL-SERVIDOR/proyectos/galeria                → galería con filtros por ciclo y buscador
http://IP-DEL-SERVIDOR/proyectos/p/<ciclo>/<carpeta>/   → landing de cada proyecto
```

| Carpeta | Qué es | Empezar por |
|---|---|---|
| `proyectos/` | **Los proyectos del alumnado**: una carpeta por grupo con `proyecto.json`, `index.html` y portada. Se publican por pull request | `proyectos/LEEME.md` |
| `apps/proyectos/` | La web (React + Vite + Tailwind, servida por nginx) y su API (Node sin dependencias): sesión, reacciones, administración con `admin.sh` | `apps/proyectos/LEEME.md` |
| `proxy/` | Reverse proxy en el 80 (`/` → `/proyectos/`) | `proxy/nginx.conf` |
| `servidor/` | Instalación del servidor desde cero y despliegue (a mano, desde Windows o por GitHub Actions) | `servidor/LEEME.md` |
| `scripts/` | `validar-proyectos.js`: las reglas que comprueba cada pull request | — |
| `docker-compose.yml` | Arranca el proxy e incluye el compose de la web (`docker compose up -d --build` desde la raíz) | — |

## Cómo publica un grupo su proyecto

Fork → copiar `proyectos/_plantilla/` a `proyectos/<ciclo>/<nombre-del-proyecto>/` → rellenar `proyecto.json` y la
landing → pull request. `validar-pr.yml` comprueba la carpeta y que la PR no toque nada más; al aceptarla,
`desplegar.yml` entra en el servidor por el bastión de Isard y hace `git pull`. Guía completa: `proyectos/LEEME.md`.

## Qué entregan todos los grupos

- Una **landing** de presentación (plantilla con las 6 secciones que se evalúan: necesidad, solución, planificación, demo, seguimiento y control, equipo).
- Su **tarjeta** en la web (la carpeta con `proyecto.json`), con la etiqueta de su grado.
- Un **vídeo de 5 minutos** en el que se ve al alumnado hablando y la pantalla: solución, planificación, mini demo, seguimiento y control. Se enlaza, no se sube.
- Los grupos de grado superior, además, un **MVP** funcional relacionado con su ciclo.

Los enunciados de cada reto están en sus repos: `reto_intermodular_2sm`, `reto_intermodular_wg`, `reto_intermodular_pg`.
