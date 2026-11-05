import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import App from '../src/App.jsx';

// --- API falsa: tres proyectos, dos usuarios, reacciones con estado ---
const proyecto = (id, titulo, ciclo, reacciones, autores = []) => ({
  id, titulo, ciclo, ciclo_nombre: { '2SM': 'SMR', WG: 'DAW', PG: 'DAM' }[ciclo], grado: ciclo === '2SM' ? 'Grado medio' : 'Grado superior',
  resumen: `Resumen de ${titulo}`, equipo: ['Ane García', 'Jon Pérez'], autores, etiquetas: ['docker'], url: `p/${id}/`, portada: 'img/portada-defecto.svg',
  video: id.includes('tpv') ? '' : 'https://youtu.be/x', repo: 'https://github.com/x/y', reacciones, mias: [],
});
let proyectos, sesion, peticiones;
function apiFalsa(url, opciones = {}) {
  const metodo = opciones.method || 'GET';
  const ruta = url.replace('/proyectos/api/', '');
  peticiones.push(`${metodo} ${ruta}`);
  const json = (estado, datos) => Promise.resolve({ ok: estado < 400, status: estado, json: () => Promise.resolve(datos) });
  if (ruta === 'proyectos') return json(200, { proyectos, ciclos: [{ codigo: '2SM', nombre: 'SMR' }, { codigo: 'WG', nombre: 'DAW' }, { codigo: 'PG', nombre: 'DAM' }] });
  if (ruta === 'sesion' && metodo === 'GET') return sesion ? json(200, sesion) : json(401, { error: 'sin sesión' });
  if (ruta === 'sesion' && metodo === 'POST') {
    const { usuario, contrasena } = JSON.parse(opciones.body);
    if (usuario === 'ane.garcia' && contrasena === 'zornotza-wg') { sesion = { login: 'ane.garcia', nombre: 'Ane García', ciclo: 'DAW' }; return json(200, sesion); }
    return json(401, { error: 'credenciales' });
  }
  if (ruta === 'sesion' && metodo === 'DELETE') { sesion = null; return json(204, null); }
  if (ruta === 'reacciones') {
    if (!sesion) return json(401, { error: 'sin sesión' });
    const { proyecto: id, emoji } = JSON.parse(opciones.body);
    const p = proyectos.find(x => x.id === id);
    if (p.autores.includes(sesion.login)) return json(403, { error: 'No puedes reaccionar a tu propio proyecto' });
    const mia = p.mias.includes(emoji);
    p.reacciones[emoji] = (p.reacciones[emoji] || 0) + (mia ? -1 : 1);
    p.mias = mia ? p.mias.filter(e => e !== emoji) : [...p.mias, emoji];
    return json(200, { ...p });
  }
  return json(404, { error: 'ruta' });
}

const ir = ruta => window.history.replaceState({}, '', `/proyectos${ruta}`);
beforeEach(() => {
  proyectos = [
    proyecto('WG/reservas', 'Reservas de talleres', 'WG', { '👏': 5, '🔥': 2 }, ['ane.garcia']),
    proyecto('2SM/red-segura', 'Red segura para una asesoría', '2SM', { '💡': 3 }),
    proyecto('PG/tpv', 'TPV para la cafetería', 'PG', {}),
  ];
  sesion = null; peticiones = [];
  localStorage.clear();
  vi.stubGlobal('fetch', vi.fn(apiFalsa));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('portada', () => {
  it('muestra un destacado entre los más votados, tres tendencias y las cifras', async () => {
    ir('/');
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: 'Proyectos intermodulares 26-27' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Proyecto destacado')).toBeInTheDocument());
    const destacado = await screen.findByText(/reacciones en total/);
    expect(destacado).toBeInTheDocument();
    // cifras: 3 proyectos, 6 alumnos, 10 reacciones
    expect(screen.getAllByRole('definition').map(d => d.textContent)).toEqual(['3', '6', '10']);
    // tendencias: los otros dos (no hay más de tres proyectos)
    expect(screen.getByText('Tendencias')).toBeInTheDocument();
    expect(screen.getAllByText(/reacciones$/).length).toBe(2);
    expect(screen.getByText('Ver los 3 proyectos')).toBeInTheDocument();
    // la etiqueta lleva solo el ciclo
    expect(screen.queryByText(/Grado superior|Grado medio/)).toBeNull();
  });

  it('"Enséñame otro" cambia el destacado sin recargar', async () => {
    ir('/');
    render(<App />);
    const boton = await screen.findByRole('button', { name: 'Enséñame otro' });
    await screen.findByText(/reacciones en total/); // el destacado se elige en un efecto: sin esto, a veces el primer h3 es una tendencia
    const titulo = () => screen.getAllByRole('heading', { level: 3 })[0].textContent;
    const antes = titulo();
    fireEvent.click(boton);
    await waitFor(() => expect(titulo()).not.toBe(antes));
    expect(peticiones.filter(p => p === 'GET proyectos').length).toBe(1);
  });

  it('cambia a euskera sin recargar y lo recuerda', async () => {
    ir('/');
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'EU' }));
    expect(await screen.findByText('Joerak')).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('eu');
    expect(localStorage.getItem('pi_idioma')).toBe('eu');
  });

  it('la cabecera transparente sobre el índigo no usa texto-3; la de la galería sí', () => {
    ir('/');
    const { unmount } = render(<App />);
    const cabecera = within(screen.getByRole('banner'));
    [cabecera.getByText(/^CIFP Zornotza LHII · /), cabecera.getByRole('link', { name: 'Proyectos' }),
      cabecera.getByRole('link', { name: 'Cómo publicar' }), cabecera.getByRole('button', { name: 'EU' })]
      .forEach(el => expect(el).not.toHaveClass('text-texto-3'));
    unmount();
    ir('/galeria');
    render(<App />);
    expect(within(screen.getByRole('banner')).getByRole('link', { name: 'Cómo publicar' })).toHaveClass('text-texto-3');
  });
});

