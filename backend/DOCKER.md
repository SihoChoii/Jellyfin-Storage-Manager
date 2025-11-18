# JellyMover Backend Docker Image

From the repository root:

```bash
# Optional: persist configuration & DB in local folders
mkdir -p config data

docker build -t jellymover-backend ./backend

docker run --rm \
  -p 3000:3000 \
  -v "$(pwd)/config:/config" \
  -v "$(pwd)/data:/data" \
  jellymover-backend
```

Once the container is listening, verify the health check:

```bash
curl http://localhost:3000/health
```

The backend exposes port `3000` and automatically initializes `/config/app-config.json` and `/data/jellymover.db` if they are missing.

## Frontend assets

When available, copy the built frontend bundle into `/app/static` inside the backend container (for example during a later Docker build stage). The backend serves files from that directory and falls back to `index.html` for non-API routes. If no bundle is present, `/` responds with a placeholder message reminding you to build and copy the frontend.

## Environment variables

The backend reads the following environment variables at startup:

- `JM_PORT` – HTTP port to bind (default `3000`).
- `JM_CONFIG_PATH` – path to the config file (defaults to `/config/app-config.json` in Docker; local path otherwise).
- `JM_DB_PATH` – SQLite database path (defaults to `/data/jellymover.db` in Docker; local path otherwise).
- `JM_LOG_LEVEL` – log level passed to `tracing_subscriber` (default `info`).
- `JM_HOT_ROOT` / `JM_COLD_ROOT` – optional seeds for a brand-new config file. They are only applied when the config file does not exist yet; existing configs are never overwritten.

Example (from the repo root):

```bash
docker compose up --build
# Visit http://localhost:3000/ for the UI, /health for status, and mount ./config + ./data for storage.
```

## Runtime hardening

- The container runs as the non-root `jellymover` user; `/config` and `/data` are owned by this user inside the image. Ensure bind mounts from the host grant read/write access to UID/GID `jellymover` (defaults to 1000/1000 in the Dockerfile).
- A Docker `HEALTHCHECK` hits `http://127.0.0.1:3000/health` periodically so orchestrators can detect unhealthy containers.
- Application logs go to stdout/stderr and honor `JM_LOG_LEVEL`, making them suitable for `docker logs` / TrueNAS log collection.
