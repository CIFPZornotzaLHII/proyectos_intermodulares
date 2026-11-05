import { useEffect } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { IdiomaProvider, useIdioma } from './i18n.jsx';
import { SesionProvider } from './sesion.jsx';
import { BASE } from './api.js';
import Portada from './paginas/Portada.jsx';
import Galeria from './paginas/Galeria.jsx';
import Entrar from './paginas/Entrar.jsx';

// Al cambiar de página sube arriba; con #ancla (p. ej. /#publicar desde la galería) baja hasta ella
function Desplazamiento() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) return window.scrollTo(0, 0);
    const el = document.getElementById(hash.slice(1));
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, [pathname, hash]);
  return null;
}

function NoEncontrada() {
  const { t } = useIdioma();
  return (
    <main className="contenedor flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-[40px]">404</h1>
      <p className="text-texto-2">{t('no_encontrada')}</p>
      <Link to="/" className="font-semibold">{t('ir_portada')}</Link>
    </main>
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
