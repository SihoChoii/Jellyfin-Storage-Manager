# Running JellyMover on TrueNAS SCALE

JellyMover balances Jellyfin-style libraries across “hot” SSD pools and “cold” HDD pools through a single full-stack container image (`ghcr.io/SihoChoii/jellymover:latest`). This guide targets TrueNAS SCALE 24.10+ users and walks through the two supported installation flows: the Custom App wizard (recommended) and the “Install via YAML” editor that consumes the `deploy/truenas-compose.yml` snippet.

## Prerequisites: Datasets & media layout

Before deploying, prepare datasets under `/mnt/...` for each major mount:

- Config dataset (e.g., `pool/apps/jellymover-config`) → mounts at `/config`
- Data dataset (e.g., `pool/apps/jellymover-data`) → mounts at `/data`
- SSD “hot” media dataset (e.g., `ssd_pool/media/anime`) → mounts at `/media/hot`
- HDD “cold” media dataset (e.g., `hdd_pool/media/anime_archive`) → mounts at `/media/cold`

Choose names that match your storage pools; the container paths above should stay exactly as shown so JellyMover finds its configuration, database, and media roots.

## Option A – Install via Custom App (wizard)

1. In the SCALE UI, open **Apps → Discover** (or the main Apps screen) and click **Custom App** (the form-based wizard).
2. **General / Image**
   - Name: `jellymover` (or any label you prefer)
   - Image repository: `ghcr.io/SihoChoii/jellymover`
   - Tag: `latest`
3. **Environment Variables**
   - Add the following key/value pairs:
     - `JM_PORT` = `3000`
     - `JM_CONFIG_PATH` = `/config/app-config.json`
     - `JM_DB_PATH` = `/data/jellymover.db`
     - `JM_LOG_LEVEL` = `info`
   - Optional first-run seeds (only applied if the config file does not exist yet):
     - `JM_HOT_ROOT` = `/media/hot`
     - `JM_COLD_ROOT` = `/media/cold`
   - After the config file is created, these values persist inside `/config` and are not overwritten by env vars.
4. **Storage / Mounts**
   - Add four Host Path mounts using the dataset browser (avoid typing `/mnt/...` manually):
     - Mount Path `/config` → Host Path: select the `jellymover-config` dataset
     - Mount Path `/data` → Host Path: select the `jellymover-data` dataset
     - Mount Path `/media/hot` → Host Path: select your SSD media dataset
     - Mount Path `/media/cold` → Host Path: select your HDD media dataset
5. **Networking**
   - Ensure container port `3000` is exposed. If prompted for an external/NodePort, keep the default or choose another host port; JellyMover still serves on `JM_PORT` inside the container.
6. **Deploy & verify**
   - Click **Install**.
   - Wait for the app to reach **Running / Healthy**.
   - Browse to `http://<TrueNAS-IP>:3000/`.
   - On first load JellyMover will show the setup wizard or start scanning based on the configuration in `/config/app-config.json`.

## Option B – Install via YAML (advanced Compose users)

This path is for users who prefer managing stacks as raw Compose YAML and want to reuse `deploy/truenas-compose.yml`.

1. Go to **Apps → Custom App → Install via YAML** in the SCALE UI.
2. In another tab or your Git client, open `deploy/truenas-compose.yml` at the repo root and copy its entire contents.
3. Paste the file into the YAML editor.
4. Update the `volumes:` host paths (`/mnt/POOL/...`) so they point to your datasets, but leave the container mount paths (`/config`, `/data`, `/media/hot`, `/media/cold`) exactly as written.
5. Optionally adjust:
   - The image tag (e.g., keep `image: ghcr.io/SihoChoii/jellymover:latest` or pin a specific version).
   - Port mappings such as `"3000:3000"` if you want a different external port.
6. Save and deploy. The YAML editor does not provide a dataset browser, so double-check the host paths before launching.

A small excerpt from `deploy/truenas-compose.yml` is shown below for quick validation:

```yaml
services:
  jellymover:
    image: ghcr.io/SihoChoii/jellymover:latest
    volumes:
      - /mnt/POOL/apps/jellymover-config:/config
      # ...other mounts for /data, /media/hot, /media/cold
```

## Environment variables

| Variable | Description |
| --- | --- |
| `JM_PORT` | Internal HTTP port (default `3000`). |
| `JM_CONFIG_PATH` | Path to the config JSON inside the container (`/config/app-config.json`). |
| `JM_DB_PATH` | SQLite database path (`/data/jellymover.db`). |
| `JM_LOG_LEVEL` | Log verbosity (`info`, `debug`, etc.). |
| `JM_HOT_ROOT`, `JM_COLD_ROOT` | Optional one-time seeds when `/config/app-config.json` does not yet exist; subsequent runs use the saved config instead. |

## Volumes & permissions

JellyMover expects four fixed mount points inside the container. Only the host paths (`/mnt/...`) change to match your datasets.

| Container path | Purpose | Example dataset |
| --- | --- | --- |
| `/config` | Stores `app-config.json` and other settings | `pool/apps/jellymover-config` |
| `/data` | Holds `jellymover.db` and internal state | `pool/apps/jellymover-data` |
| `/media/hot` | SSD “hot” media root | `ssd_pool/media/anime` |
| `/media/cold` | HDD “cold” media root | `hdd_pool/media/anime_archive` |

- These paths appear in both the Custom App wizard (Host Path mounts) and `deploy/truenas-compose.yml` (`volumes:`). Keep the container paths identical (`/config`, `/data`, `/media/hot`, `/media/cold`) and only swap the host paths for your datasets.
- The container runs as a non-root `jellymover` user. Ensure dataset ACLs/owners grant this user (via Docker) read/write access to `/config` and `/data`. Media mounts need at least read access and typically write/rename/delete if JellyMover should move files between pools.
- In the Custom App wizard, when you browse to a dataset for `/config`, `/data`, etc., confirm that dataset has appropriate permissions before installing. In the YAML flow, replace the `/mnt/POOL/...` placeholders with datasets that already allow the container user to access them.
- If you see permission errors in JellyMover logs or the UI, revisit **Storage → Datasets** on TrueNAS and adjust ACLs or ownership so the Docker runtime user can read/write the mounted paths.
- Future enhancement idea: the container currently uses a fixed internal user. Supporting `PUID`/`PGID` environment variables could provide more flexibility in the future, but that feature is not implemented yet.
