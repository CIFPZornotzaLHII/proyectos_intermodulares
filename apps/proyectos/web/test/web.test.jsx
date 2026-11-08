import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import App from '../src/App.jsx';
import { iniciales } from '../src/datos.js';

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
    expect(await screen.findByRole('heading', { level: 1, name: 'Proyectos intermodulares 26-27' })).toBeInTheDocument();
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
    expect(screen.queryByText('Cambia en cada visita')).toBeNull(); // D-24
    await screen.findByText(/reacciones en total/); // el destacado se elige en un efecto: sin esto, a veces el primer h3 es una tendencia
    const titulo = () => screen.getAllByRole('heading', { level: 3 })[0].textContent;
    const antes = titulo();
    fireEvent.click(boton);
    await waitFor(() => expect(titulo()).not.toBe(antes));
    expect(peticiones.filter(p => p === 'GET proyectos').length).toBe(1);
  });

  it('si la portada del destacado no carga, enseña las iniciales; el siguiente vuelve a probar su imagen (D-22)', async () => {
    proyectos.forEach(p => { p.portada = `img/no-existe-${p.ciclo}.png`; });
    ir('/');
    render(<App />);
    await screen.findByText(/reacciones en total/);
    const destacado = () => screen.getAllByRole('article')[0];
    const titulo = () => within(destacado()).getAllByRole('heading', { level: 3 })[0].textContent;
    const antes = titulo();
    fireEvent.error(destacado().querySelector('img'));
    expect(destacado().querySelector('img')).toBeNull();
    expect(within(destacado()).getByText(iniciales(antes))).toHaveClass('text-indigo-claro');
    fireEvent.click(screen.getByRole('button', { name: 'Enséñame otro' }));
    await waitFor(() => expect(titulo()).not.toBe(antes));
    expect(destacado().querySelector('img')).not.toBeNull();
  });

  it('cambia a euskera sin recargar y lo recuerda', async () => {
    ir('/');
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'EU' }));
    expect(await screen.findByText('Joerak')).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('eu');
    expect(localStorage.getItem('pi_idioma')).toBe('eu');
  });

  it('la cabecera transparente sobre el índigo no usa texto-3; la de la galería sí', async () => {
    ir('/');
    const { unmount } = render(<App />);
    const cabecera = within(await screen.findByRole('banner'));
    [cabecera.getByText(/^CIFP Zornotza LHII · /), cabecera.getByRole('link', { name: 'Proyectos' }),
      cabecera.getByRole('link', { name: 'Cómo publicar' }), cabecera.getByRole('button', { name: 'EU' })]
      .forEach(el => expect(el).not.toHaveClass('text-texto-3'));
    unmount();
    ir('/galeria');
    render(<App />);
    expect(within(await screen.findByRole('banner')).getByRole('link', { name: 'Cómo publicar' })).toHaveClass('text-texto-3');
  });

  it('en móvil la cabecera oculta "Cómo publicar" y el texto de la marca (D-42)', async () => {
    ir('/');
    render(<App />);
    const cabecera = within(await screen.findByRole('banner'));
    expect(cabecera.getByRole('link', { name: 'Cómo publicar' })).toHaveClass('max-md:hidden');
    expect(cabecera.getByText('Proyectos intermodulares').parentElement).toHaveClass('max-md:sr-only');
    expect(cabecera.getByRole('navigation', { name: 'Principal' })).toHaveClass('max-md:order-last');
  });
});

