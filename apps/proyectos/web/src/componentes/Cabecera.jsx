import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useIdioma } from '../i18n.jsx';
import { useSesion } from '../sesion.jsx';
import { ruta } from '../api.js';
import { iniciales } from '../datos.js';
import Boton from './Boton.jsx';
import Icono from './Icono.jsx';

// Cabecera transparente (sobre el índigo de la portada). Cuando el scroll la saca de la vista, la misma cabecera
// pasa a fija y entra desde arriba con una animación sutil (12 px y fundido, ease-in); al volver arriba sale con la
// animación inversa y, al terminar, vuelve a ser la transparente. Estados: 'libre' | 'fija' | 'saliendo'.
// Un hueco del mismo alto ocupa su sitio mientras está fija para que la página no salte.
// Con `sobreIndigo` (la portada), los textos secundarios de la transparente usan texto/90 (4,9:1 sobre índigo, D-21).
export default function Cabecera({ sencilla = false, sobreIndigo = false }) {
  const { t, idioma, cambiarIdioma } = useIdioma();
  const { usuario, salir } = useSesion();
  const { pathname } = useLocation();
  const ref = useRef(null);
  const [fijada, setFijada] = useState('libre');
  const [alto, setAlto] = useState(80);

  useEffect(() => {
    const medir = () => { if (ref.current && !ref.current.classList.contains('fixed')) setAlto(ref.current.offsetHeight); };
    const alScroll = () => setFijada(f => {
      if (window.scrollY > (ref.current ? ref.current.offsetHeight : 80)) return 'fija';
      return f === 'fija' ? 'saliendo' : f;   // solo la fija sale con animación; 'saliendo' y 'libre' no cambian
    });
    medir(); alScroll();
    window.addEventListener('scroll', alScroll, { passive: true });
    window.addEventListener('resize', medir);
    return () => { window.removeEventListener('scroll', alScroll); window.removeEventListener('resize', medir); };
  }, []);

  const fija = fijada !== 'libre';
  const tenue = sobreIndigo && !fija ? 'text-texto/90' : 'text-texto-3';
  // En móvil (D-30) la navegación baja a una segunda fila; en Entrar, "Volver" hace de navegación y va al final
  const nav = (
    <nav className="flex flex-wrap items-center gap-[18px] text-cuerpo font-semibold max-md:order-last max-md:basis-full" aria-label="Principal">
      {sencilla ? (
        <Boton to="/galeria" tamano="pequeno"><Icono nombre="atras" tam={16} grosor={2} />{t('volver_proyectos')}</Boton>
      ) : (
        <>
          <NavLink to="/galeria" className={({ isActive }) => `inline-flex min-h-[44px] items-center no-underline ${isActive ? 'text-texto' : `${tenue} hover:text-texto`}`}>{t('nav_proyectos')}</NavLink>
          <Link to="/#publicar" className={`inline-flex min-h-[44px] items-center ${tenue} no-underline hover:text-texto max-md:hidden`}>{t('nav_publicar')}</Link>
        </>
      )}
    </nav>
  );
  return (
    <>
      {fija && <div style={{ height: alto }} aria-hidden="true" />}
    <header ref={ref} onAnimationEnd={e => { if (e.animationName === 'subir') setFijada('libre'); }}
      className={`inset-x-0 top-0 z-20 ${fija ? `fixed border-b border-borde bg-onice/90 backdrop-blur-md ${fijada === 'fija' ? 'animate-bajar' : 'animate-subir'}` : 'relative bg-transparent'}`}>
      <div className="contenedor flex flex-wrap items-center gap-x-[18px] gap-y-4 py-3.5 max-md:gap-x-3 max-md:gap-y-1">
        <Link to="/" className="mr-auto flex items-center gap-6 text-texto no-underline hover:text-texto">
          <img src={ruta('img/logo.png')} alt={t('logo_alt')} width="116" height="52" className="block h-[52px] w-auto max-md:h-10" />
          <span className="flex flex-col leading-[1.15] max-md:sr-only">
            <strong className="font-titulo text-entradilla tracking-[0.01em]">{t('marca')}</strong>
            <span className={`text-pequeno ${tenue}`}>CIFP Zornotza LHII · {t('marca_sub')}</span>
          </span>
        </Link>

        {!sencilla && nav}

        <span className="inline-flex overflow-hidden rounded-lg border border-borde text-pequeno font-semibold" role="group" aria-label={t('idioma')}>
          {['es', 'eu'].map(cod => (
            <button key={cod} type="button" onClick={() => cambiarIdioma(cod)} aria-pressed={idioma === cod}
              className={`min-h-8 border-0 px-3 py-1.5 ${idioma === cod ? 'bg-borde text-texto' : `bg-transparent ${tenue} hover:text-texto`}`}>
              {cod.toUpperCase()}
            </button>
          ))}
        </span>

        {!sencilla && (usuario ? (
          <span className="inline-flex items-center gap-2.5 text-cuerpo font-semibold">
            <span className="inline-flex size-[34px] items-center justify-center rounded-full bg-indigo text-pequeno font-bold text-blanco" aria-hidden="true">{iniciales(usuario.nombre || usuario.login)}</span>
            <span className="flex flex-col leading-[1.15] max-md:sr-only">
              <span>{usuario.nombre || usuario.login}</span>
              <small className={`text-pequeno font-medium ${tenue}`}>{usuario.ciclo || ''}</small>
            </span>
            <Boton tamano="pequeno" onClick={salir}>{t('salir')}</Boton>
          </span>
        ) : (
          <Boton to={`/entrar?volver=${encodeURIComponent(pathname)}`} tamano="pequeno"><Icono nombre="usuario" />{t('entrar')}</Boton>
        ))}
        {sencilla && nav}
      </div>
    </header>
    </>
  );
}
