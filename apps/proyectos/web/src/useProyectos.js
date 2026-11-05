import { useCallback, useEffect, useState } from 'react';
import { cargarProyectos } from './api.js';

// Carga la lista de proyectos de la API. estado: 'cargando' | 'ok' | 'error'
export default function useProyectos() {
  const [lista, setLista] = useState([]);
  const [ciclos, setCiclos] = useState([]);
  const [estado, setEstado] = useState('cargando');
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vivo = true;
    setEstado('cargando');
    cargarProyectos().then(r => {
      if (!vivo) return;
      if (r.ok) { setLista(r.datos.proyectos || []); setCiclos(r.datos.ciclos || []); setEstado('ok'); } else setEstado('error');
    });
    return () => { vivo = false; };
  }, [intento]);

  const recargar = useCallback(() => setIntento(n => n + 1), []);
  // sustituye un proyecto por su versión nueva (tras reaccionar)
  const actualizar = useCallback(nuevo => setLista(l => l.map(p => (p.id === nuevo.id ? nuevo : p))), []);

  return { lista, ciclos, estado, recargar, actualizar };
}
