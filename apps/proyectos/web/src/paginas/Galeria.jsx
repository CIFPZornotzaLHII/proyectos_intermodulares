import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DotGrid from '../reactbits/DotGrid.jsx';
import AnimatedContent from '../reactbits/AnimatedContent.jsx';
import { useIdioma } from '../i18n.jsx';
import { useSesion } from '../sesion.jsx';
import useProyectos from '../useProyectos.js';
import { reaccionar } from '../api.js';
import { coincide } from '../datos.js';
import Cabecera from '../componentes/Cabecera.jsx';
import Pie from '../componentes/Pie.jsx';
import Llamada from '../componentes/Llamada.jsx';
import Icono from '../componentes/Icono.jsx';
import { TarjetaProyecto } from '../componentes/Tarjeta.jsx';

export default function Galeria() {
  const { t } = useIdioma();
  const { usuario } = useSesion();
  const { lista, ciclos, estado, actualizar } = useProyectos();
  const [parametros, setParametros] = useSearchParams();
  const filtro = parametros.get('ciclo') || '';
  const etiqueta = parametros.get('etiqueta') || '';
  const [consulta, setConsulta] = useState('');
  const [ocupado, setOcupado] = useState(null); // id del proyecto cuya reacción está en vuelo
  const [error, setError] = useState('');
  const navegar = useNavigate();

  // Cambia un parámetro de la URL conservando el otro (ciclo y etiqueta se combinan, D-41)
  const poner = (clave, valor) => {
    const q = new URLSearchParams(parametros);
    if (valor) q.set(clave, valor); else q.delete(clave);
    setParametros(q, { replace: true });
  };
  const visibles = lista.filter(p => (!filtro || p.ciclo === filtro) && (!etiqueta || (p.etiquetas || []).includes(etiqueta)) && coincide(p, consulta));
  const cuenta = c => lista.filter(p => !c || p.ciclo === c).length;

  const onReaccion = async (p, emoji) => {
    if (!usuario) return navegar('/entrar?volver=/galeria');
    setOcupado(p.id); setError('');
    const r = await reaccionar(p.id, emoji);
    setOcupado(null);
    if (r.estado === 401) return navegar('/entrar?volver=/galeria');
    if (!r.ok) return setError((r.datos && r.datos.error) || t('error_red'));
    actualizar(r.datos);
  };

  return (
    <>
      <Cabecera />

      {/* Franja: título de la galería sobre una rejilla de puntos reactiva (React Bits DotGrid) */}
      <section className="relative overflow-hidden bg-superficie">
        <div className="absolute inset-0 opacity-70" aria-hidden="true">
          <DotGrid dotSize={3} gap={22} baseColor="#26224F" activeColor="#70FBB7" proximity={150} shockRadius={260} shockStrength={4} glow={0.6} />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(10,10,31,0.96)_0%,rgba(10,10,31,0.8)_45%,rgba(10,10,31,0.2)_100%)]" aria-hidden="true" />
        <AnimatedContent trigger="mount" className="contenedor relative flex min-h-[46vh] flex-col justify-end gap-3 pt-14 pb-12 max-md:min-h-0" distance={16} duration={0.55} stagger={0.08}>
          <h1 className="text-display leading-[0.92] tracking-[0.03em] uppercase text-texto/90">{t('galeria_titulo')}</h1>
          <p className="max-w-[640px] text-entradilla text-texto">{t('galeria_texto')}</p>
        </AnimatedContent>
      </section>

      <main className="contenedor">
        <div className="flex flex-wrap items-center justify-between gap-4 pt-7 pb-2">
          <div className="flex flex-wrap gap-2" role="group" aria-label={t('filtrar_ciclo')}>
            {[{ codigo: '', nombre: t('todos') }, ...ciclos].map(c => (
              <button key={c.codigo} type="button" aria-pressed={filtro === c.codigo}
                onClick={() => poner('ciclo', c.codigo)}
                className={`pulsable min-h-10 rounded-full border px-4 py-2 text-cuerpo font-semibold ${filtro === c.codigo ? 'border-indigo bg-indigo text-blanco' : 'border-borde-claro bg-transparent text-texto hover:border-texto-3 hover:text-texto'}`}>
                {c.nombre} · {cuenta(c.codigo)}
              </button>
            ))}
            {etiqueta && (
              <button type="button" aria-label={t('quitar_etiqueta', { e: etiqueta })} onClick={() => poner('etiqueta', '')}
                className="pulsable inline-flex min-h-10 items-center gap-2 rounded-full border border-indigo bg-indigo px-4 py-2 text-cuerpo font-semibold text-blanco">
                {t('etiqueta_activa', { e: etiqueta })}<span aria-hidden="true">×</span>
              </button>
            )}
          </div>
          <label className="flex min-h-11 w-80 max-w-full items-center gap-2.5 rounded-[10px] border border-borde-claro bg-superficie px-3.5 text-texto-3">
            <Icono nombre="lupa" tam={18} />
            <span className="sr-only">{t('buscar')}</span>
            <input type="search" value={consulta} onChange={e => setConsulta(e.target.value)} placeholder={t('buscar_corto')}
              className="min-w-0 flex-1 border-0 bg-transparent text-texto outline-0 placeholder:text-texto-4" />
          </label>
        </div>

        {error && <p role="alert" className="mt-3 flex items-center gap-2 rounded-[10px] border border-error/35 bg-error/12 px-3.5 py-3 text-pequeno text-error"><Icono nombre="alerta" tam={18} grosor={2} />{error}</p>}

        <div className="pt-4 pb-12">
          {estado === 'cargando' && <div className="vacio">{t('cargando')}</div>}
          {estado === 'error' && <div className="vacio">{t('error_carga')}</div>}
          {estado === 'ok' && visibles.length === 0 && <div className="vacio">{lista.length ? t('sin_resultados') : t('sin_proyectos')}</div>}
          {estado === 'ok' && visibles.length > 0 && (
            <AnimatedContent key={`${filtro}|${etiqueta}`} className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6" distance={14} duration={0.5} stagger={0.06} threshold={0.05}>
              {visibles.map(p => <TarjetaProyecto key={p.id} p={p} usuario={usuario} ocupado={ocupado === p.id} onReaccion={emoji => onReaccion(p, emoji)}
                etiqueta={etiqueta} onEtiqueta={e => poner('etiqueta', e === etiqueta ? '' : e)} />)}
            </AnimatedContent>
          )}
        </div>
      </main>

      <Llamada variante="borde" />
      <Pie derecha="repo" />
    </>
  );
}
