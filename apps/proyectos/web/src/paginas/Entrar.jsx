import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Orb from '../reactbits/Orb.jsx';
import { useIdioma } from '../i18n.jsx';
import { useSesion } from '../sesion.jsx';
import { volverSegura } from '../datos.js';
import Cabecera from '../componentes/Cabecera.jsx';
import Pie from '../componentes/Pie.jsx';
import Boton from '../componentes/Boton.jsx';
import Icono from '../componentes/Icono.jsx';

export default function Entrar() {
  const { t } = useIdioma();
  const { usuario, cargando, entrar } = useSesion();
  const [parametros] = useSearchParams();
  const volver = volverSegura(parametros.get('volver'));
  const navegar = useNavigate();
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  // con sesión ya iniciada no hay nada que hacer aquí
  useEffect(() => { if (!cargando && usuario) navegar(volver, { replace: true }); }, [cargando, usuario, volver, navegar]);

  const enviar = async ev => {
    ev.preventDefault();
    const form = ev.currentTarget;
    setError(''); setEnviando(true);
    const r = await entrar(form.elements.namedItem('usuario').value, form.elements.namedItem('contrasena').value);
    setEnviando(false);
    if (r.ok) return navegar(volver, { replace: true });
    setError(r.estado === 429 ? t('demasiados') : r.estado === 0 ? t('error_red') : t('error_login'));
  };

  return (
    <>
      <Cabecera sencilla />
      <main className="relative flex min-h-[calc(100vh-80px)] items-center justify-center overflow-hidden px-6 py-12">
        {/* Orbe de React Bits detrás del texto, con la paleta del centro */}
        <div className="pointer-events-none absolute top-1/2 left-[max(-120px,calc(50%-760px))] size-[560px] -translate-y-1/2 opacity-80 max-md:hidden" aria-hidden="true">
          <Orb colors={['#6331FB', '#88F9C0', '#150C4A']} backgroundColor="#01010D" glow={0.9} hoverIntensity={0.6} />
        </div>

        <div className="relative flex w-full max-w-[1040px] flex-wrap items-center justify-center gap-12">
          <div className="flex max-w-[460px] flex-[1_1_360px] flex-col gap-4">
            <span className="insignia self-start border-menta bg-menta text-onice">{t('solo_centro')}</span>
            <h1 className="text-[clamp(30px,4vw,40px)]">{t('sesion_titulo')}</h1>
            <p className="text-[17px] text-texto-2">{t('sesion_texto')}</p>
            <ul className="flex flex-col gap-2.5 text-texto-2">
              {['sesion_p1', 'sesion_p2', 'sesion_p3'].map(k => (
                <li key={k} className="flex items-start gap-2.5"><Icono nombre="check" tam={20} grosor={2.2} className="mt-[3px] text-menta" /><span>{t(k)}</span></li>
              ))}
            </ul>
          </div>

          <form onSubmit={enviar} autoComplete="on" className="flex w-full flex-[0_1_420px] flex-col gap-[18px] rounded-2xl border border-borde-2 bg-superficie p-8">
            <h2 className="text-[22px]">{t('entrar')}</h2>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="usuario" className="text-[13px] font-semibold text-texto-2">{t('usuario')}</label>
              <input id="usuario" name="usuario" type="text" autoComplete="username" required autoCapitalize="none" spellCheck="false" placeholder="ane.garcia"
                className="min-h-[46px] rounded-[10px] border border-borde-claro bg-onice px-3.5 py-2.5 text-texto focus:border-menta" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="contrasena" className="text-[13px] font-semibold text-texto-2">{t('contrasena')}</label>
              <input id="contrasena" name="contrasena" type="password" autoComplete="current-password" required
                className="min-h-[46px] rounded-[10px] border border-borde-claro bg-onice px-3.5 py-2.5 text-texto focus:border-menta" />
            </div>
            {error && (
              <div role="alert" className="flex items-start gap-2.5 rounded-[10px] border border-error/35 bg-error/12 px-3.5 py-3 text-[13px] text-error">
                <Icono nombre="alerta" tam={18} grosor={2} /><span>{error}</span>
              </div>
            )}
            <Boton variante="menta" type="submit" disabled={enviando} className="min-h-12 disabled:opacity-60">{enviando ? t('entrando') : t('entrar_boton')}</Boton>
            <p className="text-center text-[13px] text-texto-3">{t('olvido')}</p>
          </form>
        </div>
      </main>
      <Pie />
    </>
  );
}
