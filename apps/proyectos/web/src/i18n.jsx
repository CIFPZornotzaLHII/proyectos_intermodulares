// Textos de la web en castellano y euskera. El idioma se guarda en localStorage (pi_idioma) y cambia sin recargar.
// EU: traducción pendiente de revisión por un hablante.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export const TEXTOS = {
  es: {
    marca: 'Proyectos intermodulares', marca_sub: 'Curso 2026-27', nav_proyectos: 'Proyectos', nav_publicar: 'Cómo publicar',
    entrar: 'Iniciar sesión', salir: 'Salir',
    portada_etiqueta: 'CIFP Zornotza LHII · Curso 2026-27', portada_titulo: 'Proyectos intermodulares 26-27',
    portada_entradilla: 'Los proyectos intermodulares de SMR, DAW y DAM: una necesidad real, un plan, un producto que funciona y una defensa de cinco minutos.',
    ver_todos: 'Ver todos los proyectos', ir_destacado: 'Descubre los proyectos',
    portada_titulo_1: 'Proyectos', portada_titulo_2: 'intermodulares', portada_titulo_3: '26·27', portada_titulo_4: 'Zornotza LHII',
    hero_1: 'Una landing por proyecto', hero_2: 'Un vídeo de cinco minutos', hero_3: 'Un MVP funcionando en grado superior', hero_4: 'Las reacciones del alumnado deciden la portada',
    cifra_proyectos: 'Proyectos', cifra_ciclos: 'Ciclos', cifra_alumnos: 'Alumnos', cifra_reacciones: 'Reacciones',
    destacado_etiqueta: 'Entre los diez más votados', destacado_titulo: 'Proyecto destacado',
    destacados_etiqueta: 'Lo que más está gustando', destacados_titulo: 'Tendencias', ver_los_n: 'Ver los {n} proyectos',
    ver_proyecto: 'Ver proyecto', video: 'Vídeo', video_5: 'Vídeo · 5 min', video_pendiente: 'Vídeo pendiente', codigo: 'Código', mas_opciones: 'Más opciones',
    reacciones_total: '{n} reacciones en total', reacciones_total_texto: 'reacciones en total', reacciones_n: '{n} reacciones',
    llamada_titulo: '¿No has publicado todavía tu proyecto?',
    llamada_texto: 'Haz un fork de <code>proyectos_intermodulares</code>, copia la plantilla a tu carpeta y abre una pull request. La comprobación automática te dice qué falta; al aceptarla, tu tarjeta aparece aquí.',
    guia: 'Guía para publicar', pie: 'CIFP Zornotza LHII · Proyecto intermodular · SMR, DAW y DAM',
    galeria_titulo: 'Todos los proyectos',
    galeria_texto: 'Cada grupo presenta su proyecto intermodular: una landing, un vídeo de 5 minutos y, en grado superior, un MVP funcionando. Inicia sesión para reaccionar a los proyectos de los demás grupos.',
    todos: 'Todos', filtrar_ciclo: 'Filtrar por ciclo', buscar: 'Buscar por título, equipo o etiqueta', buscar_corto: 'Buscar',
    sin_proyectos: 'Aún no hay proyectos publicados.', sin_resultados: 'Ningún proyecto coincide con la búsqueda.',
    inicia_para_reaccionar: 'Inicia sesión para reaccionar', es_tu_proyecto: 'Es tu proyecto', grado_medio: 'Grado medio', grado_superior: 'Grado superior',
    r_megusta: 'Me gusta', r_idea: 'Buena idea', r_cohete: 'Ambicioso', r_fuego: 'Fuego', r_corazon: 'Me encanta',
    sesion_titulo: 'Entra para reaccionar a los proyectos', sesion_texto: 'Ver los proyectos es libre. Para dejar tu reacción en los de otros grupos necesitas tu cuenta del centro.',
    sesion_p1: 'Las cuentas las crea el profesorado: tu usuario y tu contraseña inicial te los da tu tutor o tutora.', sesion_p2: 'No puedes reaccionar a tu propio proyecto.', sesion_p3: 'La sesión dura 30 días en este navegador.',
    usuario: 'Usuario', contrasena: 'Contraseña', entrar_boton: 'Entrar', entrando: 'Entrando…', olvido: '¿Has olvidado la contraseña? Pide una nueva a tu tutor o tutora.',
    error_login: 'Usuario o contraseña incorrectos.', error_red: 'No se ha podido conectar con el servidor.', demasiados: 'Demasiados intentos. Espera unos minutos.',
    volver_proyectos: 'Volver a los proyectos', solo_centro: 'Solo alumnado y profesorado', logo_alt: 'CIFP Zornotza LHII', idioma: 'Idioma',
    otro_destacado: 'Enséñame otro', cargando: 'Cargando proyectos…', error_carga: 'No se han podido cargar los proyectos. Vuelve a intentarlo en un momento.',
    sin_proyectos_portada: 'Aún no hay proyectos publicados. El primero que llegue por pull request se lleva esta portada.',
    no_encontrada: 'Esta página no existe.', ir_portada: 'Ir a la portada',
  },
  eu: {
    marca: 'Proiektu intermodularrak', marca_sub: '2026-27 ikasturtea', nav_proyectos: 'Proiektuak', nav_publicar: 'Nola argitaratu',
    entrar: 'Saioa hasi', salir: 'Irten',
    portada_etiqueta: 'CIFP Zornotza LHII · 2026-27 ikasturtea', portada_titulo: 'Proiektu intermodularrak 26-27',
    portada_entradilla: 'SMR, DAW eta DAM zikloetako proiektu intermodularrak: behar erreal bat, plan bat, funtzionatzen duen produktu bat eta bost minutuko defentsa.',
    ver_todos: 'Proiektu guztiak ikusi', ir_destacado: 'Ezagutu proiektuak',
    portada_titulo_1: 'Proiektu', portada_titulo_2: 'intermodularrak', portada_titulo_3: '26·27', portada_titulo_4: 'Zornotza LHII',
    hero_1: 'Landing bat proiektu bakoitzeko', hero_2: 'Bost minutuko bideo bat', hero_3: 'MVP bat martxan goi mailan', hero_4: 'Ikasleen erreakzioek erabakitzen dute azala',
    cifra_proyectos: 'Proiektuak', cifra_ciclos: 'Zikloak', cifra_alumnos: 'Ikasleak', cifra_reacciones: 'Erreakzioak',
    destacado_etiqueta: 'Bozkatuenen hamarren artean', destacado_titulo: 'Proiektu nabarmendua',
    destacados_etiqueta: 'Gehien gustatzen ari dena', destacados_titulo: 'Joerak', ver_los_n: '{n} proiektuak ikusi',
    ver_proyecto: 'Proiektua ikusi', video: 'Bideoa', video_5: 'Bideoa · 5 min', video_pendiente: 'Bideoa falta da', codigo: 'Kodea', mas_opciones: 'Aukera gehiago',
    reacciones_total: '{n} erreakzio guztira', reacciones_total_texto: 'erreakzio guztira', reacciones_n: '{n} erreakzio',
    llamada_titulo: 'Oraindik ez duzu zure proiektua argitaratu?',
    llamada_texto: 'Egin <code>proyectos_intermodulares</code> biltegiaren fork bat, kopiatu txantiloia zuen karpetara eta ireki pull request bat. Egiaztapen automatikoak zer falta den esango dizue; onartzean, zuen txartela hemen agertuko da.',
    guia: 'Argitaratzeko gida', pie: 'CIFP Zornotza LHII · Proiektu intermodularra · SMR, DAW eta DAM',
    galeria_titulo: 'Proiektu guztiak',
    galeria_texto: 'Talde bakoitzak bere proiektu intermodularra aurkezten du: landing bat, 5 minutuko bideo bat eta, goi mailan, funtzionatzen duen MVP bat. Hasi saioa beste taldeen proiektuei erreakzionatzeko.',
    todos: 'Guztiak', filtrar_ciclo: 'Zikloka filtratu', buscar: 'Bilatu izenburuz, taldez edo etiketaz', buscar_corto: 'Bilatu',
    sin_proyectos: 'Oraindik ez dago proiekturik argitaratuta.', sin_resultados: 'Ez dago bilaketarekin bat datorren proiekturik.',
    inicia_para_reaccionar: 'Hasi saioa erreakzionatzeko', es_tu_proyecto: 'Zure proiektua da', grado_medio: 'Erdi maila', grado_superior: 'Goi maila',
    r_megusta: 'Gustatzen zait', r_idea: 'Ideia ona', r_cohete: 'Handinahia', r_fuego: 'Sua', r_corazon: 'Izugarri gustatzen zait',
    sesion_titulo: 'Sartu proiektuei erreakzionatzeko', sesion_texto: 'Proiektuak ikustea librea da. Beste taldeen proiektuei erreakzionatzeko ikastetxeko kontua behar duzu.',
    sesion_p1: 'Kontuak irakasleek sortzen dituzte: erabiltzailea eta hasierako pasahitza tutoreak emango dizkizu.', sesion_p2: 'Ezin diozu zure proiektuari erreakzionatu.', sesion_p3: 'Saioak 30 egun irauten du nabigatzaile honetan.',
    usuario: 'Erabiltzailea', contrasena: 'Pasahitza', entrar_boton: 'Sartu', entrando: 'Sartzen…', olvido: 'Pasahitza ahaztu duzu? Eskatu berri bat tutoreari.',
    error_login: 'Erabiltzailea edo pasahitza okerra.', error_red: 'Ezin izan da zerbitzariarekin konektatu.', demasiados: 'Saiakera gehiegi. Itxaron minutu batzuk.',
    volver_proyectos: 'Proiektuetara itzuli', solo_centro: 'Ikasle eta irakasleentzat bakarrik', logo_alt: 'CIFP Zornotza LHII', idioma: 'Hizkuntza',
    otro_destacado: 'Erakutsi beste bat', cargando: 'Proiektuak kargatzen…', error_carga: 'Ezin izan dira proiektuak kargatu. Saiatu berriro laster.',
    sin_proyectos_portada: 'Oraindik ez dago proiekturik argitaratuta. Pull request bidez iristen den lehenak eramango du azal hau.',
    no_encontrada: 'Orri hau ez da existitzen.', ir_portada: 'Azalera joan',
  },
};

