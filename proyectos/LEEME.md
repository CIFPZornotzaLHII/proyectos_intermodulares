# Publicar tu proyecto en la web

Tu proyecto aparece en la web cuando su carpeta está en la rama `main` de este repositorio. Para ponerla ahí
haces una **pull request**; el profesor la revisa y la acepta, y el servidor se actualiza solo.

> La landing se sirve en un *sandbox* del navegador: tu HTML, CSS y JavaScript funcionan con normalidad (scripts,
> formularios, enlaces que abren pestaña nueva), pero la página no comparte la sesión de la web ni puede llamar a su
> API, y `localStorage` no está disponible. Si necesitas guardar algo, hazlo en memoria o en la URL.

## 1. Prepara el repositorio (una vez por grupo)

1. En GitHub, haz **Fork** de `CIFPZornotzaLHII/proyectos_intermodulares` (botón arriba a la derecha).
2. Clona tu fork: `git clone https://github.com/TU-USUARIO/proyectos_intermodulares.git`
3. Crea una rama para tu proyecto: `git checkout -b mi-proyecto`

## 2. Crea tu carpeta

Copia la plantilla a la carpeta de tu ciclo con el nombre de tu proyecto en minúsculas y con guiones:

```
proyectos/
  2SM/   ← SMR (grado medio)
  WG/    ← DAW (grado superior)
  PG/    ← DAM (grado superior)
```

```bash
cp -r proyectos/_plantilla proyectos/WG/reservas-talleres     # ejemplo: un grupo de DAW
```

Dentro tendrás:

| Fichero | Qué es |
|---|---|
| `proyecto.json` | la tarjeta: título, resumen, equipo, portada, vídeo, repo, etiquetas |
| `index.html` | tu landing page. Cámbiala como quieras, pero mantén las 6 secciones que se evalúan. El título (h1) corto: una línea que diga qué resuelve |
| `portada.svg` | sustitúyela por `portada.png` o `.jpg` (1200×675, menos de 1 MB) y cambia el nombre en `proyecto.json` |

`proyecto.json`:

```json
{
  "titulo": "Reservas de talleres",
  "resumen": "Web en Laravel para reservar aulas y talleres del centro, con calendario, roles y avisos.",
  "equipo": ["Nerea Etxeberria", "Unai López", "Aitor Aguirre"],
  "autores": ["nerea.etxeberria", "unai.lopez", "aitor.aguirre"],
  "portada": "portada.png",
  "video": "https://youtu.be/...",
  "repo": "https://github.com/...",
  "etiquetas": ["laravel", "mysql", "api-rest"]
}
```

- `autores`: vuestros **logins** de la web (los que usáis para iniciar sesión). Sirve para que no podáis
  reaccionar a vuestro propio proyecto. Opcional.
- `video`: el enlace al vídeo de presentación (5 min). Se puede añadir en una segunda pull request cuando lo tengáis.
- El ciclo y el grado **no se escriben**: salen de la carpeta (`2SM`, `WG`, `PG`).

## 3. Reglas (las comprueba el robot en cada pull request)

- El nombre de la carpeta: minúsculas, números y guiones (`red-segura-asesoria`), de 3 a 40 caracteres.
- `proyecto.json` válido, con `titulo` (3-80 caracteres), `resumen` (hasta 240) y `equipo` (1 a 6 nombres).
- Existe `index.html`. La portada, si la indicas, existe y pesa menos de 1 MB (png, jpg, webp o svg).
- Ningún fichero de más de 2 MB; la carpeta entera, menos de 20 MB. **Nada de vídeos en el repo**: se enlazan.
- La pull request solo toca **tu** carpeta. Si cambias algo fuera, se rechaza.

Puedes comprobarlo antes de subir: `node scripts/validar-proyectos.js`.

## 4. Sube y abre la pull request

```bash
git add proyectos/WG/reservas-talleres
git commit -m "Proyecto: Reservas de talleres (WG)"
git push -u origin mi-proyecto
```

En GitHub aparece el botón **Compare & pull request**. Rellena la plantilla y envíala. Si el robot marca errores,
corrígelos en tu rama y vuelve a hacer `push`: la pull request se actualiza sola. Cuando el profesor la acepte,
tu tarjeta aparece en la web en unos minutos.

Para actualizar el proyecto más adelante (añadir el vídeo, mejorar la landing): misma rama, nuevos commits, nueva
pull request.

## Enlaces útiles en tu landing

Desde `index.html`, la galería está en `../../../galeria` y las imágenes de tu carpeta se enlazan en
relativo (`src="captura.png"`). Tu landing se publica en `http://SERVIDOR/proyectos/p/<ciclo>/<carpeta>/`.
