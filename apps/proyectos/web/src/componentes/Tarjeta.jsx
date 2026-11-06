import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import SpotlightCard from '../reactbits/SpotlightCard.jsx';
import Noise from '../reactbits/Noise.jsx';
import { useIdioma } from '../i18n.jsx';
import { ruta } from '../api.js';
import { REACCIONES, esAutor, iniciales, totalReacciones } from '../datos.js';
import Boton from './Boton.jsx';
import Icono from './Icono.jsx';

// Tarjeta de React Bits (SpotlightCard) con la paleta del centro: superficie, borde y foco menta al pasar el ratón
export const ESTILO_TARJETA = {
  '--spotlight-card-surface': '#0A0A1F',
  '--spotlight-card-border': '#26224F',
  '--spotlight-card-shadow': '0 24px 48px -24px rgba(0, 0, 0, 0.6)',
  padding: 0,
};

// Sin imagen propia el grupo deja la de la plantilla: se pintan sus iniciales
const conImagen = p => p.portada && !p.portada.endsWith('portada-defecto.svg');

// Si la imagen no carga (onError) también van las iniciales; se guarda qué ruta falló, así otra portada vuelve a probarse
function usePortada(p) {
  const [rota, setRota] = useState(null);
  return [conImagen(p) && rota !== p.portada, () => setRota(p.portada)];
}

// Solo el ciclo (SMR, DAW, DAM): el grado sobraba en la etiqueta
export const Insignia = ({ p }) => <span className="insignia">{p.ciclo_nombre}</span>;

// Imagen de portada (o iniciales si el grupo no puso imagen) con la etiqueta del ciclo; enlaza a la landing
export function PortadaProyecto({ p, className = '' }) {
  const { t } = useIdioma();
  const [imagen, alFallar] = usePortada(p);
  return (
    <a href={ruta(p.url)} aria-label={`${t('ver_proyecto')}: ${p.titulo}`}
      className={`relative flex aspect-video items-center justify-center overflow-hidden bg-superficie-2 no-underline ${className}`}>
      {imagen
        ? <img src={ruta(p.portada)} alt="" loading="lazy" onError={alFallar} className="block size-full object-cover" />
        : <span className="font-titulo text-[44px] text-indigo-claro opacity-80" aria-hidden="true">{iniciales(p.titulo)}</span>}
      <span className="absolute top-[18px] left-[18px] z-[1] inline-flex gap-2"><Insignia p={p} /></span>
    </a>
  );
}

// Botón redondo de solo icono, 44 px, legible sobre cualquier portada
const REDONDO = 'inline-flex size-11 items-center justify-center rounded-full border border-borde-claro bg-onice/80 text-texto no-underline hover:text-menta';

// Menú de tres puntos sobre la portada (D-NEW): disclosure con aria-expanded; se cierra con Escape, al pulsar fuera o al elegir
function MenuProyecto({ p }) {
  const { t } = useIdioma();
  const [abierto, setAbierto] = useState(false);
  const id = useId();
  const caja = useRef(null);
  const disparador = useRef(null);
  useEffect(() => {
    if (!abierto) return;
    const fuera = e => { if (!caja.current.contains(e.target)) setAbierto(false); };
    const tecla = e => { if (e.key === 'Escape') { setAbierto(false); disparador.current.focus(); } };
    document.addEventListener('pointerdown', fuera);
    document.addEventListener('keydown', tecla);
    return () => { document.removeEventListener('pointerdown', fuera); document.removeEventListener('keydown', tecla); };
  }, [abierto]);
  const cerrar = () => setAbierto(false);
  const entrada = i => ({ className: `${REDONDO} motion-safe:animate-desplegar`, style: { animationDelay: `${i * 50}ms` } });
  return (
    <div ref={caja} className="absolute top-[18px] right-[18px] z-[2] flex flex-col items-center gap-2">
      <button ref={disparador} type="button" aria-label={t('mas_opciones')} title={t('mas_opciones')} aria-expanded={abierto} aria-controls={id}
        onClick={() => setAbierto(!abierto)} className={REDONDO}><Icono nombre="puntos" tam={20} grosor={2.6} /></button>
      {abierto && (
        <div id={id} className="flex flex-col gap-2">
          <a href={ruta(p.url)} aria-label={t('ver_proyecto')} title={t('ver_proyecto')} onClick={cerrar} {...entrada(0)}><Icono nombre="flecha" tam={18} grosor={2.2} /></a>
          {p.video
            ? <a href={p.video} target="_blank" rel="noopener" aria-label={t('video')} title={t('video')} onClick={cerrar} {...entrada(1)}><Icono nombre="play" tam={18} grosor={2} /></a>
            : <button type="button" disabled aria-label={t('video_pendiente')} title={t('video_pendiente')} className={`${REDONDO} motion-safe:animate-desplegar cursor-default opacity-55`} style={entrada(1).style}><Icono nombre="play" tam={18} grosor={2} /></button>}
          {p.repo && <a href={p.repo} target="_blank" rel="noopener" aria-label={t('codigo')} title={t('codigo')} onClick={cerrar} {...entrada(2)}><Icono nombre="codigo" tam={18} grosor={2} /></a>}
        </div>
      )}
    </div>
  );
}

