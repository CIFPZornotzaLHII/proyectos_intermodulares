import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useIdioma } from '../i18n.jsx';
import { REACCIONES, esAutor } from '../datos.js';
import Icono from './Icono.jsx';

// Solo el icono, sin círculo ni fondo: 44 px pulsables; el redondeo es para el contorno de foco
const SOLO_ICONO = 'inline-flex size-11 shrink-0 items-center justify-center rounded-full no-underline pulsable hover:text-menta';

// Sitio de cada reacción respecto al corazón: un cuarto de círculo de 116 px de radio, de arriba a la derecha (22,5° y
// unos 45 px entre centros). Hacia la derecha porque el corazón va a la izquierda de su fila y la tarjeta recorta
const SITIOS = REACCIONES.map((_, i) => {
  const a = (Math.PI / 2) * (1 - i / (REACCIONES.length - 1));
  return { x: Math.round(116 * Math.cos(a)), y: Math.round(-116 * Math.sin(a)) };
});

// Corazón que despliega en abanico las cinco reacciones (D-47); disclosure como el menú de tres puntos (D-28): se
// cierra con Escape, al pulsar fuera, al pulsar otra vez o al elegir. onReaccion(emoji) resuelve a null o al texto del
// error. Sin usuario enlaza al login; en el proyecto propio no hay botón
export default function Abanico({ p, usuario, onReaccion, ocupado = false, volver = '/' }) {
  const { t } = useIdioma();
  const [abierto, setAbierto] = useState(false);
  const [meneo, setMeneo] = useState(0);   // cuenta las elecciones: con otra key el icono se monta de nuevo y vuelve a menearse
  const [error, setError] = useState(null);
  const reloj = useRef(null);
  const id = useId();
  const caja = useRef(null);
  const disparador = useRef(null);
  useEffect(() => () => clearTimeout(reloj.current), []);
  useEffect(() => {
    if (!abierto) return;
    const fuera = e => { if (!caja.current.contains(e.target)) setAbierto(false); };
    const tecla = e => { if (e.key === 'Escape') { setAbierto(false); disparador.current.focus(); } };
    document.addEventListener('pointerdown', fuera);
    document.addEventListener('keydown', tecla);
    return () => { document.removeEventListener('pointerdown', fuera); document.removeEventListener('keydown', tecla); };
  }, [abierto]);

  if (!usuario) return (
    <Link to={`/entrar?volver=${volver}`} aria-label={t('inicia_para_reaccionar')} title={t('inicia_para_reaccionar')} className={`${SOLO_ICONO} text-texto`}>
      <Icono nombre="corazon" tam={26} grosor={2} className="drop-shadow-icono" />
    </Link>
  );
  if (esAutor(p, usuario)) return (
    <span className="inline-flex min-h-11 items-center gap-2 text-pequeno text-texto-4">
      <Icono nombre="corazon" tam={26} grosor={2} className="opacity-55" />{t('es_tu_proyecto')}
    </span>
  );

  const mias = p.mias || [];
  const elegida = REACCIONES.find(r => r.emoji === mias[mias.length - 1]);   // con la API de 025 es la única; con la actual, la última
  const nombre = elegida ? t('tu_reaccion', { r: t(elegida.nombre) }) : t('reaccionar');
  const elegir = async r => {
    const quita = mias.includes(r.emoji);
    setAbierto(false);
    disparador.current.focus();
    setMeneo(n => (quita ? 0 : n + 1));
    const fallo = await onReaccion(r.emoji);
    clearTimeout(reloj.current);
    setError(fallo || null);
    if (fallo) reloj.current = setTimeout(() => setError(null), 4000);
  };
  return (
    <div ref={caja} className="relative">
      <button ref={disparador} type="button" aria-label={nombre} title={nombre} aria-expanded={abierto} aria-controls={id} aria-busy={ocupado}
        onClick={() => { if (!ocupado) setAbierto(!abierto); }} className={`${SOLO_ICONO} ${elegida ? 'text-menta' : 'text-texto'}`}>
        <Icono key={meneo} nombre={elegida ? elegida.icono : 'corazon'} tam={26} grosor={2} className={`drop-shadow-icono ${meneo ? 'motion-safe:animate-menear' : ''}`} />
      </button>
      {abierto && (
        <div id={id} role="group" aria-label={t('elige_reaccion')} className="absolute top-0 left-0 z-10">
          {REACCIONES.map((r, i) => {
            const { x, y } = SITIOS[i];
            const mia = mias.includes(r.emoji);
            return (
              <button key={r.emoji} type="button" aria-label={t(r.nombre)} title={t(r.nombre)} aria-pressed={mia} onClick={() => elegir(r)}
                style={{ left: x, top: y, '--desde-x': `${-x}px`, '--desde-y': `${-y}px`, animationDelay: `${i * 50}ms` }}
                className={`${SOLO_ICONO} absolute motion-safe:animate-abanico ${mia ? 'text-menta' : 'text-texto'}`}>
                <Icono nombre={r.icono} tam={26} grosor={2} className="drop-shadow-icono" />
              </button>
            );
          })}
        </div>
      )}
      {/* siempre montada (vacía sin error), como el aviso de "Compartir" (D-44) */}
      <p role="alert" className="absolute bottom-full left-0 z-10 mb-2 w-max max-w-64">
        {error && <span className="flex items-center gap-2 rounded-[10px] border border-error/35 bg-onice px-3 py-2 text-pequeno text-error"><Icono nombre="alerta" tam={15} grosor={2} />{error}</span>}
      </p>
    </div>
  );
}

// Reacciones con votos, de más a menos: el icono con sombra y el número, sin píldora; la del usuario en menta y el resto
// en gris. El nombre va en sr-only tras el número ("3 Buena idea")
export function ResumenReacciones({ p }) {
  const { t } = useIdioma();
  const n = e => (p.reacciones && p.reacciones[e]) || 0;
  const con = REACCIONES.filter(r => n(r.emoji) > 0).sort((a, b) => n(b.emoji) - n(a.emoji));
  if (!con.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {con.map(r => (
        <span key={r.emoji} title={t(r.nombre)} className={`inline-flex items-center gap-1 text-pequeno font-semibold ${(p.mias || []).includes(r.emoji) ? 'text-menta' : 'text-texto-3'}`}>
          <Icono nombre={r.icono} tam={18} grosor={2} className="drop-shadow-icono" />{n(r.emoji)}<span className="sr-only"> {t(r.nombre)}</span>
        </span>
      ))}
    </div>
  );
}