describe('galería', () => {
  it('filtra por ciclo y por búsqueda', async () => {
    const buscador = () => screen.getByRole('searchbox', { name: 'Buscar por título, equipo o etiqueta' });
    ir('/galeria');
    render(<App />);
    await screen.findByText('Reservas de talleres');
    expect(screen.getByRole('button', { name: 'Todos · 3' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'SMR · 1' }));
    await waitFor(() => expect(screen.queryByText('Reservas de talleres')).toBeNull());
    expect(screen.getByText('Red segura para una asesoría')).toBeInTheDocument();
    expect(window.location.search).toBe('?ciclo=2SM');
    fireEvent.click(screen.getByRole('button', { name: 'Todos · 3' }));
    expect(buscador()).toHaveAttribute('placeholder', 'Buscar');
    fireEvent.change(buscador(), { target: { value: 'tpv' } });
    await waitFor(() => expect(screen.getAllByRole('article').length).toBe(1));
    const tpv = screen.getByRole('article');
    fireEvent.click(within(tpv).getByRole('button', { name: 'Más opciones' }));
    expect(within(tpv).getByRole('button', { name: 'Vídeo pendiente' })).toBeDisabled();
    fireEvent.change(buscador(), { target: { value: 'zzz' } });
    expect(await screen.findByText('Ningún proyecto coincide con la búsqueda.')).toBeInTheDocument();
  });

  it('las etiquetas de la tarjeta filtran y se quitan con el chip de la barra (D-41)', async () => {
    proyectos[0].etiquetas = ['mysql', 'laravel'];
    proyectos[2].etiquetas = ['mysql'];
    ir('/galeria');
    render(<App />);
    await screen.findByText('Reservas de talleres');
    fireEvent.click(screen.getAllByRole('button', { name: 'Filtrar por la etiqueta mysql' })[0]);
    await waitFor(() => expect(screen.getAllByRole('article').length).toBe(2));
    expect(screen.queryByText('Red segura para una asesoría')).toBeNull();
    expect(window.location.search).toBe('?etiqueta=mysql');
    for (const b of screen.getAllByRole('button', { name: 'Filtrar por la etiqueta mysql' })) expect(b).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Filtrar por la etiqueta laravel' })).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(screen.getByRole('button', { name: 'Quitar el filtro de etiqueta mysql' }));
    await waitFor(() => expect(screen.getAllByRole('article').length).toBe(3));
    expect(window.location.search).toBe('');
    expect(screen.queryByRole('button', { name: /Quitar el filtro de etiqueta/ })).toBeNull();
  });

  it('ciclo y etiqueta se combinan y se conservan entre sí en la URL (D-41)', async () => {
    proyectos[0].etiquetas = ['mysql'];
    proyectos[2].etiquetas = ['mysql'];
    ir('/galeria?ciclo=WG');
    render(<App />);
    await screen.findByText('Reservas de talleres');
    fireEvent.click(screen.getByRole('button', { name: 'Filtrar por la etiqueta mysql' }));
    await waitFor(() => expect(window.location.search).toBe('?ciclo=WG&etiqueta=mysql'));
    expect(screen.getAllByRole('article').length).toBe(1);
    fireEvent.click(screen.getByRole('button', { name: 'Todos · 3' }));
    await waitFor(() => expect(screen.getAllByRole('article').length).toBe(2));
    expect(window.location.search).toBe('?etiqueta=mysql');
    fireEvent.click(screen.getByRole('button', { name: 'DAM · 1' }));
    await waitFor(() => expect(window.location.search).toBe('?etiqueta=mysql&ciclo=PG'));
    expect(screen.getByText('TPV para la cafetería')).toBeInTheDocument();
    // pulsar la etiqueta activa la quita y conserva el ciclo
    fireEvent.click(screen.getByRole('button', { name: 'Filtrar por la etiqueta mysql' }));
    await waitFor(() => expect(window.location.search).toBe('?ciclo=PG'));
  });

  it('las acciones de la tarjeta van en un menú de tres puntos sobre la portada (D-28)', async () => {
    proyectos[1].repo = '';
    ir('/galeria');
    render(<App />);
    await screen.findByText('Reservas de talleres');
    expect(document.querySelectorAll('article a button, article a a').length).toBe(0);
    const tarjeta = titulo => screen.getAllByRole('article').find(a => within(a).queryByText(titulo));
    const t = within(tarjeta('Reservas de talleres'));
    expect(t.queryByRole('link', { name: 'Ver proyecto' })).toBeNull();
    const disparador = t.getByRole('button', { name: 'Más opciones' });
    expect(disparador).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(disparador);
    expect(disparador).toHaveAttribute('aria-expanded', 'true');
    expect(document.getElementById(disparador.getAttribute('aria-controls'))).not.toBeNull();
    expect(t.getByRole('link', { name: 'Ver proyecto' })).toHaveAttribute('href', '/proyectos/p/WG/reservas/');
    expect(t.getByRole('link', { name: 'Vídeo' })).toHaveAttribute('target', '_blank');
    expect(t.getByRole('link', { name: 'Código' })).toHaveAttribute('target', '_blank');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(disparador).toHaveAttribute('aria-expanded', 'false');
    expect(t.queryByRole('link', { name: 'Ver proyecto' })).toBeNull();
    expect(document.activeElement).toBe(disparador);
    fireEvent.click(disparador);
    fireEvent.pointerDown(document.body);
    expect(disparador).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(disparador);
    const enlace = t.getByRole('link', { name: 'Ver proyecto' });
    enlace.addEventListener('click', e => e.preventDefault()); // jsdom no navega
    fireEvent.click(enlace);
    expect(disparador).toHaveAttribute('aria-expanded', 'false');
    // sin repo no hay "Código"
    const r = within(tarjeta('Red segura para una asesoría'));
    fireEvent.click(r.getByRole('button', { name: 'Más opciones' }));
    expect(r.getByRole('link', { name: 'Vídeo' })).toBeInTheDocument();
    expect(r.queryByRole('link', { name: 'Código' })).toBeNull();
  });

  it('las tarjetas de tendencias de la portada llevan el menú y conservan la píldora (D-28)', async () => {
    ir('/');
    render(<App />);
    await screen.findByText(/reacciones en total/);
    const tendencias = screen.getAllByRole('article').slice(1);
    expect(tendencias.length).toBe(2);
    tendencias.forEach(a => {
      expect(within(a).queryByRole('link', { name: 'Ver proyecto' })).toBeNull();
      expect(within(a).getByText(/reacciones$/)).toBeInTheDocument();
      expect(within(a).getByRole('button', { name: 'Más opciones' })).toHaveAttribute('aria-expanded', 'false');
    });
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
    expect(megusta.textContent).toBe('');
    fireEvent.click(megusta);
    await waitFor(() => expect(within(ajena).getByRole('button', { name: 'Me gusta' })).toHaveAttribute('aria-pressed', 'true'));
    expect(within(ajena).getByRole('button', { name: 'Me gusta' })).toHaveTextContent('1');
    fireEvent.click(within(ajena).getByRole('button', { name: 'Me gusta' }));
    await waitFor(() => expect(within(ajena).getByRole('button', { name: 'Me gusta' })).toHaveAttribute('aria-pressed', 'false'));
    expect(within(ajena).getByRole('button', { name: 'Me gusta' }).textContent).toBe('');
    expect(peticiones.filter(p => p === 'POST reacciones').length).toBe(2);
  });

  it('si la portada no carga, la tarjeta enseña las iniciales en vez de la imagen rota (D-22)', async () => {
    proyectos[0].portada = 'img/no-existe.png';
    ir('/galeria');
    render(<App />);
    await screen.findByText('Reservas de talleres');
    const tarjeta = screen.getAllByRole('article').find(a => within(a).queryByText('Reservas de talleres'));
    expect(within(tarjeta).queryByText('RD')).toBeNull();
    fireEvent.error(tarjeta.querySelector('img'));
    expect(tarjeta.querySelector('img')).toBeNull();
    expect(within(tarjeta).getByText('RD')).toHaveClass('text-indigo-claro');
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

  it('el resumen de la tarjeta y la entradilla del login van en texto pleno, no en texto-2 (D-NEW)', async () => {
    ir('/galeria');
    const { unmount } = render(<App />);
    expect(await screen.findByText('Resumen de Reservas de talleres')).not.toHaveClass('text-texto-2');
    unmount();
    ir('/entrar');
    render(<App />);
    expect(await screen.findByText(/^Solo para alumnado y profesorado\./)).not.toHaveClass('text-texto-2');
  });

  it('sin píldora, con el formulario sin borde y el título con tracking de portada (D-39)', async () => {
    ir('/entrar');
    const { container } = render(<App />);
    const h1 = await screen.findByRole('heading', { level: 1 });
    expect(h1).toHaveClass('tracking-[0.03em]');
    expect(container.querySelector('.insignia')).toBeNull();
    expect(container.querySelector('form')).not.toHaveClass('border');
  });

  it('enseña el ejemplo de usuario como ayuda bajo el campo, no como placeholder (D-31)', async () => {
    ir('/entrar');
    render(<App />);
    const usuario = await screen.findByLabelText('Usuario');
    expect(usuario).not.toHaveAttribute('placeholder');
    expect(usuario).toHaveAccessibleDescription('Por ejemplo, ane.garcia');
  });

  it('ignora una ruta de vuelta externa', async () => {
    ir('/entrar?volver=//malo.example');
    sesion = { login: 'ane.garcia', nombre: 'Ane García', ciclo: 'DAW' };
    render(<App />);
    await waitFor(() => expect(window.location.pathname).toBe('/proyectos/galeria'));
  });
});

describe('página 404 (D-29)', () => {
  it('con cabecera y pie, invita a publicar con la guía y vuelve a la portada', async () => {
    ir('/esto-no-existe');
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('404');
    expect(screen.getByText('Este proyecto todavía no existe. ¿Es el tuyo?')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Guía para publicar' }).getAttribute('href')).toMatch(/proyectos\/LEEME\.md$/);
    expect(screen.getByRole('link', { name: 'Ir a la portada' })).toBeInTheDocument();
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    await screen.findByRole('link', { name: 'Iniciar sesión' });   // deja que la sesión termine de cargar
  });
});
