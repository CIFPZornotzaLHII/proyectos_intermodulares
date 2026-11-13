#!/usr/bin/env node
// Comprueba las carpetas de proyectos/<ciclo>/<slug>/ (proyecto.json, index.html, portada, tamaños).
// Lo ejecuta GitHub Actions en cada pull request y puede ejecutarlo el alumnado antes de subir:
//     node scripts/validar-proyectos.js                 # todos los proyectos
//     node scripts/validar-proyectos.js WG/mi-proyecto  # solo uno
// Sale con código 1 si hay algún error. Sin dependencias.

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..', 'proyectos');
const CICLOS = ['2SM', 'WG', 'PG'];
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const IMAGEN = /\.(png|jpe?g|webp|svg|gif)$/i;
const VIDEO = /\.(mp4|mov|mkv|webm|avi|m4v|wmv|flv)$/i;
const MAX_FICHERO = 2 * 1024 * 1024;
const MAX_PORTADA = 1 * 1024 * 1024;
const MAX_CARPETA = 20 * 1024 * 1024;
const URL = /^https?:\/\/\S+$/;

const errores = [];
const avisos = [];
const fallo = (id, m) => errores.push(`${id}: ${m}`);
const aviso = (id, m) => avisos.push(`${id}: ${m}`);

function recorrer(dir) {
  let total = 0;
  const lista = [];
  (function andar(d) {
    for (const nombre of fs.readdirSync(d)) {
      const f = path.join(d, nombre);
      const st = fs.lstatSync(f);
      if (st.isSymbolicLink()) { lista.push({ f, simbolico: true }); continue; }
      if (st.isDirectory()) andar(f);
      else { total += st.size; lista.push({ f, size: st.size }); }
    }
  })(dir);
  return { total, lista };
}