describe('galería', () => {
  it('filtra por ciclo y por búsqueda', async () => {
    ir('/galeria');
    render(<App />);
    await screen.findByText('Reservas de talleres');
    expect(screen.getByRole('button', { name: 'Todos · 3' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'SMR · 1' }));
    await waitFor(() => expect(screen.queryByText('Reservas de talleres')).toBeNull());
    expect(screen.getByText('Red segura para una asesoría')).toBeInTheDocument();
    expect(window.location.search).toBe('?ciclo=2SM');
    fireEvent.click(screen.getByRole('button', { name: 'Todos · 3' }));
    fireEvent.change(screen.getByPlaceholderText('Buscar por título, equipo o etiqueta'), { target: { value: 'tpv' } });
    await waitFor(() => expect(screen.getAllByRole('article').length).toBe(1));
    expect(screen.getByText('Vídeo pendiente')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('Buscar por título, equipo o etiqueta'), { target: { value: 'zzz' } });
    expect(await screen.findByText('Ningún proyecto coincide con la búsqueda.')).toBeInTheDocument();
  });

  it('sin sesión invita a entrar; con sesión reacciona, quita la reacción y bloquea el propio proyecto', async () => {
    ir('/galeria');
    const { unmount } = render(<App />);
    await screen.findByText('Reservas de talleres');
    expect(screen.getAllByText('Inicia sesión para reaccionar').length).toBe(3);
    unmount();

    sesion = { login: 'ane.garcia', nombre: 'Ane García', ciclo: 'DAW' };
    render(<App />);
    await screen.findByText('Reservas de talleres');
    expect(screen.getByText('Ane García')).toBeInTheDocument();
    const tarjetas = screen.getAllByRole('article');
    const propia = tarjetas.find(a => within(a).queryByText('Reservas de talleres'));
    expect(within(propia).getByText('Es tu proyecto')).toBeInTheDocument();
    within(propia).getAllByRole('button', { name: /Me gusta|Buena idea|Ambicioso|Fuego|Me encanta/ }).forEach(b => expect(b).toBeDisabled());

    const ajena = tarjetas.find(a => within(a).queryByText('Red segura para una asesoría'));
    const megusta = within(ajena).getByRole('button', { name: 'Me gusta' });
    expect(megusta).toHaveTextContent('0');
    fireEvent.click(megusta);
    await waitFor(() => expect(within(ajena).getByRole('button', { name: 'Me gusta' })).toHaveAttribute('aria-pressed', 'true'));
    expect(within(ajena).getByRole('button', { name: 'Me gusta' })).toHaveTextContent('1');
    fireEvent.click(within(ajena).getByRole('button', { name: 'Me gusta' }));
    await waitFor(() => expect(within(ajena).getByRole('button', { name: 'Me gusta' })).toHaveAttribute('aria-pressed', 'false'));
    expect(peticiones.filter(p => p === 'POST reacciones').length).toBe(2);
  });
});

describe('inicio de sesión', () => {
  it('avisa del error y, con credenciales buenas, vuelve a la galería con la sesión abierta', async () => {
    ir('/entrar?volver=/galeria');
    render(<App />);
    await screen.findByRole('heading', { level: 1, name: 'Entra para reaccionar a los proyectos' });
    fireEvent.change(screen.getByLabelText('Usuario'), { target: { value: 'ane.garcia' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'mal' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Usuario o contraseña incorrectos.');
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'zornotza-wg' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    await screen.findByText('Todos los proyectos');
    expect(window.location.pathname).toBe('/proyectos/galeria');
    expect(screen.getByText('Ane García')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Salir' }));
    await screen.findByRole('link', { name: 'Iniciar sesión' });
  });

  it('ignora una ruta de vuelta externa', async () => {
    ir('/entrar?volver=//malo.example');
    sesion = { login: 'ane.garcia', nombre: 'Ane García', ciclo: 'DAW' };
    render(<App />);
    await waitFor(() => expect(window.location.pathname).toBe('/proyectos/galeria'));
  });
});
