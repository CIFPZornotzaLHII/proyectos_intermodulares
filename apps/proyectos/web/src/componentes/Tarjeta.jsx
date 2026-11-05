import { Link } from 'react-router-dom';
import SpotlightCard from '../reactbits/SpotlightCard.jsx';
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

// Solo el ciclo (SMR, DAW, DAM): el grado sobraba en la etiqueta
export const Insignia = ({ p }) => <span className="insignia">{p.ciclo_nombre}</span>;

// Imagen de portada (o iniciales si el grupo no puso imagen) con la etiqueta del ciclo; enlaza a la landing
export function PortadaProyecto({ p, className = '', grande = false }) {
  const { t } = useIdioma();
  const conImagen = p.portada && !p.portada.endsWith('portada-defecto.svg');
  return (
    <a href={ruta(p.url)} aria-label={`${t('ver_proyecto')}: ${p.titulo}`}
      className={`relative flex items-center justify-center overflow-hidden bg-superficie-2 no-underline ${grande ? 'min-h-[380px] flex-[1_1_520px]' : 'aspect-video'} ${className}`}>
      {conImagen
        ? <img src={ruta(p.portada)} alt="" loading="lazy" className={`block size-full object-cover ${grande ? 'absolute inset-0' : ''}`} />
        : <span className={`font-titulo text-indigo-claro opacity-80 ${grande ? 'text-[72px]' : 'text-[44px]'}`} aria-hidden="true">{iniciales(p.titulo)}</span>}
      <span className="absolute top-[18px] left-[18px] z-[1] inline-flex gap-2"><Insignia p={p} /></span>
    </a>
  );
}

export function BotonesProyecto({ p, grande = false }) {
  const { t } = useIdioma();
  const tamano = grande ? 'normal' : 'pequeno';
  return (
    <>
      <Boton variante="menta" tamano={tamano} href={ruta(p.url)}>{t('ver_proyecto')}<Icono nombre="flecha" grosor={2.2} /></Boton>
      {p.video
        ? <Boton tamano={tamano} href={p.video} externo><Icono nombre="play" grosor={2} />{t(grande ? 'video_5' : 'video')}</Boton>
        : <Boton variante="pendiente" tamano={tamano}>{t('video_pendiente')}</Boton>}
      {p.repo && <Boton tamano={tamano} href={p.repo} externo><Icono nombre="codigo" grosor={2} />{t('codigo')}</Boton>}
    </>
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
              ${mia ? 'border-menta bg-menta/12 text-menta' : 'border-borde-2 bg-superficie-2 text-texto-3 hover:border-borde-claro hover:text-texto'}`}>
            <Icono nombre={r.icono} tam={15} /><span>{n}</span>
          </button>
        );
      })}
      {autor
        ? <span className="ml-auto text-[12px] text-texto-4">{t('es_tu_proyecto')}</span>
        : !usuario && <span className="ml-auto text-[12px] text-texto-4"><Link to="/entrar?volver=/galeria" className="font-semibold">{t('inicia_para_reaccionar')}</Link></span>}
    </div>
  );
}

// Tarjeta de la galería (con reacciones) o de "Tendencias" (con el total y un enlace)
export function TarjetaProyecto({ p, usuario, onReaccion, ocupado, modo = 'galeria' }) {
  const { t } = useIdioma();
  return (
    <SpotlightCard role="article" spotlightColor="#70FBB7" intensity={0.12} spotlightSize={260} borderGlow={0.7}
      style={{ ...ESTILO_TARJETA, borderRadius: 'var(--radius-tarjeta)' }}
      className="flex h-full flex-col transition-transform duration-150 hover:-translate-y-0.5" data-ciclo={p.ciclo}>
      <PortadaProyecto p={p} />
      <div className="flex flex-1 flex-col gap-2.5 px-5 pt-[18px] pb-4">
        <h3 className="text-[20px] leading-[1.22]"><a href={ruta(p.url)} className="text-texto no-underline hover:text-menta">{p.titulo}</a></h3>
        <p className="text-[13px] font-medium text-texto-3">{(p.equipo || []).join(' · ')}</p>
        <p className="text-[15px] text-texto-2">{p.resumen}</p>
        {modo === 'galeria' && (p.etiquetas || []).length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {p.etiquetas.map(e => <span key={e} className="rounded-full bg-superficie-2 px-[9px] py-[3px] text-[12px] text-texto-3">{e}</span>)}
          </div>
        )}
        {modo === 'galeria'
          ? <div className="mt-auto flex flex-wrap gap-2 pt-1.5"><BotonesProyecto p={p} /></div>
          : <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-1.5">
              <span className="pildora"><Icono nombre="corazon" tam={15} className="text-menta" />{t('reacciones_n', { n: totalReacciones(p) })}</span>
              <Boton tamano="pequeno" href={ruta(p.url)}>{t('ver_proyecto')}</Boton>
            </div>}
      </div>
      {modo === 'galeria' && <Reacciones p={p} usuario={usuario} onReaccion={onReaccion} ocupado={ocupado} />}
    </SpotlightCard>
  );
}

// Proyecto destacado de la portada: imagen grande a la izquierda, texto y reacciones a la derecha
export function Destacado({ p }) {
  const { t } = useIdioma();
  const resumen = REACCIONES.filter(x => (p.reacciones[x.emoji] || 0) > 0).sort((a, b) => p.reacciones[b.emoji] - p.reacciones[a.emoji]).slice(0, 3);
  return (
    <SpotlightCard role="article" spotlightColor="#70FBB7" intensity={0.1} spotlightSize={420} borderGlow={0.7}
      style={{ ...ESTILO_TARJETA, borderRadius: 'var(--radius-destacado)' }} className="flex flex-wrap">
      <PortadaProyecto p={p} grande />
      <div className="flex flex-[1_1_400px] flex-col justify-center gap-4 px-10 pt-10 pb-9 max-md:px-6 max-md:pt-7 max-md:pb-7">
        <h3 className="text-[clamp(26px,3vw,32px)]"><a href={ruta(p.url)} className="text-texto no-underline hover:text-menta">{p.titulo}</a></h3>
        <p className="text-[14px] font-medium text-texto-3">{(p.equipo || []).join(' · ')} · {p.ciclo_nombre}</p>
        <p className="text-[18px] text-texto-2">{p.resumen}</p>
        <div className="flex flex-wrap items-center gap-2">
          {resumen.map(x => <span key={x.emoji} className="pildora" title={t(x.nombre)}><Icono nombre={x.icono} tam={15} className="text-menta" />{p.reacciones[x.emoji]}</span>)}
          <span className="text-[13px] text-texto-3">{t('reacciones_total', { n: totalReacciones(p) })}</span>
        </div>
        <div className="flex flex-wrap gap-3"><BotonesProyecto p={p} grande /></div>
      </div>
    </SpotlightCard>
  );
}
