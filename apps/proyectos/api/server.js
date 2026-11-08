// API de la web de proyectos intermodulares
// Sirve la lista de proyectos (leída de las carpetas proyectos/<ciclo>/<slug>/proyecto.json), el inicio de
// sesión del alumnado y las reacciones a los proyectos. Sin dependencias (solo Node).
// Almacenamiento: dos ficheros JSON en /datos (volumen de Docker): usuarios.json y reacciones.json.

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PUERTO = parseInt(process.env.PUERTO || '3000', 10);
const DATOS = process.env.DATOS || '/datos';                 // usuarios.json y reacciones.json
const PROYECTOS = process.env.PROYECTOS || '/proyectos';     // la carpeta proyectos/ del repo (solo lectura)
const CLAVE_ADMIN = process.env.CLAVE_ADMIN || '';           // para admin.sh (vacía = administración desactivada)
const DIAS_SESION = parseInt(process.env.DIAS_SESION || '30', 10);
let CLAVE_SESION = process.env.CLAVE_SESION || '';           // firma las cookies de sesión
if (!CLAVE_SESION) {
  CLAVE_SESION = crypto.randomBytes(32).toString('hex');
  console.warn('AVISO: sin CLAVE_SESION en el entorno; uso una aleatoria (las sesiones caducan al reiniciar).');
}

// Ciclos = carpetas de primer nivel dentro de proyectos/. La etiqueta de grado sale de aquí, no del alumno.
const CICLOS = {
  '2SM': { nombre: 'SMR', largo: 'Sistemas Microinformáticos y Redes', grado: 'Grado medio' },
  'WG':  { nombre: 'DAW', largo: 'Desarrollo de Aplicaciones Web', grado: 'Grado superior' },
  'PG':  { nombre: 'DAM', largo: 'Desarrollo de Aplicaciones Multiplataforma', grado: 'Grado superior' },
};
const EMOJIS = ['👏', '💡', '🚀', '🔥', '❤️'];
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const LOGIN = /^[a-z0-9][a-z0-9._-]{1,39}$/;
const IMAGEN = /\.(png|jpe?g|webp|svg|gif)$/i;

// ---------- persistencia ----------
fs.mkdirSync(DATOS, { recursive: true });
function cargar(nombre) {
  const f = path.join(DATOS, nombre);
  if (!fs.existsSync(f)) return [];
  let d;
  try { d = JSON.parse(fs.readFileSync(f, 'utf8')); }
  catch (e) {
    // Mejor no arrancar que arrancar vacío y pisar el fichero con la siguiente escritura.
    console.error(`ERROR: ${f} no es un JSON válido (${e.message}). Arréglalo o renómbralo y vuelve a arrancar.`);
    process.exit(1);
  }
  if (!Array.isArray(d)) { console.error(`ERROR: ${f} debe contener una lista JSON.`); process.exit(1); }
  return d;
}
function guardar(nombre, datos) {
  const f = path.join(DATOS, nombre);
  fs.writeFileSync(f + '.tmp', JSON.stringify(datos, null, 1));
  fs.renameSync(f + '.tmp', f);
}
let usuarios = cargar('usuarios.json');
let reacciones = cargar('reacciones.json');
{
  // Una reacción por alumno y proyecto (D-NEW): se queda la de fecha más reciente; a igual fecha o sin fecha, la última del fichero.
  const ganadora = new Map();
  reacciones.forEach((r, i) => {
    const k = `${r.login} ${r.proyecto}`, j = ganadora.get(k);
    if (j === undefined || !r.fecha || !reacciones[j].fecha || reacciones[j].fecha <= r.fecha) ganadora.set(k, i);
  });
  const quedan = reacciones.filter((r, i) => ganadora.get(`${r.login} ${r.proyecto}`) === i);
  if (quedan.length < reacciones.length) {
    console.log(`reacciones.json: quitadas ${reacciones.length - quedan.length} reacciones repetidas (una por alumno y proyecto, D-NEW)`);
    reacciones = quedan;
    guardar('reacciones.json', reacciones);
  }
}

