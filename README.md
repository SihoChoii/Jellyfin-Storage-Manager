# JellyMover

JellyMover is a tool to manage Jellyfin media between a "Hot" SSD pool and a "Cold" HDD pool on TrueNAS SCALE.

## Project Structure
- `backend/` – Rust binary crate (`jellymover-backend`) that will power the API and storage orchestration logic.
- `frontend/` – React + Vite TypeScript app that will become the management UI.

## Development

### Backend
Prerequisites: Rust toolchain with Cargo installed.

```sh
cd backend
cargo run
```
The current binary just logs a placeholder message so the crate compiles cleanly.

### Frontend
Prerequisites: Node.js 18+ and npm.

```sh
cd frontend
npm install   # first run only
npm run dev
```
Vite starts a dev server (default http://localhost:5173) serving the empty React shell ready for future UI work.
