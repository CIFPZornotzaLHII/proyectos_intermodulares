import { Link } from 'react-router-dom';

// Un solo botón principal (menta) por bloque; el resto, con borde. `to` = ruta de la web, `href` = enlace externo o landing.
// Píldoras (D-17): el radio completo es el de la referencia y el de los chips y reacciones.
const VARIANTES = {
  menta: 'bg-menta text-onice border-transparent hover:bg-menta-clara',
  borde: 'bg-transparent text-texto border-borde-claro hover:border-texto-3',
  claro: 'bg-transparent text-blanco border-blanco/60 hover:border-blanco',   // sobre el índigo de la portada
  pendiente: 'bg-transparent text-texto border-borde-claro border-dashed opacity-60 cursor-default',
};
const TAMANOS = {
  normal: 'min-h-[46px] px-[22px] py-[11px] text-cuerpo rounded-full',
  pequeno: 'min-h-[40px] px-[16px] py-2 text-cuerpo rounded-full',
};

export default function Boton({ variante = 'borde', tamano = 'normal', to, href, externo, className = '', children, ...resto }) {
  const clases = `inline-flex items-center justify-center gap-2 border font-bold no-underline transition-[transform,background-color,border-color] duration-150 active:translate-y-px ${VARIANTES[variante]} ${TAMANOS[tamano]} ${className}`;
  if (to) return <Link to={to} className={clases} {...resto}>{children}</Link>;
  if (href) return <a href={href} className={clases} {...(externo ? { target: '_blank', rel: 'noopener' } : {})} {...resto}>{children}</a>;
  if (variante === 'pendiente') return <span className={clases} {...resto}>{children}</span>;
  return <button type="button" className={clases} {...resto}>{children}</button>;
}
