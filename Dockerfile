# Two stages so build-essential/python3 (needed only if better-sqlite3 has no prebuilt binary) stay out of the runtime image.
# `npm install` instead of `npm ci`: package-lock.json is in .gitignore, so `npm ci` has nothing to install from.
FROM node:22-slim AS deps
RUN apt-get update && \
    apt-get install -y --no-install-recommends build-essential python3 \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json .npmrc ./
RUN npm install --omit=dev --no-audit --no-fund && npm cache clean --force

FROM node:22-slim
RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg python3 curl ca-certificates \
    && curl -fsSL https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp \
    && apt-get purge -y --auto-remove curl \
    && apt-get clean && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src/ ./src/

# Configuration comes from the environment (docker compose env_file / -e), not from a baked-in .env.
RUN mkdir -p data sessions logs && chown -R node:node /app
USER node

ENV NODE_ENV=production \
    LOG_LEVEL=info

VOLUME ["/app/data", "/app/sessions", "/app/logs"]

CMD ["node", "src/index.js"]
