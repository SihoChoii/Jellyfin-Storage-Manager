# syntax=docker/dockerfile:1.7
##
## JellyMover full-stack image: builds frontend + backend and serves both from one container.
##

FROM node:lts AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci
COPY frontend .
RUN npm run build

FROM rust:1.79 AS backend-builder
# Edition 2024 presently requires nightly.
RUN rustup toolchain install nightly --profile minimal
WORKDIR /app

COPY Cargo.toml Cargo.lock ./
COPY backend ./backend
RUN cargo +nightly fetch
RUN cargo +nightly build --release -p jellymover-backend

FROM debian:bookworm-slim AS runtime
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*

RUN groupadd --system --gid 1000 jellymover \
    && useradd --system --uid 1000 --home /app --gid jellymover --shell /usr/sbin/nologin jellymover

COPY --from=backend-builder /app/target/release/jellymover-backend /app/jellymover-backend
COPY --from=frontend-builder /app/frontend/dist /app/static

RUN mkdir -p /config /data \
    && chown -R jellymover:jellymover /app /config /data

ENV JM_PORT=3000 \
    JM_CONFIG_PATH=/config/app-config.json \
    JM_DB_PATH=/data/jellymover.db \
    JM_LOG_LEVEL=info

USER jellymover

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -fsS http://127.0.0.1:3000/health || exit 1
ENTRYPOINT ["/app/jellymover-backend"]

# Usage:
#   docker compose up --build
# Then visit http://localhost:3000/ for the SPA, /health for status, and /api/... for APIs.
# Host ./config and ./data map to /config and /data; ./test-media/{hot,cold} map to /media/{hot,cold}.
