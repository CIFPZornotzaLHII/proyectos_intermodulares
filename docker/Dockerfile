# Contenedor para ejecutar la fábrica de forma desatendida.
#
# Dentro del contenedor es razonable lanzar Claude Code con
# --dangerously-skip-permissions (sin preguntas de permiso), porque lo único
# que puede tocar es el directorio montado. Fuera de un contenedor, no lo hagas.
#
# Construir:  docker compose -f docker/compose.yaml build
# Entrar:     docker compose -f docker/compose.yaml run --rm factory
# Dentro:     claude --dangerously-skip-permissions   →   /factory <feature>

FROM node:22-bookworm-slim

ARG CLAUDE_CODE_VERSION=latest
ARG WITH_AGENT_BROWSER=0

ENV DEBIAN_FRONTEND=noninteractive \
    LANG=C.UTF-8 \
    # Claude Code guarda credenciales y ajustes aquí; compose lo monta como volumen persistente.
    HOME=/home/factory

RUN apt-get update && apt-get install -y --no-install-recommends \
      git ca-certificates curl python3 \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g "@anthropic-ai/claude-code@${CLAUDE_CODE_VERSION}" \
    && if [ "$WITH_AGENT_BROWSER" = "1" ]; then \
         npm install -g agent-browser \
         && npx --yes playwright install --with-deps chromium; \
       fi

# Usuario sin privilegios. Su HOME es un volumen (ver compose.yaml) para que el
# login de Claude Code sobreviva a reinicios del contenedor.
RUN useradd --create-home --shell /bin/bash --home-dir /home/factory factory
USER factory

# /work/<repo> es el checkout principal; los worktrees van a /work/<repo>-factory
# (config.worktree_dir por defecto), así que se monta el directorio padre en /work.
WORKDIR /work/repo

CMD ["bash"]
