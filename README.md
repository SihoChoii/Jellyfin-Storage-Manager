![Banner](Example/banner1.png)
# JellyMover

JellyMover keeps a Jellyfin library balanced across a fast “hot” SSD pool and a larger “cold” HDD pool. A Rust backend continuously understands what lives where, a SQLite database tracks shows and move jobs, and a React/Vite frontend gives you a control surface for scans, pool insights, and one-click moves.

## Key features
- Filesystem scanner understands hot/cold roots or explicit library paths, parses `tvshow.nfo`, and stores metadata (title, size, seasons, episodes, thumbnails) in SQLite.
- Move jobs are queued, executed, and monitored through an Axum API; the worker copies files, updates the DB, deletes the source, and reports progress/ETA.
- Jellyfin integration can trigger rescan jobs and validate API access so the media server stays in sync.
- A SPA (React 19 + Vite + TypeScript) provides a setup wizard, dual-pane library view, stats dashboard, jobs monitor, and configuration screen.
- Docker build (root `Dockerfile` + `docker-compose.yml`) ships a full-stack image that serves the compiled frontend alongside the backend API.

## Quickstart on TrueNAS SCALE
1. Confirm your SCALE host can pull `ghcr.io/sihochoii/jellymover:latest`.
2. Create datasets for JellyMover config, JellyMover data, hot SSD media, and cold HDD media (each will mount into `/config`, `/data`, `/media/hot`, `/media/cold` respectively).
3. In **Apps → Custom App**, use the wizard to set the image (`ghcr.io/sihochoii/jellymover:latest`), add the standard env vars (`JM_PORT`, `JM_CONFIG_PATH`, `JM_DB_PATH`, `JM_LOG_LEVEL`, optional `JM_HOT_ROOT`/`JM_COLD_ROOT`), and add Host Path mounts pointing to your datasets.
4. Click **Install**, wait for the app to turn **Running**, then open `http://<nas-ip>:3000/` in a browser.

For additional background (screenshots, YAML install option, and permissions), see [docs/truenas-scale.md](docs/truenas-scale.md).

## TrueNAS SCALE – Step-by-Step Setup (Install iX App)

### Prerequisites
- TrueNAS SCALE 24.10+.
- GHCR image available: `ghcr.io/sihochoii/jellymover:latest`.
- Datasets created for:
  - JellyMover config: e.g. `pool/apps/jellymover-config`
  - JellyMover data: e.g. `pool/apps/jellymover-data`
  - Hot SSD media: e.g. `ssd_pool/media/anime`
  - Cold HDD media: e.g. `hdd_pool/media/anime_archive`
  (In TrueNAS they appear as `/mnt/<pool>/<dataset>`.)

### Open the Install iX App → Custom App wizard
1. In the TrueNAS web UI, go to **Apps → Discover** (or open the Apps landing page).
2. Click **Custom App** to open the generic **Install iX App** wizard.
3. You will see sections such as General, Image Configuration, Container Configuration, etc.—you will fill only the relevant ones below.

### General section
- **Application name**: `jellymover` (or any label you want in the Apps list).
- **Version**: Metadata only—example `0.1.0`. This does *not* control the Docker image tag; the tag lives in the Image section.
- **Notes**: Optional. Example: “Moves media between SSD (Hot) and HDD (Cold) pools for Jellyfin.”
- All other fields in this section can stay at their defaults.

### Image Configuration section
**Image Configuration**

| Field        | Value                                  | Notes                                           |
|-------------|----------------------------------------|------------------------------------------------|
| Repository  | `ghcr.io/sihochoii/jellymover`          | Must be lowercase, no tag here                 |
| Tag         | `latest`                                | Or a specific tag like `v0.1.3` if you prefer   |
| Pull Policy | `IfNotPresent` (recommended)            | `Always` is fine if you’re actively developing |

TrueNAS internally pulls `ghcr.io/sihochoii/jellymover:<Tag>`. Do not add `:latest` to the Repository field—set the tag separately.