// Pie con las cinco reacciones. onReaccion(emoji) lo da la galería; sin usuario, enlaza al login
export function Reacciones({ p, usuario, onReaccion, ocupado = false }) {
  const { t } = useIdioma();
  const autor = esAutor(p, usuario);
  return (
    <div className="flex flex-wrap items-center gap-1.5 border-t border-borde px-5 py-2.5">
      {REACCIONES.map(r => {
        const n = (p.reacciones && p.reacciones[r.emoji]) || 0;
        const mia = (p.mias || []).includes(r.emoji);
        return (
          <button key={r.emoji} type="button" aria-pressed={mia} aria-label={t(r.nombre)} title={t(r.nombre)} disabled={autor || ocupado}
            onClick={() => onReaccion && onReaccion(r.emoji)}
            className={`inline-flex min-h-9 items-center gap-[5px] rounded-full border px-2.5 py-1.5 text-[13px] font-semibold transition-colors duration-150 disabled:cursor-default disabled:opacity-55
              ${mia ? 'border-menta bg-menta/12 text-menta' : 'border-borde-claro bg-superficie-2 text-texto-2 hover:text-texto'}`}>
            <Icono nombre={r.icono} tam={18} />{n > 0 && <span>{n}</span>}
          </button>
        );
      })}
      {autor
        ? <span className="ml-auto whitespace-nowrap text-[12px] text-texto-4">{t('es_tu_proyecto')}</span>
        : !usuario && <span className="ml-auto text-[12px] text-texto-4"><Link to="/entrar?volver=/galeria" className="font-semibold">{t('inicia_para_reaccionar')}</Link></span>}
    </div>
  );
}

// Tarjeta de la galería (con reacciones) o de "Tendencias" (con el total); las acciones van en el menú de tres puntos
export function TarjetaProyecto({ p, usuario, onReaccion, ocupado, modo = 'galeria' }) {
  const { t } = useIdioma();
  return (
    <SpotlightCard role="article" spotlightColor="#70FBB7" intensity={0.12} spotlightSize={260} borderGlow={0.7}
      style={{ ...ESTILO_TARJETA, borderRadius: 'var(--radius-tarjeta)' }}
      className="flex h-full flex-col transition-transform duration-150 hover:-translate-y-0.5" data-ciclo={p.ciclo}>
      <div className="relative"><PortadaProyecto p={p} /><MenuProyecto p={p} /></div>
      <div className="flex flex-1 flex-col gap-2.5 px-5 pt-[18px] pb-4">
        <h3 className="text-[20px]"><a href={ruta(p.url)} className="text-texto no-underline hover:text-menta">{p.titulo}</a></h3>
        <p className="text-[13px] font-medium text-texto-3">{(p.equipo || []).join(' · ')}</p>
        <p className="text-[15px] text-texto-2">{p.resumen}</p>
        {modo === 'galeria' && (p.etiquetas || []).length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {p.etiquetas.map(e => <span key={e} className="rounded-full bg-superficie-2 px-[9px] py-[3px] text-[12px] text-texto-3">{e}</span>)}
          </div>
        )}
        {modo !== 'galeria' && <div className="mt-auto flex flex-wrap items-center gap-2 pt-1.5">
              <span className="pildora" title={t('reacciones_n', { n: totalReacciones(p) })}><Icono nombre="corazon" tam={15} className="text-menta" /><span aria-hidden="true">{totalReacciones(p)}</span><span className="sr-only">{t('reacciones_n', { n: totalReacciones(p) })}</span></span>
            </div>}
      </div>
      {modo === 'galeria' && <Reacciones p={p} usuario={usuario} onReaccion={onReaccion} ocupado={ocupado} />}
    </SpotlightCard>
  );
}

