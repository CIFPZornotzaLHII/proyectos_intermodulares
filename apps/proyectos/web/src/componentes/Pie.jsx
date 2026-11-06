import { useIdioma } from '../i18n.jsx';

export const REPO = 'https://github.com/CIFPZornotzaLHII/proyectos_intermodulares';

// Pie común. `derecha`: 'coordenadas' (portada), 'repo' (galería) o nada (centrado, login)
export default function Pie({ derecha }) {
  const { t } = useIdioma();
  return (
    <footer className={`contenedor flex flex-wrap gap-3 pt-7 pb-9 text-pequeno text-texto-3 ${derecha ? 'justify-between' : 'justify-center'}`}>
      <span>{t('pie')}</span>
      {derecha === 'coordenadas' && <span className="font-mono">43°13′ N · 2°44′ W</span>}
      {derecha === 'repo' && <a href={REPO} target="_blank" rel="noopener" className="text-texto-3 hover:text-texto">github.com/CIFPZornotzaLHII/proyectos_intermodulares</a>}
    </footer>
  );
}
