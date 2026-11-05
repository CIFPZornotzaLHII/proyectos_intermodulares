// Sesión del usuario (cookie firmada por la API). Se consulta una vez al cargar la web y se comparte con todas las páginas.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { cargarSesion, cerrarSesion, iniciarSesion } from './api.js';

const SesionContexto = createContext({ usuario: null, cargando: true, entrar: async () => ({ ok: false }), salir: async () => {} });

export function SesionProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let vivo = true;
    cargarSesion().then(r => { if (vivo) { setUsuario(r.ok ? r.datos : null); setCargando(false); } });
    return () => { vivo = false; };
  }, []);

  const entrar = useCallback(async (login, contrasena) => {
    const r = await iniciarSesion(login, contrasena);
    if (r.ok) setUsuario(r.datos);
    return r;
  }, []);
  const salir = useCallback(async () => { await cerrarSesion(); setUsuario(null); }, []);

  const valor = useMemo(() => ({ usuario, cargando, entrar, salir }), [usuario, cargando, entrar, salir]);
  return <SesionContexto.Provider value={valor}>{children}</SesionContexto.Provider>;
}

export const useSesion = () => useContext(SesionContexto);