// ---------- utilidades ----------
function json(res, codigo, cuerpo, cabeceras = {}) {
  res.writeHead(codigo, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...cabeceras });
  res.end(JSON.stringify(cuerpo));
}
function leerCuerpo(req, max = 1e6) {
  return new Promise((resolve, reject) => {
    let d = '';
    req.setEncoding('utf8');
    req.on('data', c => { d += c; if (d.length > max) { reject(new Error('cuerpo demasiado grande')); req.destroy(); } });
    req.on('end', () => resolve(d));
    req.on('error', reject);
  });
}
async function leerJSON(req) {
  const d = await leerCuerpo(req);
  try { return d ? JSON.parse(d) : {}; } catch { throw new Error('JSON inválido'); }
}
const ip = req => (req.headers['x-real-ip'] || req.socket.remoteAddress || '?').toString();
// comparación en tiempo constante, como la de contraseñas y firmas (D-19)
const esAdmin = req => {
  const dada = Buffer.from(String(req.headers['x-clave-admin'] || '')), buena = Buffer.from(CLAVE_ADMIN || '');
  return buena.length > 0 && dada.length === buena.length && crypto.timingSafeEqual(dada, buena);
};
const b64 = b => Buffer.from(b).toString('base64url');

// ---------- contraseñas y sesiones ----------
function cifrar(contrasena, sal) { return crypto.scryptSync(contrasena, sal, 32).toString('hex'); }
function comprobar(u, contrasena) {
  const h = Buffer.from(cifrar(contrasena, u.sal), 'hex');
  return h.length === Buffer.from(u.hash, 'hex').length && crypto.timingSafeEqual(h, Buffer.from(u.hash, 'hex'));
}
function contrasenaAleatoria() {   // legible: sin 0/O ni 1/l
  const abc = 'abcdefghjkmnpqrstuvwxyz23456789';
  return Array.from(crypto.randomBytes(8), b => abc[b % abc.length]).join('');
}
function firmar(texto) { return b64(crypto.createHmac('sha256', CLAVE_SESION).update(texto).digest()); }
function cookieSesion(login) {
  const exp = Date.now() + DIAS_SESION * 86400e3;
  // el login va en base64url (puede llevar puntos); la firma cubre login y caducidad
  const valor = `${b64(login)}.${exp}.${firmar(`${login}.${exp}`)}`;
  return `pi_sesion=${valor}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${DIAS_SESION * 86400}`;
}
function usuarioDeSesion(req) {
  const m = /(?:^|;\s*)pi_sesion=([^;]+)/.exec(req.headers.cookie || '');
  if (!m) return null;
  const [loginB64, exp, firma] = m[1].split('.');
  if (!loginB64 || !exp || !firma) return null;
  const login = Buffer.from(loginB64, 'base64url').toString('utf8');
  if (Number(exp) < Date.now()) return null;
  const esperada = firmar(`${login}.${exp}`);
  if (firma.length !== esperada.length || !crypto.timingSafeEqual(Buffer.from(firma), Buffer.from(esperada))) return null;
  return usuarios.find(u => u.login === login) || null;
}
// Intentos de inicio de sesión por IP: 10 cada 10 minutos
const intentos = new Map();
function demasiadosIntentos(req) {
  const k = ip(req), ahora = Date.now();
  const e = intentos.get(k) || { n: 0, desde: ahora };
  if (ahora - e.desde > 600e3) { e.n = 0; e.desde = ahora; }
  e.n++; intentos.set(k, e);
  return e.n > 10;
}