### Container Configuration section
- **Hostname**: Optional; set `jellymover` or leave empty.
- **Entrypoint / Command**: Leave blank. The container image already defines the correct entrypoint.
- **Timezone**: Set to your local timezone (e.g. `America/Los_Angeles`).
- **Environment Variables**:

Add the following environment variables:

| Name             | Value                        | Required | Notes                                                   |
|------------------|------------------------------|----------|---------------------------------------------------------|
| `JM_PORT`        | `3000`                       | Yes      | Internal port JellyMover listens on                     |
| `JM_CONFIG_PATH` | `/config/app-config.json`    | Yes      | Path to config file inside the container                |
| `JM_DB_PATH`     | `/data/jellymover.db`        | Yes      | SQLite DB path inside the container                     |
| `JM_LOG_LEVEL`   | `info`                       | Yes      | Logging level (`info`, `debug`, etc.)                   |
| `JM_HOT_ROOT`    | `/media/hot`                 | Optional | Used on first run when the config file is missing       |
| `JM_COLD_ROOT`   | `/media/cold`                | Optional | Used on first run when the config file is missing       |

`JM_HOT_ROOT` and `JM_COLD_ROOT` seed the initial config. After `/config/app-config.json` exists, JellyMover reads the saved values instead.

- **Restart Policy**: `UnlessStopped` is recommended so the app restarts with the NAS.
- **Disable Builtin Healthcheck**: Leave unchecked—use the healthcheck baked into the image.
- **TTY / Stdin / Devices**: Leave TTY and Stdin unchecked; no Devices are required.

### Security Context Configuration
- **Privileged**: Leave unchecked.
- **Capabilities**: Leave empty.
- **Custom User**: Leave empty. JellyMover already runs as a non-root user inside the container, so no override is needed.

### Network Configuration section
- **Host Network**: Leave unchecked (disabled) to use a NAT’d interface.
- **Ports**: Add a single port mapping:

| Field            | Value                     | Notes                                         |
|------------------|---------------------------|-----------------------------------------------|
| Host IP          | `0.0.0.0` or leave blank  | Binds on all IPv4 interfaces                   |
| Host / Node Port | e.g. `31847`              | Any free high port on your NAS                |
| Container Port   | `3000`                    | Must match `JM_PORT`                          |
| Protocol         | `TCP`                     |                                               |

You will access JellyMover at `http://<truenas-ip>:<Host/Node Port>/`. Changing the Host/Node Port does not require changing `JM_PORT` (keep the container at 3000 and remap externally).

- **Custom DNS Setup (Nameservers, Search Domains, DNS Options)**: Leave empty unless you have specific DNS needs.

### Portal Configuration section
1. Click **Add Portal** (or similar) and choose **HTTP**.
2. **Host/IP**: Enter your NAS hostname or IP (e.g. `truenas.local` or `192.168.x.x`).
3. **Port**: Use the same Host/Node Port from the Network section (e.g. `31847`).

JellyMover exposes HTTP only. Keep the portal type as HTTP unless you front it with a reverse proxy that terminates TLS.

### Storage Configuration section
Add four **Host Path** storage entries:

| Purpose        | Host Path (example)                | Container Mount Path |
|----------------|------------------------------------|----------------------|
| Config         | `/mnt/pool/apps/jellymover-config` | `/config`            |
| Data           | `/mnt/pool/apps/jellymover-data`   | `/data`              |
| Hot SSD media  | `/mnt/ssd_pool/media/anime`        | `/media/hot`         |
| Cold HDD media | `/mnt/hdd_pool/media/anime_archive`| `/media/cold`        |

Use the TrueNAS dataset browser to pick Host Paths (no need to type `/mnt/...` manually). Container mount paths *must* be exactly `/config`, `/data`, `/media/hot`, and `/media/cold`; only the host paths change. Ensure these datasets are writable by the container runtime (see [docs/truenas-scale.md](docs/truenas-scale.md) for ACL tips).

