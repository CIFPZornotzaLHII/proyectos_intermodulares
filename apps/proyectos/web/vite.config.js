import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// La web vive bajo /proyectos/ (lo decide proxy/nginx.conf). Si algún día cambia esa ruta, cámbiala aquí
// y vuelve a construir: Vite la usa para los enlaces de los ficheros compilados y el router para las rutas.
export const BASE = '/proyectos/';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const CARPETA_PROYECTOS = path.resolve(aqui, '../../../proyectos');
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.gif': 'image/gif', '.ico': 'image/x-icon', '.pdf': 'application/pdf', '.txt': 'text/plain; charset=utf-8',
};

// Solo en desarrollo: sirve las landings del alumnado (proyectos/<ciclo>/<slug>/) en /proyectos/p/ tal como
// hará nginx en producción. Las mismas reglas: ni proyecto.json ni ficheros ocultos.
function landingsEnDesarrollo() {
  return {
    name: 'landings-en-desarrollo',
    configureServer(servidor) {
      servidor.middlewares.use((req, res, siguiente) => {
        const url = new URL(req.url, 'http://x');
        if (!url.pathname.startsWith(`${BASE}p/`)) return siguiente();
        const relativa = decodeURIComponent(url.pathname.slice(`${BASE}p/`.length));
        if (relativa.split('/').some(parte => parte.startsWith('.') || parte === 'proyecto.json' || parte === '..')) { res.statusCode = 404; return res.end('404'); }
        let fichero = path.join(CARPETA_PROYECTOS, relativa);
        if (!fichero.startsWith(CARPETA_PROYECTOS)) { res.statusCode = 404; return res.end('404'); }
        if (fs.existsSync(fichero) && fs.statSync(fichero).isDirectory()) {
          if (!url.pathname.endsWith('/')) { res.statusCode = 301; res.setHeader('Location', `${url.pathname}/`); return res.end(); }
          fichero = path.join(fichero, 'index.html');
        }
        if (!fs.existsSync(fichero)) { res.statusCode = 404; return res.end('404'); }
        res.setHeader('Content-Type', TIPOS[path.extname(fichero).toLowerCase()] || 'application/octet-stream');
        res.setHeader('Cache-Control', 'no-cache');
        fs.createReadStream(fichero).pipe(res);
      });
    },
  };
}

export default defineConfig({
  base: BASE,
  plugins: [react(), tailwindcss(), landingsEnDesarrollo()],
  server: {
    // En desarrollo la API corre aparte (node apps/proyectos/api/server.js en el 3000); aquí se le pasa /proyectos/api/
    proxy: { [`${BASE}api`]: { target: 'http://localhost:3000', rewrite: ruta => ruta.replace(/^\/proyectos/, '') } },
  },
  build: { outDir: 'dist', sourcemap: false },
  test: {
    environment: 'jsdom',
    setupFiles: './test/setup.js',
    css: false,
  },
});