// ---------- proyectos (leídos de las carpetas, con caché de 10 s) ----------
let cacheProyectos = { hasta: 0, lista: [], invalidos: [] };
function leerProyectos() {
  if (Date.now() < cacheProyectos.hasta) return cacheProyectos;
  const lista = [], invalidos = [];
  for (const ciclo of Object.keys(CICLOS)) {
    const dir = path.join(PROYECTOS, ciclo);
    if (!fs.existsSync(dir)) continue;
    for (const slug of fs.readdirSync(dir).sort()) {
      if (slug.startsWith('_') || slug.startsWith('.')) continue;
      const carpeta = path.join(dir, slug);
      if (!fs.statSync(carpeta).isDirectory()) continue;
      const id = `${ciclo}/${slug}`;
      try {
        if (!SLUG.test(slug)) throw new Error('nombre de carpeta inválido (minúsculas, números y guiones)');
        const p = JSON.parse(fs.readFileSync(path.join(carpeta, 'proyecto.json'), 'utf8'));
        if (typeof p.titulo !== 'string' || p.titulo.trim().length < 3) throw new Error('falta "titulo"');
        const landing = typeof p.landing === 'string' && p.landing ? p.landing : 'index.html';
        if (!fs.existsSync(path.join(carpeta, landing))) throw new Error(`no existe ${landing}`);
        const portada = typeof p.portada === 'string' && IMAGEN.test(p.portada) && fs.existsSync(path.join(carpeta, p.portada))
          ? `p/${id}/${p.portada}` : 'img/portada-defecto.svg';
        lista.push({
          id, ciclo, slug,
          ciclo_nombre: CICLOS[ciclo].nombre, ciclo_largo: CICLOS[ciclo].largo, grado: CICLOS[ciclo].grado,
          titulo: p.titulo.trim().slice(0, 80),
          resumen: String(p.resumen || '').trim().slice(0, 240),
          equipo: Array.isArray(p.equipo) ? p.equipo.map(String).slice(0, 6) : [],
          autores: Array.isArray(p.autores) ? p.autores.map(a => String(a).toLowerCase()) : [],
          etiquetas: Array.isArray(p.etiquetas) ? p.etiquetas.map(String).slice(0, 6) : [],
          portada,
          url: `p/${id}/${landing === 'index.html' ? '' : landing}`,
          video: typeof p.video === 'string' && /^https?:\/\//.test(p.video) ? p.video : '',
          repo: typeof p.repo === 'string' && /^https?:\/\//.test(p.repo) ? p.repo : '',
        });
      } catch (e) {
        invalidos.push({ id, error: e.message });
      }
    }
  }
  cacheProyectos = { hasta: Date.now() + 10e3, lista, invalidos };
  return cacheProyectos;
}
function conReacciones(p, usuario) {
  const cuenta = Object.fromEntries(EMOJIS.map(e => [e, 0]));
  const mias = [];
  for (const r of reacciones) {
    if (r.proyecto !== p.id) continue;
    if (cuenta[r.emoji] !== undefined) cuenta[r.emoji]++;
    if (usuario && r.login === usuario.login) mias.push(r.emoji);
  }
  return { ...p, reacciones: cuenta, mias };
}

// ---------- rutas públicas ----------
function salud(req, res) {
  const { lista, invalidos } = leerProyectos();
  json(res, 200, { ok: true, proyectos: lista.length, invalidos, usuarios: usuarios.length, reacciones: reacciones.length, emojis: EMOJIS });
}
function listarProyectos(req, res, url) {
  const usuario = usuarioDeSesion(req);
  const ciclo = url.searchParams.get('ciclo');
  let { lista } = leerProyectos();
  if (ciclo) lista = lista.filter(p => p.ciclo === ciclo);
  json(res, 200, {
    ciclos: Object.entries(CICLOS).map(([codigo, c]) => ({ codigo, ...c })),
    emojis: EMOJIS,
    proyectos: lista.map(p => conReacciones(p, usuario)),
  });
}
function sesionActual(req, res) {
  const u = usuarioDeSesion(req);
  if (!u) return json(res, 401, { error: 'sin sesión' });
  json(res, 200, { login: u.login, nombre: u.nombre, ciclo: u.ciclo });
}
async function iniciarSesion(req, res) {
  if (demasiadosIntentos(req)) return json(res, 429, { error: 'demasiados intentos; espera unos minutos' });
  let b;
  try { b = await leerJSON(req); } catch (e) { return json(res, 400, { error: e.message }); }
  const login = String(b.usuario || b.login || '').trim().toLowerCase();
  const contrasena = String(b.contrasena || '');
  const u = usuarios.find(x => x.login === login);
  if (!u || !contrasena || !comprobar(u, contrasena)) return json(res, 401, { error: 'usuario o contraseña incorrectos' });
  u.ultimo_acceso = new Date().toISOString();
  guardar('usuarios.json', usuarios);
  json(res, 200, { login: u.login, nombre: u.nombre, ciclo: u.ciclo }, { 'Set-Cookie': cookieSesion(u.login) });
}
function cerrarSesion(req, res) {
  json(res, 200, { ok: true }, { 'Set-Cookie': 'pi_sesion=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0' });
}
async function reaccionar(req, res) {
  const u = usuarioDeSesion(req);
  if (!u) return json(res, 401, { error: 'inicia sesión para reaccionar' });
  let b;
  try { b = await leerJSON(req); } catch (e) { return json(res, 400, { error: e.message }); }
  const emoji = String(b.emoji || '');
  if (!EMOJIS.includes(emoji)) return json(res, 400, { error: 'emoji no permitido' });
  const p = leerProyectos().lista.find(x => x.id === String(b.proyecto || ''));
  if (!p) return json(res, 404, { error: 'proyecto no encontrado' });
  if (p.autores.includes(u.login)) return json(res, 403, { error: 'no puedes reaccionar a tu propio proyecto' });
  // Una por alumno y proyecto (D-NEW): la misma la quita, otra la sustituye, si no hay se añade.
  const fecha = new Date().toISOString();
  const i = reacciones.findIndex(r => r.login === u.login && r.proyecto === p.id);
  if (i < 0) reacciones.push({ login: u.login, proyecto: p.id, emoji, fecha });
  else if (reacciones[i].emoji === emoji) reacciones.splice(i, 1);
  else Object.assign(reacciones[i], { emoji, fecha });
  guardar('reacciones.json', reacciones);
  json(res, 200, conReacciones(p, u));
}