### Labels & Resources sections
- **Labels Configuration**: Optional; leave empty unless you need metadata tags.
- **Resources Configuration**: Leaving “Enable Resource Limits” off is fine to start. Advanced users can cap CPU/RAM later to keep JellyMover lightweight.
- **GPU Configuration**: Not required—JellyMover does not use GPU acceleration.

### Deploy & test
1. Review every section to ensure values match your pools and ports.
2. Click **Install / Save** in the TrueNAS UI.
3. Wait for the JellyMover app to reach **Running / Healthy**.
4. Visit `http://<truenas-ip>:<Host/Node Port>/` in a browser.
5. On first run JellyMover will use `JM_HOT_ROOT` / `JM_COLD_ROOT` to initialize `/config/app-config.json` and create the SQLite DB under `/data`.

If the app fails to start, inspect the app logs in the TrueNAS Apps UI and verify permissions on the datasets mounted at `/config`, `/data`, `/media/hot`, and `/media/cold`.

For additional background and alternative deployment options (including YAML-based installation), see [docs/truenas-scale.md](docs/truenas-scale.md).

## Repository layout
| Path | Purpose |
| --- | --- |
| `backend/` | Rust crate (`jellymover-backend`) with Axum HTTP server, filesystem scanner, Jellyfin client, SQLite migrations, and job worker. Includes `backend/Dockerfile` + `DOCKER.md` for backend-only image builds. |
| `frontend/` | React/Vite TypeScript SPA plus Vitest/Jest Testing Library setup. Run `npm run dev`, `npm run build`, `npm run test`, or `npm run lint`. |
| `config/` | Local runtime configuration and sample `app-config.json`. Bind mounted to `/config` inside containers. |
| `data/` | SQLite database lives here (`jellymover.db`). Bind mounted to `/data` inside containers. |
| `Example/` | Sample `tvshow.nfo` files used by scanner unit tests. |
| `test-media/` | Optional hot/cold folders used by `docker-compose` for quick smoke tests. |
| `Dockerfile`, `docker-compose.yml` | Full-stack container build & orchestration. |

## Architecture
```
Hot /media/hot      Cold /media/cold
        │                  │
        └── scanner.rs (walkdir + quick-xml) ──► SQLite (shows, jobs tables)
                                  │
                            Axum HTTP API
                   (config, pools, scan, jobs, Jellyfin)
                                  │
                    React + Vite frontend (dist/ served by Axum)
                                  │
                      Operators queue jobs or rescans
                                  │
                    Job worker copies files and updates DB
                                  │
                      Optional Jellyfin rescan trigger
```

## Backend (Rust + Axum)

### Local development
1. Install the nightly Rust toolchain (edition 2024 requires it for now): `rustup toolchain install nightly`.
2. Start the API (from the repo root):<br>`cargo +nightly run -p jellymover-backend`
3. Browse `http://localhost:3000/health` to verify the service and `http://localhost:3000/api/...` for endpoints. Static assets are served from `/app/static` when present; during local dev the frontend usually runs separately via Vite.

### Configuration file
- Default path: `config/app-config.json` (inside Docker it becomes `/config/app-config.json`).
- The server creates the file on first boot; you can also seed it with `JM_HOT_ROOT` and `JM_COLD_ROOT` (only when the file did not exist).
- Fields:

```json
{
  "hot_root": "/media/hot",
  "cold_root": "/media/cold",
  "library_paths": [],
  "jellyfin": {
    "url": "https://jellyfin.example.com",
    "api_key": "PASTE_YOUR_KEY"
  }
}
```

| Field | Meaning |
| --- | --- |
| `hot_root`, `cold_root` | Absolute directories that represent SSD (“hot”) and HDD (“cold”) pools. Must exist before saving. |
| `library_paths` | Optional overrides for folders to scan. If empty, JellyMover scans both roots. |
| `jellyfin.url`, `jellyfin.api_key` | Base URL and API key used to trigger library refreshes and validate access. Leave empty to disable integration. |

