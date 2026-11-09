import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import App from '../src/App.jsx';
import { conReaccion, iniciales, totalReacciones } from '../src/datos.js';

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

  it('"Compartir" copia la URL absoluta de la landing, cierra el menú y lo confirma en la tarjeta (D-44)', async () => {
    const writeText = vi.fn().mockResolvedValue();
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    ir('/galeria');
    render(<App />);
    await screen.findByText('Reservas de talleres');
    const t = within(screen.getAllByRole('article').find(a => within(a).queryByText('Reservas de talleres')));
    const disparador = t.getByRole('button', { name: 'Más opciones' });
    expect(t.getByRole('status')).toHaveTextContent('');
    fireEvent.click(disparador);
    fireEvent.click(t.getByRole('button', { name: 'Compartir' }));
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/proyectos/p/WG/reservas/`);
    await waitFor(() => expect(t.getByRole('status')).toHaveTextContent('Enlace copiado'));
    expect(disparador).toHaveAttribute('aria-expanded', 'false');
    expect(document.activeElement).toBe(disparador);
    // las dos vías fallan
    writeText.mockRejectedValue(new Error('no'));
    const execCommand = vi.fn(() => false);
    document.execCommand = execCommand;
    fireEvent.click(disparador);
    fireEvent.click(t.getByRole('button', { name: 'Compartir' }));
    await waitFor(() => expect(t.getByRole('status')).toHaveTextContent('No se ha podido copiar el enlace'));
    expect(execCommand).toHaveBeenCalledWith('copy');
    expect(document.querySelector('textarea')).toBeNull();
    expect(document.activeElement).toBe(disparador);   // el textarea de la reserva no se queda el foco
    delete document.execCommand;
  });

  it('las tarjetas de tendencias de la portada no llevan "Compartir" (D-44)', async () => {
    ir('/');
    render(<App />);
    await screen.findByText(/reacciones en total/);
    screen.getAllByRole('article').slice(1).forEach(a => {
      fireEvent.click(within(a).getByRole('button', { name: 'Más opciones' }));
      expect(within(a).getByRole('link', { name: 'Ver proyecto' })).toBeInTheDocument();
      expect(within(a).queryByRole('button', { name: 'Compartir' })).toBeNull();
    });
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

describe('corazón de la portada (D-NEW)', () => {
  const ANE = { login: 'ane.garcia', nombre: 'Ane García', ciclo: 'DAW' };
  const NOMBRES = ['Me gusta', 'Buena idea', 'Ambicioso', 'Fuego', 'Me encanta'];
  const articulo = titulo => screen.getAllByRole('article').find(a => within(a).queryByText(titulo));
  // el total del proyecto, en una tendencia ("N reacciones", sr-only) o en el destacado ("N reacciones en total")
  const total = a => (within(a).queryByText(/^\d+ reacciones$/) || within(a).getByText(/reacciones en total/)).textContent.match(/\d+/)[0];
  const portada = async () => {
    ir('/');
    render(<App />);
    await screen.findByText(/reacciones en total/);
    await (sesion ? screen.findByText(sesion.nombre) : screen.findByRole('link', { name: 'Iniciar sesión' }));
  };
  const retener = () => vi.stubGlobal('fetch', vi.fn((url, o) => (url.endsWith('api/reacciones') ? new Promise(() => {}) : apiFalsa(url, o))));

  it('sin sesión, el corazón de cada tarjeta lleva a entrar y de vuelta a la portada', async () => {
    await portada();
    const tarjetas = screen.getAllByRole('article');
    expect(tarjetas.length).toBe(3);
    for (const a of tarjetas) expect(within(a).getByRole('link', { name: 'Inicia sesión para reaccionar' }).getAttribute('href')).toMatch(/\/entrar\?volver=\/$/);
    expect(screen.queryByRole('button', { name: 'Reaccionar' })).toBeNull();
  });

  it('con sesión, el propio proyecto no reacciona; en otro el abanico añade y quita sin mover la portada', async () => {
    sesion = ANE;
    await portada();
    const titulo = () => screen.getAllByRole('heading', { level: 3 })[0].textContent;
    const antes = titulo();
    const propia = articulo('Reservas de talleres');
    expect(within(propia).getByText('Es tu proyecto')).toBeInTheDocument();
    expect(within(propia).queryByRole('button', { name: /^(Reaccionar|Tu reacción)/ })).toBeNull();

    const ajena = articulo('Red segura para una asesoría');
    const corazon = within(ajena).getByRole('button', { name: 'Reaccionar' });
    expect(corazon).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(corazon);
    expect(corazon).toHaveAttribute('aria-expanded', 'true');
    const abanico = document.getElementById(corazon.getAttribute('aria-controls'));
    expect(abanico).toHaveAttribute('role', 'group');
    expect(abanico).toHaveAccessibleName('Elige una reacción');
    expect(within(abanico).getAllByRole('button').map(b => b.getAttribute('aria-label'))).toEqual(NOMBRES);
    for (const b of within(abanico).getAllByRole('button')) expect(b).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(within(abanico).getByRole('button', { name: 'Me gusta' }));
    expect(corazon).toHaveAttribute('aria-expanded', 'false');
    expect(within(ajena).queryByRole('button', { name: 'Me gusta' })).toBeNull();
    expect(document.activeElement).toBe(corazon);
    expect(corazon).toHaveAccessibleName('Tu reacción: Me gusta');
    expect(corazon.querySelector('svg')).toHaveClass('motion-safe:animate-menear');
    expect(total(ajena)).toBe('4');
    expect(within(ajena).getByTitle('Me gusta')).toHaveClass('text-menta');
    expect(within(ajena).getByTitle('Buena idea')).not.toHaveClass('text-menta');
    await waitFor(() => expect(corazon).toHaveAttribute('aria-busy', 'false'));

    // otra vez la misma: se quita, sin meneo
    fireEvent.click(corazon);
    const megusta = within(ajena).getByRole('button', { name: 'Me gusta' });
    expect(megusta).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(megusta);
    await waitFor(() => expect(corazon).toHaveAttribute('aria-busy', 'false'));
    expect(corazon).toHaveAccessibleName('Reaccionar');
    expect(corazon.querySelector('svg')).not.toHaveClass('motion-safe:animate-menear');
    expect(total(ajena)).toBe('3');
    expect(within(ajena).queryByTitle('Me gusta')).toBeNull();
    expect(peticiones.filter(p => p === 'POST reacciones').length).toBe(2);
    expect(peticiones.filter(p => p === 'GET proyectos').length).toBe(1);
    expect(titulo()).toBe(antes);
    expect(screen.getAllByRole('article').length).toBe(3);
  });

  it('la reacción se ve al momento, antes de que responda el servidor (añadir y cambiar)', async () => {
    sesion = ANE;
    Object.assign(proyectos[2], { reacciones: { '👏': 2 }, mias: ['👏'] });   // TPV: ya tiene "Me gusta" de Ane
    retener();
    await portada();
    const red = articulo('Red segura para una asesoría');
    fireEvent.click(within(red).getByRole('button', { name: 'Reaccionar' }));
    fireEvent.click(within(red).getByRole('button', { name: 'Me gusta' }));
    expect(within(red).getByRole('button', { name: 'Tu reacción: Me gusta' })).toHaveAttribute('aria-busy', 'true');
    expect(total(red)).toBe('4');

    const tpv = articulo('TPV para la cafetería');
    const corazon = within(tpv).getByRole('button', { name: 'Tu reacción: Me gusta' });
    fireEvent.click(corazon);
    expect(within(tpv).getByRole('button', { name: 'Me gusta' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(within(tpv).getByRole('button', { name: 'Fuego' }));
    expect(corazon).toHaveAccessibleName('Tu reacción: Fuego');
    expect(total(tpv)).toBe('2');
    expect(within(tpv).getByTitle('Me gusta')).not.toHaveClass('text-menta');
    expect(within(tpv).getByTitle('Fuego')).toHaveClass('text-menta');
  });

  it('si el servidor falla, el total vuelve a su valor y el corazón enseña el error', async () => {
    sesion = ANE;
    vi.stubGlobal('fetch', vi.fn((url, o) => (url.endsWith('api/reacciones')
      ? Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({ error: 'fallo' }) }) : apiFalsa(url, o))));
    await portada();
    const red = articulo('Red segura para una asesoría');
    expect(within(red).getByRole('alert')).toHaveTextContent('');
    fireEvent.click(within(red).getByRole('button', { name: 'Reaccionar' }));
    fireEvent.click(within(red).getByRole('button', { name: 'Me gusta' }));
    await waitFor(() => expect(within(red).getByRole('alert')).toHaveTextContent('fallo'));
    expect(total(red)).toBe('3');
    expect(within(red).getByRole('button', { name: 'Reaccionar' })).toBeInTheDocument();
  });

  it('el abanico se cierra con Escape (el foco vuelve al corazón), al pulsar fuera y al pulsar otra vez', async () => {
    sesion = ANE;
    await portada();
    const red = articulo('Red segura para una asesoría');
    const corazon = within(red).getByRole('button', { name: 'Reaccionar' });
    fireEvent.click(corazon);
    within(red).getByRole('button', { name: 'Buena idea' }).focus();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(corazon).toHaveAttribute('aria-expanded', 'false');
    expect(within(red).queryByRole('button', { name: 'Buena idea' })).toBeNull();
    expect(document.activeElement).toBe(corazon);
    fireEvent.click(corazon);
    fireEvent.pointerDown(document.body);
    expect(corazon).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(corazon);
    fireEvent.click(corazon);
    expect(corazon).toHaveAttribute('aria-expanded', 'false');
    expect(peticiones.filter(p => p === 'POST reacciones').length).toBe(0);
  });

  it('en euskera, el corazón y las cinco reacciones llevan sus nombres', async () => {
    sesion = ANE;
    localStorage.setItem('pi_idioma', 'eu');
    ir('/');
    render(<App />);
    await screen.findByText(/erreakzio guztira/);
    const corazon = await within(articulo('Red segura para una asesoría')).findByRole('button', { name: 'Erreakzionatu' });
    fireEvent.click(corazon);
    const abanico = document.getElementById(corazon.getAttribute('aria-controls'));
    expect(abanico).toHaveAccessibleName('Aukeratu erreakzio bat');
    expect(within(abanico).getAllByRole('button').map(b => b.getAttribute('aria-label'))).toEqual(['Gustatzen zait', 'Ideia ona', 'Handinahia', 'Sua', 'Izugarri gustatzen zait']);
  });

  it('conReaccion: añade, cambia y quita con una reacción por alumno, sin mutar el proyecto', () => {
    const p = { id: 'x', reacciones: { '💡': 3 }, mias: [] };
    const una = conReaccion(p, '👏');
    expect(totalReacciones(una)).toBe(4);
    expect(una.mias).toEqual(['👏']);
    const otra = conReaccion(una, '🔥');
    expect(totalReacciones(otra)).toBe(4);
    expect(otra.reacciones).toEqual({ '💡': 3, '👏': 0, '🔥': 1 });
    expect(otra.mias).toEqual(['🔥']);
    const quitada = conReaccion(otra, '🔥');
    expect(totalReacciones(quitada)).toBe(3);
    expect(quitada.mias).toEqual([]);
    expect(conReaccion({ reacciones: {}, mias: ['👏'] }, '👏').reacciones['👏']).toBe(0);   // nunca por debajo de 0
    expect(p).toEqual({ id: 'x', reacciones: { '💡': 3 }, mias: [] });
    expect(una.mias).toEqual(['👏']);
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

  it('el botón Mostrar/Ocultar alterna la contraseña, con su texto en ES y EU (D-43)', async () => {
    ir('/entrar');
    const { unmount } = render(<App />);
    const campo = await screen.findByLabelText('Contraseña');
    expect(campo).toHaveAttribute('type', 'password');
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar' }));
    expect(campo).toHaveAttribute('type', 'text');
    fireEvent.click(screen.getByRole('button', { name: 'Ocultar' }));
    expect(campo).toHaveAttribute('type', 'password');
    unmount();
    localStorage.setItem('pi_idioma', 'eu');
    ir('/entrar');
    render(<App />);
    expect(await screen.findByRole('button', { name: 'Erakutsi' })).toHaveAttribute('aria-controls', 'contrasena');
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
