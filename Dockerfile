# Один контейнер: собранный фронт и Fastify на одном origin.
# Образ собирается на серверной машине (`docker compose up -d --build`):
# у better-sqlite3 и argon2 нативный модуль под процессор этой машины.
FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Фронт без VITE_DATA=server: экраны остаются на localStorage.
RUN npm run build && npm run build:server \
  && npm prune --omit=dev

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production \
    DATA_DIR=/data \
    CERT_FILE=/certs/cert.pem \
    KEY_FILE=/certs/key.pem \
    STATIC_DIR=/app/dist \
    HOST=0.0.0.0 \
    PORT=8443
COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/server/sql ./server/sql
COPY server/healthcheck.cjs ./server/healthcheck.cjs
EXPOSE 8443
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD ["node", "server/healthcheck.cjs"]
CMD ["node", "server/dist/index.js"]
