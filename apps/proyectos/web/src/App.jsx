import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { IdiomaProvider, useIdioma } from './i18n.jsx';
import { SesionProvider } from './sesion.jsx';
import { BASE } from './api.js';
import Portada from './paginas/Portada.jsx';
import Galeria from './paginas/Galeria.jsx';
import Entrar from './paginas/Entrar.jsx';
import Cabecera from './componentes/Cabecera.jsx';
import Pie from './componentes/Pie.jsx';
import Boton from './componentes/Boton.jsx';
import { GUIA } from './componentes/Llamada.jsx';

// Al cambiar de página sube arriba; con #ancla (p. ej. /#publicar desde la galería) baja hasta ella
function Desplazamiento() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    // Sin return del valor: lo que devuelve el efecto React lo toma como función de limpieza y, si no lo es,
    // revienta al cambiar de página (scrollTo devuelve undefined en jsdom, pero no siempre en el navegador).
    if (!hash) { window.scrollTo(0, 0); return; }
    const el = document.getElementById(hash.slice(1));
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth' });
    // La lista de proyectos llega después y empuja el ancla hacia abajo (se notaba en móvil): mientras cambie la
    // altura de la página, durante dos segundos, se vuelve a colocar.
    const observador = new ResizeObserver(() => el.scrollIntoView({ behavior: 'smooth' }));
    observador.observe(document.body);
    const fin = setTimeout(() => observador.disconnect(), 2000);
    return () => { clearTimeout(fin); observador.disconnect(); };
  }, [pathname, hash]);
  return null;
}

function NoEncontrada() {
  const { t } = useIdioma();
  // Doble uso (D-29): avisa del error y, como suele ser un proyecto que aún no está, invita a publicarlo
  return (
    <>
      <Cabecera />
      <main className="contenedor flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <h1 className="text-display">404</h1>
        <p className="text-texto-2">{t('no_encontrada')}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Boton variante="menta" href={GUIA} externo>{t('guia')}</Boton>
          <Boton variante="borde" to="/">{t('ir_portada')}</Boton>
        </div>
      </main>
      <Pie />
    </>
  );
}

export default function App() {
  return (
    <IdiomaProvider>
      <SesionProvider>
        <BrowserRouter basename={BASE.replace(/\/$/, '')}>
          <Desplazamiento />
          <Routes>
            <Route path="/" element={<Portada />} />
            <Route path="/galeria" element={<Galeria />} />
            <Route path="/entrar" element={<Entrar />} />
            {/* rutas de la versión anterior de la web */}
            <Route path="/index.html" element={<Navigate to="/" replace />} />
            <Route path="/proyectos.html" element={<Navigate to="/galeria" replace />} />
            <Route path="/login.html" element={<Navigate to="/entrar" replace />} />
            <Route path="*" element={<NoEncontrada />} />
          </Routes>
        </BrowserRouter>
      </SesionProvider>
    </IdiomaProvider>
  );
}
