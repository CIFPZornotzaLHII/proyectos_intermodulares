import AnimatedContent from '../reactbits/AnimatedContent.jsx';
import { conCodigo, useIdioma } from '../i18n.jsx';
import Boton from './Boton.jsx';
import { REPO } from './Pie.jsx';

export const GUIA = `${REPO}/blob/main/proyectos/LEEME.md`;
export const FORK = `${REPO}/fork`;   // la página de GitHub que crea el fork

// "¿No has publicado todavía tu proyecto?" · cierre de la portada y de la galería
export default function Llamada({ variante = 'menta', className = '' }) {
  const { t } = useIdioma();
  return (
    <section id="publicar" className={`bg-superficie ${className}`}>
      <AnimatedContent className="contenedor flex flex-wrap items-center justify-between gap-8 py-14" distance={16} duration={0.55} stagger={0.08} threshold={0.05}>
        <div>
          <h2 className="text-titulo">{t('llamada_titulo')}</h2>
          {/* "Haz un fork…" enlaza a la página de fork de GitHub; el resto del texto, con su <code> */}
          <p className="mt-2.5 max-w-[640px] text-texto">
            {t('llamada_texto').split('{fork}').map((trozo, i) => i === 0 ? <span key={i}>{conCodigo(trozo)}</span> : (
              <span key={i}><a href={FORK} target="_blank" rel="noopener" className="font-semibold text-menta underline underline-offset-4 hover:text-menta-clara">{conCodigo(t('llamada_fork'))}</a>{conCodigo(trozo)}</span>
            ))}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Boton variante={variante} href={GUIA} externo>{t('guia')}</Boton>
        </div>
      </AnimatedContent>
    </section>
  );
}
