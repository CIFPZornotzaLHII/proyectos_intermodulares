FROM node:24-alpine
WORKDIR /app
COPY server.js package.json ./
ENV DATOS=/datos PROYECTOS=/proyectos PUERTO=3000
VOLUME ["/datos", "/proyectos"]
EXPOSE 3000
CMD ["node", "server.js"]
