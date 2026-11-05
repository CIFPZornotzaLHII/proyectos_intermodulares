import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import LiquidEther from '../reactbits/LiquidEther.jsx';
import BlurText from '../reactbits/BlurText.jsx';
import CountUp from '../reactbits/CountUp.jsx';
import AnimatedContent from '../reactbits/AnimatedContent.jsx';
import { useIdioma } from '../i18n.jsx';
import useProyectos from '../useProyectos.js';
import { alAzar, ordenarPorVotos, totalReacciones } from '../datos.js';
import Cabecera from '../componentes/Cabecera.jsx';
import Pie from '../componentes/Pie.jsx';
import Llamada from '../componentes/Llamada.jsx';
import Boton from '../componentes/Boton.jsx';
import Icono from '../componentes/Icono.jsx';
import { Destacado, TarjetaProyecto } from '../componentes/Tarjeta.jsx';

// Colores de la corriente de la portada: índigo eléctrico, menta tropical y un índigo profundo para dar fondo
const COLORES_CORRIENTE = ['#6331FB', '#88F9C0', '#2B1A8F'];

export default function Portada() {
  const { t, idioma } = useIdioma();
  const { lista, estado } = useProyectos();

  const porVotos = useMemo(() => ordenarPorVotos(lista), [lista]);
  const top = useMemo(() => porVotos.slice(0, 10), [porVotos]);
  const [destacado, setDestacado] = useState(null);
  // al llegar la lista, uno al azar entre los diez más votados; "Enséñame otro" cambia sin recargar
  useEffect(() => { setDestacado(alAzar(top)); }, [top]);
  const otro = () => setDestacado(alAzar(top.filter(p => p !== destacado)));
  const tendencias = porVotos.filter(p => p !== destacado).slice(0, 3);

  const cifras = [
    { clave: 'cifra_proyectos', valor: lista.length },
    { clave: 'cifra_alumnos', valor: lista.reduce((a, p) => a + (p.equipo || []).length, 0) },
    { clave: 'cifra_reacciones', valor: lista.reduce((a, p) => a + totalReacciones(p), 0), menta: true },
  ];

  return (
    <>
      <Cabecera />

      {/* Portada a pantalla completa: la "catedral". Detrás, la corriente líquida de React Bits con los colores del tema */}
      <section className="relative overflow-hidden border-b border-borde bg-[linear-gradient(135deg,#01010D_0%,#150C4A_45%,#6331FB_100%)]">
        <div className="absolute inset-0" aria-hidden="true">
          <LiquidEther colors={COLORES_CORRIENTE} mouseForce={18} cursorSize={110} resolution={0.5} autoDemo autoSpeed={0.45} autoIntensity={2} intro />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(1,1,13,0.88)_0%,rgba(1,1,13,0.62)_38%,rgba(1,1,13,0.08)_72%,rgba(1,1,13,0)_100%)] max-md:bg-[linear-gradient(180deg,rgba(1,1,13,0.7)_0%,rgba(1,1,13,0.82)_100%)]" aria-hidden="true" />

        <div className="contenedor relative flex min-h-[clamp(560px,86vh,820px)] flex-col justify-center gap-[26px] py-[72px] max-md:min-h-0 max-md:pt-14">
          <span className="etiqueta-mono animate-aparecer">{t('portada_etiqueta')}</span>
          <h1 className="sr-only">{t('portada_titulo')}</h1>
          <div aria-hidden="true" className="max-w-[820px]">
            <BlurText key={idioma} text={t('portada_titulo')} trigger="load" delay={110} animateBy="words" direction="top" stepDuration={0.4}
              className="font-titulo text-[clamp(40px,5.6vw,64px)] leading-[1.04] tracking-[0.01em]" />
          </div>
          <p className="max-w-[560px] text-[18px] text-texto-2 animate-aparecer [animation-delay:150ms]">{t('portada_entradilla')}</p>
          <div className="flex flex-wrap gap-3 animate-aparecer [animation-delay:300ms]">
            <Boton variante="menta" to="/galeria">{t('ver_todos')}<Icono nombre="flecha" tam={18} grosor={2.2} /></Boton>
            <Boton href="#destacado">{t('ir_destacado')}<Icono nombre="abajo" tam={18} grosor={2.2} /></Boton>
          </div>
          <dl className="mt-5 flex flex-wrap gap-10 animate-aparecer [animation-delay:300ms]">
            {cifras.map(c => (
              <div key={c.clave} className="flex flex-col gap-0.5">
                <dt className="text-[12px] uppercase tracking-[0.12em] text-texto-3">{t(c.clave)}</dt>
                <dd className={`font-titulo text-[34px] leading-none ${c.menta ? 'text-menta' : ''}`}>
                  {estado === 'ok' ? <CountUp to={c.valor} duration={1.4} separator="." /> : '—'}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Proyecto destacado: uno al azar entre los diez más votados */}
      <section id="destacado" className="contenedor flex flex-col gap-7 pt-24 pb-6 scroll-mt-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div className="flex flex-col gap-1.5">
            <span className="etiqueta-mono">{t('destacado_etiqueta')}</span>
            <h2 className="text-[clamp(26px,3vw,32px)]">{t('destacado_titulo')}</h2>
          </div>
          <span className="inline-flex items-center gap-3 text-[13px] text-texto-3">
            <span>{t('destacado_nota')}</span>
            {top.length > 1 && (
              <button type="button" onClick={otro} className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-borde-claro bg-transparent px-3 py-1.5 text-[13px] font-semibold text-texto hover:border-menta hover:text-menta">
                <Icono nombre="barajar" tam={14} grosor={2} />{t('otro_destacado')}
              </button>
            )}
          </span>
        </div>
        <div aria-live="polite">
          {estado === 'cargando' && <div className="vacio">{t('cargando')}</div>}
          {estado === 'error' && <div className="vacio">{t('error_carga')}</div>}
          {estado === 'ok' && !destacado && <div className="vacio">{t('sin_proyectos_portada')}</div>}
          {estado === 'ok' && destacado && (
            <AnimatedContent key={destacado.id} distance={18} duration={0.6} threshold={0.05}>
              <Destacado p={destacado} />
            </AnimatedContent>
          )}
        </div>
      </section>

      {/* Tendencias: los tres siguientes más votados */}
      {tendencias.length > 0 && (
        <section className="contenedor flex flex-col gap-7 pt-10 pb-16">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div className="flex flex-col gap-1.5">
              <span className="etiqueta-mono">{t('destacados_etiqueta')}</span>
              <h2 className="text-[clamp(26px,3vw,32px)]">{t('destacados_titulo')}</h2>
            </div>
            <Link to="/galeria" className="inline-flex min-h-[44px] items-center gap-2 text-[15px] font-semibold no-underline">
              {t('ver_los_n', { n: lista.length })}<Icono nombre="flecha" grosor={2.2} />
            </Link>
          </div>
          <AnimatedContent key={destacado && destacado.id} className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6" distance={16} duration={0.55} stagger={0.08} threshold={0.05}>
            {tendencias.map(p => <TarjetaProyecto key={p.id} p={p} modo="tendencia" />)}
          </AnimatedContent>
        </section>
      )}

      <Llamada className="mt-16" />
      <Pie derecha="coordenadas" />
    </>
  );
}