// ---------- administración (cabecera X-Clave-Admin; la usa admin.sh) ----------
function filasCSV(texto) {
  const filas = [];
  for (const linea of texto.split(/\r?\n/)) {
    if (!linea.trim() || linea.trim().startsWith('#')) continue;
    const sep = linea.includes(';') ? ';' : ',';
    const c = linea.split(sep).map(x => x.trim().replace(/^"|"$/g, ''));
    if (c[0].toLowerCase() === 'login') continue;                        // cabecera
    filas.push({ login: c[0], nombre: c[1] || '', ciclo: c[2] || '', contrasena: c[3] || '' });
  }
  return filas;
}
async function importarUsuarios(req, res) {
  let filas;
  try {
    const cuerpo = await leerCuerpo(req);
    const tipo = (req.headers['content-type'] || '').toLowerCase();
    filas = tipo.includes('json') ? JSON.parse(cuerpo) : filasCSV(cuerpo);
    if (!Array.isArray(filas)) throw new Error('se esperaba una lista');
  } catch (e) { return json(res, 400, { error: e.message }); }
  const resultado = { creados: [], actualizados: [], errores: [] };
  for (const f of filas) {
    const login = String(f.login || '').trim().toLowerCase();
    const nombre = String(f.nombre || login).trim().slice(0, 80);
    const ciclo = String(f.ciclo || '').trim();
    if (!LOGIN.test(login)) { resultado.errores.push({ login, error: 'login inválido (minúsculas, números, . _ -)' }); continue; }
    if (ciclo && !CICLOS[ciclo]) { resultado.errores.push({ login, error: `ciclo desconocido: ${ciclo} (2SM, WG o PG)` }); continue; }
    let contrasena = String(f.contrasena || '');
    const existente = usuarios.find(u => u.login === login);
    if (existente) {
      existente.nombre = nombre; existente.ciclo = ciclo;
      if (contrasena) { existente.sal = crypto.randomBytes(16).toString('hex'); existente.hash = cifrar(contrasena, existente.sal); }
      resultado.actualizados.push({ login, nombre, ciclo, contrasena: contrasena ? '(la indicada)' : '(sin cambios)' });
      continue;
    }
    const generada = !contrasena;
    if (generada) contrasena = contrasenaAleatoria();
    const sal = crypto.randomBytes(16).toString('hex');
    usuarios.push({ login, nombre, ciclo, sal, hash: cifrar(contrasena, sal), creado: new Date().toISOString() });
    resultado.creados.push({ login, nombre, ciclo, contrasena: generada ? contrasena : '(la indicada)' });
  }
  guardar('usuarios.json', usuarios);
  json(res, 200, resultado);
}
function listarUsuarios(req, res) {
  json(res, 200, usuarios.map(({ login, nombre, ciclo, creado, ultimo_acceso }) => ({ login, nombre, ciclo, creado, ultimo_acceso: ultimo_acceso || null })));
}
async function cambiarContrasena(req, res, login) {
  const u = usuarios.find(x => x.login === login);
  if (!u) return json(res, 404, { error: 'usuario no encontrado' });
  let b;
  try { b = await leerJSON(req); } catch (e) { return json(res, 400, { error: e.message }); }
  const contrasena = String(b.contrasena || '') || contrasenaAleatoria();
  u.sal = crypto.randomBytes(16).toString('hex'); u.hash = cifrar(contrasena, u.sal);
  guardar('usuarios.json', usuarios);
  json(res, 200, { login, contrasena: b.contrasena ? '(la indicada)' : contrasena });
}
function borrarUsuario(req, res, login) {
  const n = usuarios.length;
  usuarios = usuarios.filter(u => u.login !== login);
  if (usuarios.length === n) return json(res, 404, { error: 'usuario no encontrado' });
  reacciones = reacciones.filter(r => r.login !== login);
  guardar('usuarios.json', usuarios); guardar('reacciones.json', reacciones);
  json(res, 200, { ok: true, borrado: login });
}
function borrarTodosUsuarios(req, res, url) {
  if (url.searchParams.get('confirmar') !== 'si') return json(res, 400, { error: 'añade ?confirmar=si' });
  const n = usuarios.length;
  usuarios = []; reacciones = [];
  guardar('usuarios.json', usuarios); guardar('reacciones.json', reacciones);
  json(res, 200, { ok: true, borrados: n });
}
function borrarReacciones(req, res, url) {
  const proyecto = url.searchParams.get('proyecto');
  const n = reacciones.length;
  reacciones = proyecto ? reacciones.filter(r => r.proyecto !== proyecto) : [];
  guardar('reacciones.json', reacciones);
  json(res, 200, { ok: true, borradas: n - reacciones.length });
}