### Environment variables
| Variable | Default / Effect |
| --- | --- |
| `JM_PORT` | HTTP port (default `3000`). |
| `JM_CONFIG_PATH` | Config file path (`config/app-config.json` locally, `/config/app-config.json` in Docker). |
| `JM_DB_PATH` | SQLite file path (`data/jellymover.db` locally, `/data/jellymover.db` in Docker). |
| `JM_LOG_LEVEL` | `tracing_subscriber` filter (default `info`). Set to `debug` for verbose logging. |
| `JM_HOT_ROOT`, `JM_COLD_ROOT` | Optional one-time seeds for a brand-new config file. Ignored after the config exists. |
| `JELLYMOVER_IN_DOCKER` / `RUNNING_IN_DOCKER` | Optional hints if auto-detection should treat the process as containerized. |

### Database and filesystem expectations
- `backend/src/db.rs` initializes SQLite with `shows` and `jobs` tables plus indexes for path, location, and sort columns.
- The scanner (`scanner.rs`) walks every configured library directory, infers metadata, and upserts records. It understands `tvshow.nfo`, optional per-episode `.nfo` files, and `folder.jpg`/`poster.jpg` thumbnails.
- Both pools must be accessible to the backend process so that jobs can copy and delete directories. When running in Docker, bind mount the host folders read/write to `/media/hot` and `/media/cold`.

### Filesystem scans and job worker
- `POST /api/scan` kicks off a background scan. Only one scan runs at a time, and scans are blocked while move jobs are active.
- Scan status is exposed at `GET /api/scan/status`.
- `jobs::start_worker` loops forever until shutdown, pulls the oldest queued job, and copies the show folder to the requested pool using async `tokio::fs` and `walkdir`.
- Completed jobs update the `shows` table path + location and delete the original source directory. Failed jobs keep the error text attached for the UI.

### HTTP API surface
| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/health` | Returns `{status, db}` for container/orchestrator probes. |
| `GET/PUT` | `/api/config` | Read or persist `app-config.json`. Validation ensures directories exist and hot/cold roots are distinct. |
| `GET` | `/api/paths?root=/path` | Lists immediate subdirectories plus capacity stats; used by the settings path picker. |
| `GET` | `/api/pools` | Returns `hot`/`cold` usage (total/used/free bytes). |
| `POST` | `/api/scan` | Starts filesystem scan. |
| `GET` | `/api/scan/status` | Returns `{state, last_started, last_finished, last_error}`. |
| `POST` | `/api/jellyfin/rescan` | Triggers `Library/Refresh` via Jellyfin API. |
| `GET` | `/api/jellyfin/status` | Checks Jellyfin health endpoint plus `Library/PhysicalPaths` to confirm connectivity/auth. |
| `GET` | `/api/shows` | Lists shows. Supports `location`, `limit`, `offset`, `search` (`title`/`path`), and `sort_by` (`title`, `size`, `date`, `seasons`, `episodes`) with `sort_dir`. |
| `POST` | `/api/shows/:id/move` | Queues a move job: `{ "target": "hot" | "cold" }`. Guarded so scans/missing config cannot overlap. |
| `GET` | `/api/jobs` | Lists jobs with pagination. |
| `GET` | `/api/jobs/:id` | Returns a single job. |

Static requests fall back to `frontend/dist` (copied to `/app/static`). When the bundle is missing, a placeholder HTML page reminds you to run the frontend build.

## Frontend (React + Vite)

### Local development workflow
1. Install Node.js 18+ and npm.
2. Install dependencies: `cd frontend && npm install`.
3. Run the dev server (point it at the backend):<br>`VITE_API_BASE=http://localhost:3000/api npm run dev` (Vite listens on `http://localhost:5173`).
4. The SPA talks to the backend via `frontend/src/api.ts`; the `VITE_API_BASE` env variable defaults to `/api` for same-origin deployments.

### Production build & tests
- Build artifacts: `npm run build` (writes `frontend/dist/`). The docker build copies this folder into the backend image.
- Preview build: `npm run preview`.
- Tests: `npm run test` (Vitest + Testing Library) and `npm run lint`.

