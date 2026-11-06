import { conCodigo, useIdioma } from '../i18n.jsx';
import Boton from './Boton.jsx';
import { REPO } from './Pie.jsx';

export const GUIA = `${REPO}/blob/main/proyectos/LEEME.md`;

// "¿No has publicado todavía tu proyecto?" · cierre de la portada y de la galería
export default function Llamada({ variante = 'menta', className = '' }) {
  const { t } = useIdioma();
  return (
    <section id="publicar" className={`border-y border-borde bg-superficie ${className}`}>
      <div className="contenedor flex flex-wrap items-center justify-between gap-8 py-14">
        <div>
          <h2 className="text-titulo">{t('llamada_titulo')}</h2>
          <p className="mt-2.5 max-w-[640px] text-texto-2">{conCodigo(t('llamada_texto'))}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Boton variante={variante} href={GUIA} externo>{t('guia')}</Boton>
        </div>
      </div>
    </section>
  );
}
