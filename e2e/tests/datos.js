// Datos conocidos de la pila de pruebas: las cuentas de apps/proyectos/alumnos.ejemplo.csv y los tres proyectos de
// ejemplo del repo (proyectos/<ciclo>/<slug>/). Si cambian los ejemplos, cambia esto.

// Alumna de DAW autora de WG/reservas-talleres: sirve para probar "no puedes reaccionar a tu propio proyecto"
export const ALUMNA = { login: 'nerea.etxeberria', nombre: 'Nerea Etxeberria', ciclo: 'WG', contrasena: 'zornotza-wg' };

export const PROYECTOS = {
  WG: { id: 'WG/reservas-talleres', titulo: 'Reservas de talleres', ciclo: 'DAW', landing: 'Reserva tu taller en 20 segundos', equipo: 'Nerea Etxeberria · Unai López · Aitor Aguirre', etiqueta: 'laravel' },
  '2SM': { id: '2SM/red-segura-asesoria', titulo: 'Red segura para una asesoría', ciclo: 'SMR', landing: 'Una red segura para una asesoría de 8 puestos', equipo: 'Ane García · Jon Urrutia', etiqueta: 'proxmox' },
  PG: { id: 'PG/tpv-cafeteria', titulo: 'TPV para la cafetería', ciclo: 'DAM', landing: 'El TPV de la cafetería del centro', equipo: 'Oier Arrieta · Nahia Zubiri', etiqueta: 'javafx' },
};
export const TITULOS = Object.values(PROYECTOS).map(p => p.titulo);
export const CIFRAS = { proyectos: 3, alumnos: 7 };   // 3 + 2 + 2 miembros de equipo

// Nombres accesibles de los cinco botones de reacción (👏 💡 🚀 🔥 ❤️)
export const REACCIONES = ['Me gusta', 'Buena idea', 'Ambicioso', 'Fuego', 'Me encanta'];

// La tarjeta (role="article") cuyo título es `titulo`
export const tarjeta = (page, titulo) => page.getByRole('article').filter({ has: page.getByRole('heading', { level: 3, name: titulo }) });

// Recorre la página hasta abajo y vuelve arriba: dispara las animaciones de aparición al hacer scroll (AnimatedContent)
export async function recorrer(page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 100)); }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(700);
}