// ---------- servidor ----------
const servidor = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const ruta = url.pathname.replace(/\/+$/, '') || '/';
  const m = req.method;
  try {
    if (m === 'GET' && ruta === '/api/salud') return salud(req, res);
    if (m === 'GET' && ruta === '/api/proyectos') return listarProyectos(req, res, url);
    if (m === 'GET' && ruta === '/api/sesion') return sesionActual(req, res);
    if (m === 'POST' && ruta === '/api/sesion') return await iniciarSesion(req, res);
    if (m === 'DELETE' && ruta === '/api/sesion') return cerrarSesion(req, res);
    if (m === 'POST' && ruta === '/api/reacciones') return await reaccionar(req, res);

    if (ruta.startsWith('/api/admin/')) {
      if (!esAdmin(req)) return json(res, 401, { error: 'clave de administración incorrecta o administración desactivada' });
      if (m === 'GET' && ruta === '/api/admin/usuarios') return listarUsuarios(req, res);
      if (m === 'POST' && ruta === '/api/admin/usuarios/importar') return await importarUsuarios(req, res);
      if (m === 'DELETE' && ruta === '/api/admin/usuarios') return borrarTodosUsuarios(req, res, url);
      let mm = /^\/api\/admin\/usuarios\/([^/]+)\/contrasena$/.exec(ruta);
      if (m === 'PUT' && mm) return await cambiarContrasena(req, res, decodeURIComponent(mm[1]).toLowerCase());
      mm = /^\/api\/admin\/usuarios\/([^/]+)$/.exec(ruta);
      if (m === 'DELETE' && mm) return borrarUsuario(req, res, decodeURIComponent(mm[1]).toLowerCase());
      if (m === 'GET' && ruta === '/api/admin/reacciones') return json(res, 200, reacciones);
      if (m === 'DELETE' && ruta === '/api/admin/reacciones') return borrarReacciones(req, res, url);
    }
    json(res, 404, { error: 'ruta no encontrada' });
  } catch (e) {
    console.error(e);
    json(res, 500, { error: 'error interno' });
  }
});

servidor.listen(PUERTO, () => {
  const { lista, invalidos } = leerProyectos();
  console.log(`API de proyectos en el puerto ${PUERTO} · ${lista.length} proyectos · ${usuarios.length} usuarios · admin ${CLAVE_ADMIN ? 'activo' : 'DESACTIVADO'}`);
  for (const i of invalidos) console.warn(`  proyecto ignorado ${i.id}: ${i.error}`);
});
