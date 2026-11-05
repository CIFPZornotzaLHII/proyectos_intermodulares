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

// Ruta de vuelta tras el login: solo rutas de esta web (nada de //otro-sitio ni http://)
export const volverSegura = valor => (typeof valor === 'string' && /^\/(?!\/)[\w\-./?=&#%]*$/.test(valor) ? valor : '/galeria');