// Proyecto destacado de la portada como hero section (D-20): la foto a sangre ocupa todo el bloque, con el grano de
// React Bits (Noise) y un degradado de ónice desde abajo a la izquierda; encima, abajo a la izquierda, el texto con
// mucha escala (título de portada en Impact, cifra grande en menta) y una sola acción menta; vídeo y código, enlaces.
const ENLACE_DISCRETO = 'inline-flex min-h-[44px] items-center gap-2 text-[15px] font-semibold text-texto-2 no-underline hover:text-menta';

export function Destacado({ p }) {
  const { t } = useIdioma();
  const [imagen, alFallar] = usePortada(p);
  const resumen = REACCIONES.filter(x => (p.reacciones[x.emoji] || 0) > 0).sort((a, b) => p.reacciones[b.emoji] - p.reacciones[a.emoji]).slice(0, 3);
  return (
    <SpotlightCard role="article" spotlightColor="#70FBB7" intensity={0.1} spotlightSize={420} borderGlow={0.7}
      style={{ ...ESTILO_TARJETA, '--spotlight-card-surface': 'var(--color-superficie-2)', borderRadius: 'var(--radius-destacado)' }}
      className="flex min-h-[min(80vh,720px)] flex-col justify-end max-md:min-h-[560px]">
      {imagen
        ? <img src={ruta(p.portada)} alt="" onError={alFallar} className="absolute inset-0 block size-full object-cover" />
        : <span aria-hidden="true" className="absolute inset-x-0 top-0 flex h-3/5 items-center justify-center font-titulo text-[clamp(160px,28vw,380px)] leading-none text-indigo-claro opacity-80">{iniciales(p.titulo)}</span>}
      <Noise opacity={0.14} size={1.5} fps={12} contrast={0.5} blendMode="soft-light" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(0deg,rgba(1,1,13,1)_0%,rgba(1,1,13,0.9)_30%,rgba(1,1,13,0.5)_55%,transparent_80%)]" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_70%_at_0%_100%,rgba(1,1,13,0.75)_0%,transparent_70%)]" />
      <span className="absolute top-[18px] left-[18px] inline-flex gap-2"><Insignia p={p} /></span>

      <div className="relative flex max-w-[960px] flex-col gap-5 px-12 pt-24 pb-11 max-md:gap-4 max-md:px-6 max-md:pb-7">
        <p className="font-mono text-[12px] uppercase tracking-[0.16em] text-texto-3">{(p.equipo || []).join(' · ')} · {p.ciclo_nombre}</p>
        <h3 className="text-[clamp(48px,7vw,112px)] leading-[0.92] tracking-[0.025em] [overflow-wrap:anywhere]"><a href={ruta(p.url)} className="text-texto no-underline hover:text-menta">{p.titulo}</a></h3>
        <p className="max-w-[60ch] text-[19px] leading-[1.5] text-texto-2">{p.resumen}</p>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <p className="flex items-baseline gap-2.5 text-[13px] text-texto-3"><span className="font-titulo text-[clamp(40px,5vw,64px)] leading-none text-menta">{totalReacciones(p)}</span> {t('reacciones_total_texto')}</p>
          {resumen.length > 0 && <div className="flex flex-wrap gap-2">
            {resumen.map(x => <span key={x.emoji} className="pildora" title={t(x.nombre)}><Icono nombre={x.icono} tam={15} className="text-menta" />{p.reacciones[x.emoji]}</span>)}
          </div>}
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1">
          <Boton variante="menta" href={ruta(p.url)}>{t('ver_proyecto')}<Icono nombre="flecha" grosor={2.2} /></Boton>
          {p.video
            ? <a href={p.video} target="_blank" rel="noopener" className={ENLACE_DISCRETO}><Icono nombre="play" grosor={2} />{t('video_5')}</a>
            : <span className="inline-flex min-h-[44px] items-center text-[15px] font-semibold text-texto-4">{t('video_pendiente')}</span>}
          {p.repo && <a href={p.repo} target="_blank" rel="noopener" className={ENLACE_DISCRETO}><Icono nombre="codigo" grosor={2} />{t('codigo')}</a>}
        </div>
      </div>
    </SpotlightCard>
  );
}
