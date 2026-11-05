// Iconos de trazo (24×24), los mismos de la versión anterior de la web
const TRAZOS = {
  pulgar: <path d="M7 11v9H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3Zm0 0 4-7a2 2 0 0 1 2 2v3h5a2 2 0 0 1 2 2.3l-1 6A2 2 0 0 1 17 20H7" />,
  bombilla: <path d="M9 18h6M10 21h4M12 3a6 6 0 0 1 3.5 10.9c-.5.4-.8 1-.8 1.6V16H9.3v-.5c0-.6-.3-1.2-.8-1.6A6 6 0 0 1 12 3Z" />,
  cohete: <><path d="M5 15c-1.5 1.5-2 5-2 5s3.5-.5 5-2M12 15 9 12c1.5-5 5-8 11-9-1 6-4 9.5-9 11Z" /><circle cx="15" cy="9" r="1.2" /></>,
  llama: <path d="M12 22c4 0 7-3 7-7 0-3-2-5-3-6.5-.5 2-1.5 3-2.5 3.5.5-3-.5-6-3.5-9 .5 3-1 5-3 7S4 13 5 15c.7 4 3 7 7 7Z" />,
  corazon: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />,
  play: <path d="M7 5v14l11-7-11-7Z" />,
  codigo: <path d="m8 8-5 4 5 4M16 8l5 4-5 4M14 4l-4 16" />,
  flecha: <path d="M5 12h14M13 6l6 6-6 6" />,
  atras: <path d="M19 12H5M11 18l-6-6 6-6" />,
  abajo: <path d="M12 5v14M6 13l6 6 6-6" />,
  usuario: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></>,
  lupa: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  check: <path d="m5 12 5 5L20 7" />,
  alerta: <><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></>,
  barajar: <path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />,
};

export default function Icono({ nombre, tam = 16, grosor = 1.8, className = '' }) {
  return (
    <svg width={tam} height={tam} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={grosor} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`shrink-0 ${className}`}>
      {TRAZOS[nombre]}
    </svg>
  );
}