### UI highlights
- **Setup Wizard** ensures hot/cold roots + Jellyfin credentials exist before exposing the rest of the app.
- **Library view (`JellyMoverShell`)** shows hot/cold panes, search, infinite scroll, sorting, pool stats, and one-click move buttons (which queue `/shows/:id/move` jobs).
- **Jobs page** polls `/jobs`, merges historical pages, and surfaces totals (running/queued/success/failed) plus per-job progress + ETA using `useJobsPolling`.
- **Stats page** merges pool usage, job throughput, and pseudo load indicators for an at-a-glance dashboard.
- **Settings page** edits config, browses directories via `/paths`, triggers scans, and integrates Jellyfin status/rescan calls.

## Docker & deployment

### Full-stack container
```
docker compose up --build
# visit http://localhost:3000/
```
- The root `Dockerfile` builds the frontend (Node LTS) and the backend (Rust nightly), then combines them in a slim Debian runtime with a non-root `jellymover` user.
- Canonical registry image (e.g., for TrueNAS SCALE deployments): `ghcr.io/sihochoii/jellymover:latest`.
- `docker-compose.yml` exposes port 3000, mounts `./config` → `/config`, `./data` → `/data`, and the sample `./test-media/{hot,cold}` → `/media/{hot,cold}`.
- Healthchecks hit `/health`, so TrueNAS SCALE or other orchestrators can monitor the container.
- For TrueNAS SCALE installs (Custom App wizard or YAML), follow [docs/truenas-scale.md](docs/truenas-scale.md). For plain Docker hosts, run `docker compose up --build` with the root `docker-compose.yml`.

### Backend-only image
If you only need the API, build `backend/Dockerfile`:
```
docker build -t jellymover-backend ./backend
docker run --rm -p 3000:3000 \
  -v "$(pwd)/config:/config" \
  -v "$(pwd)/data:/data" \
  jellymover-backend
```
Copy a built frontend bundle into `/app/static` if you still want to serve the SPA from the backend container.

### Volume layout / persistence
| Host Path | Container Path | Contents |
| --- | --- | --- |
| `config/` | `/config` | `app-config.json` (hot/cold roots, Jellyfin secrets). |
| `data/` | `/data` | `jellymover.db` SQLite database. |
| `test-media/hot` | `/media/hot` | Optional sample SSD pool. Replace with your actual dataset in production. |
| `test-media/cold` | `/media/cold` | Optional sample HDD pool. |

Ensure the host directories are writable by UID/GID `1000` (default user inside the container) or adjust the docker compose file accordingly.

## Data and sample content
- `config/app-config.json` in the repo includes example values—replace them with your own secrets before running against a real Jellyfin server.
- `data/jellymover.db` is safe to delete between runs; the backend recreates the schema automatically.
- `test-media/` is purely for local experimentation and can be replaced with bind mounts to your actual pools.
- `Example/` contains fixtures that keep scanner unit tests deterministic.

## Testing & quality gates
- Backend unit tests: `cargo +nightly test -p jellymover-backend`
- Lint/analyze (optional): `cargo +nightly fmt -- --check` and `cargo +nightly clippy -p jellymover-backend`
- Frontend tests: `cd frontend && npm run test`
- Frontend lint: `cd frontend && npm run lint`
- Before shipping container updates, run `npm run build` so Docker can copy the latest bundle, then `docker compose up --build` to validate end-to-end.

## Troubleshooting & tips
- **Configuration won’t save** – the backend validates that hot/cold directories already exist and are not nested; create the folders first or point at the mounted pool path.
- **Vite can’t reach the API** – set `VITE_API_BASE=http://localhost:3000/api` (or your remote URL) before `npm run dev`.
- **Jobs stay queued** – ensure no scan is running (`GET /api/scan/status`) and check backend logs for filesystem permission errors on `/media/{hot,cold}`.
- **Jellyfin errors** – use the settings page or `GET /api/jellyfin/status` to inspect HTTP status codes; most issues stem from incorrect base URLs or API keys.

You now have a single README that documents the backend, frontend, Docker workflows, and operational expectations for JellyMover.
