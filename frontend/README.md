# JellyMover Frontend

React + Vite + TypeScript UI for the JellyMover project.

## Development

```bash
cd frontend
npm install
npm run dev
```

## Production build

```bash
cd frontend
npm install
npm run build
```

The production bundle is emitted to `frontend/dist/` and contains `index.html` plus hashed assets under `dist/assets/`. You can preview the build locally with `npm run preview`.

During Dockerization, the contents of `frontend/dist/` will be copied into the backend image at `/app/static`. Axum then serves `index.html` for `/` (and other non-API routes) and all static assets from `/app/static/assets/`.