function validar(ciclo, slug) {
  const id = `${ciclo}/${slug}`;
  const carpeta = path.join(RAIZ, ciclo, slug);
  if (!SLUG.test(slug) || slug.length < 3 || slug.length > 40) fallo(id, 'el nombre de la carpeta debe tener minúsculas, números y guiones (3-40 caracteres), p. ej. "red-segura-asesoria"');

  const fJson = path.join(carpeta, 'proyecto.json');
  if (!fs.existsSync(fJson)) { fallo(id, 'falta proyecto.json'); return; }
  let p;
  try { p = JSON.parse(fs.readFileSync(fJson, 'utf8')); } catch (e) { fallo(id, `proyecto.json no es JSON válido (${e.message})`); return; }
  if (typeof p !== 'object' || Array.isArray(p) || !p) { fallo(id, 'proyecto.json debe ser un objeto {…}'); return; }

  if (typeof p.titulo !== 'string' || p.titulo.trim().length < 3 || p.titulo.trim().length > 80) fallo(id, '"titulo" debe tener entre 3 y 80 caracteres');
  if (p.resumen !== undefined && (typeof p.resumen !== 'string' || p.resumen.length > 240)) fallo(id, '"resumen" debe ser texto de hasta 240 caracteres');
  if (!p.resumen) aviso(id, 'sin "resumen": la tarjeta saldrá sin descripción');
  if (!Array.isArray(p.equipo) || p.equipo.length < 1 || p.equipo.length > 6 || !p.equipo.every(x => typeof x === 'string' && x.trim())) fallo(id, '"equipo" debe ser una lista de 1 a 6 nombres');
  if (p.autores !== undefined && (!Array.isArray(p.autores) || !p.autores.every(x => /^[a-z0-9][a-z0-9._-]{1,39}$/.test(String(x))))) fallo(id, '"autores" debe ser una lista de logins (minúsculas, números, . _ -)');
  if (p.etiquetas !== undefined && (!Array.isArray(p.etiquetas) || p.etiquetas.length > 6 || !p.etiquetas.every(x => typeof x === 'string' && x.length <= 24))) fallo(id, '"etiquetas": hasta 6 textos cortos');
  for (const campo of ['video', 'repo']) {
    if (p[campo] !== undefined && p[campo] !== '' && (typeof p[campo] !== 'string' || !URL.test(p[campo]))) fallo(id, `"${campo}" debe ser una URL http(s) o quedar vacío`);
  }
  if (!p.video) aviso(id, 'sin "video": la tarjeta dirá "Vídeo pendiente"');
  const landing = typeof p.landing === 'string' && p.landing ? p.landing : 'index.html';
  if (/[\\/]|\.\./.test(landing)) fallo(id, '"landing" debe ser un fichero de la propia carpeta');
  else if (!fs.existsSync(path.join(carpeta, landing))) fallo(id, `falta la landing ${landing}`);
  if (p.portada !== undefined && p.portada !== '') {
    if (typeof p.portada !== 'string' || /[\\/]|\.\./.test(p.portada) || !IMAGEN.test(p.portada)) fallo(id, '"portada" debe ser un png, jpg, webp, svg o gif de la propia carpeta');
    else if (!fs.existsSync(path.join(carpeta, p.portada))) fallo(id, `la portada ${p.portada} no existe`);
    else if (fs.statSync(path.join(carpeta, p.portada)).size > MAX_PORTADA) fallo(id, `la portada ${p.portada} pesa más de 1 MB`);
  }
  // "ejemplo": solo los tres proyectos de ejemplo del repo; la web los marca y los deja de enseñar cuando cada ciclo tiene uno de verdad (D-48)
  if (p.ejemplo !== undefined && typeof p.ejemplo !== 'boolean') fallo(id, '"ejemplo" debe ser true o false');
  for (const k of Object.keys(p)) {
    if (!['titulo', 'resumen', 'equipo', 'autores', 'portada', 'video', 'repo', 'etiquetas', 'landing', 'ejemplo'].includes(k)) aviso(id, `campo desconocido en proyecto.json: "${k}" (se ignora)`);
  }

  const { total, lista } = recorrer(carpeta);
  for (const x of lista) {
    const rel = path.relative(carpeta, x.f);
    if (x.simbolico) fallo(id, `${rel}: no se admiten enlaces simbólicos`);
    else if (VIDEO.test(rel)) fallo(id, `${rel}: los vídeos no se suben al repo, se enlazan en "video"`);
    else if (x.size > MAX_FICHERO) fallo(id, `${rel}: pesa más de 2 MB`);
  }
  if (total > MAX_CARPETA) fallo(id, `la carpeta pesa ${(total / 1048576).toFixed(1)} MB (máximo 20 MB)`);
}

// qué validar
const solo = process.argv[2];
let n = 0;
for (const ciclo of CICLOS) {
  const dir = path.join(RAIZ, ciclo);
  if (!fs.existsSync(dir)) continue;
  for (const slug of fs.readdirSync(dir).sort()) {
    if (slug.startsWith('_') || slug.startsWith('.')) continue;
    if (!fs.statSync(path.join(dir, slug)).isDirectory()) { fallo(`${ciclo}/${slug}`, 'solo se admiten carpetas dentro de proyectos/<ciclo>/'); continue; }
    if (solo && `${ciclo}/${slug}` !== solo) continue;
    n++; validar(ciclo, slug);
  }
}
// nada fuera de los ciclos (y _plantilla)
for (const nombre of fs.readdirSync(RAIZ)) {
  if (CICLOS.includes(nombre) || nombre === '_plantilla' || nombre === 'LEEME.md') continue;
  fallo(nombre, 'fuera de sitio: los proyectos van en proyectos/2SM, proyectos/WG o proyectos/PG');
}

for (const a of avisos) console.log(`  aviso  ${a}`);
for (const e of errores) console.log(`  ERROR  ${e}`);
console.log(`${n} proyecto(s) comprobado(s): ${errores.length} error(es), ${avisos.length} aviso(s)`);
process.exit(errores.length ? 1 : 0);
