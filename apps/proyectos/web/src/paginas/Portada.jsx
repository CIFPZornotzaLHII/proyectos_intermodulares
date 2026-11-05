import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import CountUp from '../reactbits/CountUp.jsx';
import AnimatedContent from '../reactbits/AnimatedContent.jsx';
import Noise from '../reactbits/Noise.jsx';
import Magnet from '../reactbits/Magnet.jsx';
import { useIdioma } from '../i18n.jsx';
import { ruta } from '../api.js';
import useProyectos from '../useProyectos.js';
import { alAzar, ordenarPorVotos, totalReacciones } from '../datos.js';
import Cabecera from '../componentes/Cabecera.jsx';
import Pie from '../componentes/Pie.jsx';
import Llamada from '../componentes/Llamada.jsx';
import Boton from '../componentes/Boton.jsx';
import Icono from '../componentes/Icono.jsx';
import { Destacado, TarjetaProyecto } from '../componentes/Tarjeta.jsx';

// Lo que se pide a cada grupo, en la columna derecha de la portada (textos en i18n.jsx)
const LISTA_HERO = ['hero_1', 'hero_2', 'hero_3', 'hero_4'];

export default function Portada() {
  const { t } = useIdioma();
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

      {/* Portada (D-17): un campo plano de índigo eléctrico, como la referencia de Mikel. El título va partido a los dos
          lados de la foto del proyecto destacado, teñida de índigo con mix-blend (cambia en cada visita); una palabra
          en serif itálica por línea; la menta solo en la acción principal. Sin animación de fondo ni degradado. */}
      {/* El héroe sube hasta debajo de la cabecera transparente (md:-mt-20) y deja su hueco con padding */}
      <section className="relative -mt-20 overflow-hidden bg-indigo pt-20 text-blanco max-md:mt-0 max-md:pt-0">
        {/* Dos degradados de ónice desde abajo, para que el campo índigo no quede plano (petición de Mikel, D-17). El vertical
            va en curva (arranca despacio, acelera en el centro) y acaba en ónice opaco: así el héroe se funde con el fondo. */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_36%,rgba(1,1,13,0.08)_50%,rgba(1,1,13,0.3)_62%,rgba(1,1,13,0.62)_74%,rgba(1,1,13,0.88)_86%,rgba(1,1,13,1)_100%)]" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_8%_100%,rgba(1,1,13,0.7)_0%,transparent_70%)]" aria-hidden="true" />
        {/* Grano de película (React Bits Noise) sobre el índigo: textura, sin cambiar el color; quieto con reduced-motion */}
        <Noise opacity={0.14} size={1.5} fps={12} contrast={0.5} blendMode="soft-light" />

        <div className="contenedor relative flex min-h-[calc(100vh-80px)] flex-col justify-center gap-12 py-12 max-md:min-h-0 max-md:gap-8 max-md:py-10">
          <h1 className="sr-only">{t('portada_titulo')}</h1>

          {/* Título a dos columnas; la mascota (img/patata.png, recorte con fondo transparente) va detrás, posicionada
              respecto al contenedor del héroe: ocupa todo su alto, con la cola bajo la cabecera y las patas en el borde
              inferior, por detrás de las cifras. Las letras pisan sus bordes como en la referencia. En móvil va entre los
              dos bloques del título. */}
          <div aria-hidden="true" className="grid items-center gap-y-5 md:min-h-[58vh] md:grid-cols-2">
            <div className="pointer-events-none order-2 flex justify-center animate-aparecer [animation-delay:150ms] md:absolute md:inset-x-0 md:top-10 md:-bottom-10 md:order-none">
              {/* React Bits Magnet: la mascota se desplaza unos píxeles hacia el cursor, sin inclinarla (nada en táctil ni con reduced-motion).
                  Alto en cadena (envoltorio, interior, imagen) y max-w-none: con la altura fijada, el max-width: 100% del
                  preflight de Tailwind la aplastaba en horizontal cuando la caja de Magnet era más estrecha que la imagen. */}
              <Magnet padding={240} magnetStrength={10} maxOffset={28} wrapperClassName="md:h-full" innerClassName="md:h-full">
                <img src={ruta('img/patata.png')} alt="" width="1122" height="1402"
                  className="mx-auto block h-auto w-[min(70vw,300px)] md:h-full md:w-auto md:max-w-none md:mask-b-from-80%" />
              </Magnet>
            </div>
            <div className="relative z-[1] order-1 flex min-w-0 flex-col animate-aparecer md:order-none">
              <span className="font-titulo text-[clamp(64px,9.5vw,150px)] leading-[0.9] tracking-[0.03em] uppercase text-texto/90">{t('portada_titulo_1')}</span>
              <span className="font-serif italic text-[clamp(40px,5vw,84px)] leading-[0.95] text-texto/90">{t('portada_titulo_2')}</span>
            </div>
            <div className="relative z-[1] order-3 flex min-w-0 flex-col animate-aparecer [animation-delay:300ms] md:order-none md:items-end md:text-right">
              <span className="font-titulo text-[clamp(64px,9.5vw,150px)] leading-[0.9] tracking-[0.03em] text-texto/90">{t('portada_titulo_3')}</span>
              <span className="font-serif italic text-[clamp(40px,5vw,84px)] leading-[0.95] text-texto/90">{t('portada_titulo_4')}</span>
            </div>
          </div>

          <div className="grid items-end gap-8 md:grid-cols-[1fr_minmax(160px,1fr)_1fr]">
            <div className="flex max-w-[460px] flex-col gap-5 animate-aparecer [animation-delay:300ms]">
              <p className="text-[18px] leading-[1.5] text-blanco/85">{t('portada_entradilla')}</p>
              <div className="flex flex-wrap gap-3">
                <Boton variante="menta" to="/galeria">{t('ver_todos')}<Icono nombre="flecha" tam={18} grosor={2.2} /></Boton>
                <Boton variante="claro" href="#destacado">{t('ir_destacado')}<Icono nombre="abajo" tam={18} grosor={2.2} /></Boton>
              </div>
            </div>
            <div className="max-md:hidden" />
            <ul className="flex flex-col text-[12px] font-semibold uppercase tracking-[0.1em] text-blanco/85 animate-aparecer [animation-delay:450ms] md:text-right">
              {LISTA_HERO.map(k => <li key={k} className="border-b border-blanco/30 py-2.5 last:border-b-0">{t(k)}</li>)}
            </ul>
          </div>

          {/* Las cifras cierran la portada como la fila de logos de la referencia; 'relative' para quedar sobre las patas */}
          <dl className="flex flex-wrap items-baseline justify-center gap-x-12 gap-y-3 relative border-t border-blanco/30 pt-6 animate-aparecer [animation-delay:450ms]">
            {cifras.map(c => (
              <div key={c.clave} className="flex items-baseline gap-2.5">
                <dt className="order-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-blanco/80">{t(c.clave)}</dt>
                <dd className={`order-1 font-titulo text-[36px] leading-none ${c.menta ? 'text-menta' : ''}`}>
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
