# Один контейнер: собранный фронт и Fastify на одном origin.
# Образ собирается на серверной машине (`docker compose up -d --build`).
# better-sqlite3 и argon2 — нативные модули. Их ставит только server/package.json,
# на процессор этой машины. Корневой npm ci их не содержит.
FROM node:22-bookworm-slim AS frontend
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Фронт без VITE_DATA=server: экраны остаются на localStorage.
RUN npm run build

FROM node:22-bookworm-slim AS server
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY server/package.json server/package-lock.json ./server/
RUN npm ci --prefix server
COPY server/tsconfig.json ./server/tsconfig.json
COPY server/src ./server/src
RUN npm --prefix server run build \
  && npm --prefix server prune --omit=dev

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production \
    DATA_DIR=/data \
    CERT_FILE=/certs/cert.pem \
    KEY_FILE=/certs/key.pem \
    STATIC_DIR=/app/dist \
    HOST=0.0.0.0 \
    PORT=8443
COPY --from=frontend /app/dist ./dist
COPY --from=server /app/server/package.json ./server/package.json
COPY --from=server /app/server/node_modules ./server/node_modules
COPY --from=server /app/server/dist ./server/dist
COPY server/sql ./server/sql
COPY server/healthcheck.cjs ./server/healthcheck.cjs
EXPOSE 8443
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD ["node", "server/healthcheck.cjs"]
CMD ["node", "server/dist/index.js"]
