// Utilidades sobre los proyectos que devuelve la API (sin React)

export const totalReacciones = p => Object.values(p.reacciones || {}).reduce((a, b) => a + b, 0);

export const iniciales = s => String(s || '').split(/\s+/).filter(w => /^[\p{L}\d]/u.test(w)).slice(0, 2).map(w => w[0].toUpperCase()).join('');

export const esAutor = (p, usuario) => !!(usuario && (p.autores || []).includes(usuario.login));

// Más votados primero; a igualdad, por título
export const ordenarPorVotos = lista => [...lista].sort((a, b) => totalReacciones(b) - totalReacciones(a) || a.titulo.localeCompare(b.titulo));

export const alAzar = lista => (lista.length ? lista[Math.floor(Math.random() * lista.length)] : null);

export const coincide = (p, consulta) => {
  const q = consulta.trim().toLowerCase();
  if (!q) return true;
  return [p.titulo, p.resumen, ...(p.equipo || []), ...(p.etiquetas || [])].join(' ').toLowerCase().includes(q);
};

// Reacciones: la API guarda el emoji; la web lo pinta con un icono y un nombre traducido
export const REACCIONES = [
  { emoji: '👏', icono: 'pulgar', nombre: 'r_megusta' },
  { emoji: '💡', icono: 'bombilla', nombre: 'r_idea' },
  { emoji: '🚀', icono: 'cohete', nombre: 'r_cohete' },
  { emoji: '🔥', icono: 'llama', nombre: 'r_fuego' },
  { emoji: '❤️', icono: 'corazon', nombre: 'r_corazon' },
];

// Copia del proyecto tras pulsar `emoji`, con la regla de una reacción por alumno (job 025): la misma se quita y otra
// sustituye a las que hubiera. Es la vista optimista de la portada; después manda la respuesta del servidor (D-NEW)
export const conReaccion = (p, emoji) => {
  const mias = p.mias || [];
  const quita = mias.includes(emoji);
  const reacciones = { ...p.reacciones };
  for (const e of quita ? [emoji] : mias) reacciones[e] = Math.max(0, (reacciones[e] || 0) - 1);
  if (!quita) reacciones[emoji] = (reacciones[emoji] || 0) + 1;
  return { ...p, reacciones, mias: quita ? mias.filter(e => e !== emoji) : [emoji] };
};

// Ruta de vuelta tras el login: solo rutas de esta web (nada de //otro-sitio ni http://)
export const volverSegura = valor => (typeof valor === 'string' && /^\/(?!\/)[\w\-./?=&#%]*$/.test(valor) ? valor : '/galeria');
