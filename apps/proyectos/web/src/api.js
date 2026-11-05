// Acceso a la API (apps/proyectos/api/server.js). Todo cuelga de la base de la web (/proyectos/ en producción),
// igual que las imágenes y las landings: la API devuelve rutas relativas (p/2SM/slug/, img/portada-defecto.svg).
export const BASE = import.meta.env.BASE_URL || '/';
export const ruta = relativa => (/^https?:\/\//.test(relativa) ? relativa : BASE + String(relativa || '').replace(/^\/+/, ''));

export async function api(camino, opciones = {}) {
  let res;
  try {
    res = await fetch(`${BASE}api/${camino}`, {
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', ...(opciones.headers || {}) },
      ...opciones,
    });
  } catch {
    return { ok: false, estado: 0, datos: null }; // sin red
  }
  let datos = null;
  try { datos = await res.json(); } catch { /* sin cuerpo */ }
  return { ok: res.ok, estado: res.status, datos };
}

export const cargarProyectos = () => api('proyectos');
export const cargarSesion = () => api('sesion');
export const iniciarSesion = (usuario, contrasena) => api('sesion', { method: 'POST', body: JSON.stringify({ usuario, contrasena }) });
export const cerrarSesion = () => api('sesion', { method: 'DELETE' });
export const reaccionar = (proyecto, emoji) => api('reacciones', { method: 'POST', body: JSON.stringify({ proyecto, emoji }) });
