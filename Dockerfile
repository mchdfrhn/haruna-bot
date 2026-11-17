FROM node:22-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      ffmpeg \
      build-essential \
      python3 \
      curl \
    && curl -fsSL https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json .npmrc ./
RUN npm install --omit=dev --no-audit --no-fund && npm cache clean --force

COPY src/ ./src/
COPY .env.example ./.env

RUN mkdir -p data sessions logs && \
    chown -R node:node /app

USER node

ENV NODE_ENV=production \
    LOG_LEVEL=info

VOLUME ["/app/data", "/app/sessions", "/app/logs"]

CMD ["node", "src/index.js"]