const CLAVE_ALMACEN = 'pi_idioma';
const leerIdioma = () => { try { return localStorage.getItem(CLAVE_ALMACEN) === 'eu' ? 'eu' : 'es'; } catch { return 'es'; } };

export function traducir(idioma, clave, datos) {
  let s = (TEXTOS[idioma] && TEXTOS[idioma][clave]) || TEXTOS.es[clave] || clave;
  if (datos) for (const k of Object.keys(datos)) s = s.replace(`{${k}}`, datos[k]);
  return s;
}

const IdiomaContexto = createContext({ idioma: 'es', t: (clave, datos) => traducir('es', clave, datos), cambiarIdioma: () => {} });

export function IdiomaProvider({ children, inicial }) {
  const [idioma, setIdioma] = useState(inicial || leerIdioma);
  useEffect(() => { document.documentElement.lang = idioma; }, [idioma]);
  const cambiarIdioma = useCallback(nuevo => {
    const valor = nuevo === 'eu' ? 'eu' : 'es';
    try { localStorage.setItem(CLAVE_ALMACEN, valor); } catch { /* sin almacenamiento */ }
    setIdioma(valor);
  }, []);
  const valor = useMemo(() => ({ idioma, cambiarIdioma, t: (clave, datos) => traducir(idioma, clave, datos) }), [idioma, cambiarIdioma]);
  return <IdiomaContexto.Provider value={valor}>{children}</IdiomaContexto.Provider>;
}

export const useIdioma = () => useContext(IdiomaContexto);

// Para los pocos textos con <code>…</code>: los convierte en elementos sin usar innerHTML
export function conCodigo(texto) {
  return texto.split(/(<code>.*?<\/code>)/).map((trozo, i) => {
    const m = trozo.match(/^<code>(.*?)<\/code>$/);
    return m ? <code key={i} className="rounded-md bg-superficie-2 px-2 py-0.5 text-[14px]">{m[1]}</code> : trozo;
  });
}
