# 1) Construye la web (Vite) · 2) la sirve nginx junto con las landings del alumnado y el paso a la API
FROM node:22-alpine AS construccion
WORKDIR /web
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY index.html vite.config.js ./
COPY public ./public
COPY src ./src
RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=construccion /web/dist /usr/share/nginx/html
# La carpeta proyectos/ del repo se monta en /proyectos (docker-compose.yml): las landings no van en la imagen
VOLUME ["/proyectos"]
