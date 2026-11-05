# Pruebas de extremo a extremo (Playwright + Chromium). Se construye y se lanza desde e2e/docker-compose.yml.
# La imagen oficial trae Node y los navegadores; aquí solo se instala @playwright/test (misma versión que la imagen).
FROM mcr.microsoft.com/playwright:v1.64.1-noble
WORKDIR /e2e
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
# tests/ y playwright.config.js se montan al lanzar (docker-compose.yml): se editan sin reconstruir la imagen
CMD ["npx", "playwright", "test"]
