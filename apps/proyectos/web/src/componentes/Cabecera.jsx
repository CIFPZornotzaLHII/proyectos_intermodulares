import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useIdioma } from '../i18n.jsx';
import { useSesion } from '../sesion.jsx';
import { ruta } from '../api.js';
import { iniciales } from '../datos.js';
import Boton from './Boton.jsx';
import Icono from './Icono.jsx';

// Cabecera transparente (sobre el índigo de la portada). Cuando el scroll la saca de la vista, la misma cabecera
// pasa a fija y entra desde arriba con una animación ease-in; al volver arriba, desaparece y queda la transparente.
// Un hueco del mismo alto ocupa su sitio mientras está fija para que la página no salte.
export default function Cabecera({ sencilla = false }) {
  const { t, idioma, cambiarIdioma } = useIdioma();
  const { usuario, salir } = useSesion();
  const { pathname } = useLocation();
  const ref = useRef(null);
  const [fijada, setFijada] = useState(false);
  const [alto, setAlto] = useState(80);

  useEffect(() => {
    const medir = () => { if (ref.current && !ref.current.classList.contains('fixed')) setAlto(ref.current.offsetHeight); };
    const alScroll = () => setFijada(window.scrollY > (ref.current ? ref.current.offsetHeight : 80));
    medir(); alScroll();
    window.addEventListener('scroll', alScroll, { passive: true });
    window.addEventListener('resize', medir);
    return () => { window.removeEventListener('scroll', alScroll); window.removeEventListener('resize', medir); };
  }, []);

  return (
    <>
      {fijada && <div style={{ height: alto }} aria-hidden="true" />}
    <header ref={ref} className={`inset-x-0 top-0 z-20 ${fijada ? 'fixed border-b border-borde bg-onice/90 backdrop-blur-md animate-bajar' : 'relative bg-transparent'}`}>
      <div className="contenedor flex flex-wrap items-center justify-between gap-4 py-3.5">
        <Link to="/" className="flex items-center gap-6 text-texto no-underline hover:text-texto">
          <img src={ruta('img/logo.png')} alt={t('logo_alt')} width="116" height="52" className="block h-[52px] w-auto" />
          <span className="flex flex-col leading-[1.15]">
            <strong className="font-titulo text-[18px] tracking-[0.01em]">{t('marca')}</strong>
            <span className="text-[12px] text-texto-3">CIFP Zornotza LHII · {t('marca_sub')}</span>
          </span>
        </Link>

        <nav className="flex flex-wrap items-center gap-[18px] text-[14px] font-semibold" aria-label="Principal">
          {!sencilla && (
            <>
              <NavLink to="/galeria" className={({ isActive }) => `inline-flex min-h-[44px] items-center no-underline ${isActive ? 'text-texto' : 'text-texto-3 hover:text-texto'}`}>{t('nav_proyectos')}</NavLink>
              <Link to="/#publicar" className="inline-flex min-h-[44px] items-center text-texto-3 no-underline hover:text-texto">{t('nav_publicar')}</Link>
            </>
          )}

          <span className="inline-flex overflow-hidden rounded-lg border border-borde text-[13px]" role="group" aria-label={t('idioma')}>
            {['es', 'eu'].map(cod => (
              <button key={cod} type="button" onClick={() => cambiarIdioma(cod)} aria-pressed={idioma === cod}
                className={`min-h-8 border-0 px-3 py-1.5 ${idioma === cod ? 'bg-borde text-texto' : 'bg-transparent text-texto-3 hover:text-texto'}`}>
                {cod.toUpperCase()}
              </button>
            ))}
          </span>

          {sencilla ? (
            <Boton to="/galeria" tamano="pequeno"><Icono nombre="atras" tam={16} grosor={2} />{t('volver_proyectos')}</Boton>
          ) : usuario ? (
            <span className="inline-flex items-center gap-2.5">
              <span className="inline-flex size-[34px] items-center justify-center rounded-full bg-indigo text-[13px] font-bold text-blanco" aria-hidden="true">{iniciales(usuario.nombre || usuario.login)}</span>
              <span className="flex flex-col leading-[1.15]">
                <span>{usuario.nombre || usuario.login}</span>
                <small className="font-medium text-texto-3">{usuario.ciclo || ''}</small>
              </span>
              <Boton tamano="pequeno" onClick={salir}>{t('salir')}</Boton>
            </span>
          ) : (
            <Boton to={`/entrar?volver=${encodeURIComponent(pathname)}`} tamano="pequeno"><Icono nombre="usuario" />{t('entrar')}</Boton>
          )}
        </nav>
      </div>
    </header>
    </>
  );
}
