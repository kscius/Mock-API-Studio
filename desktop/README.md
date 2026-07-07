# Mock API Studio — Desktop (Tauri)

Offline-capable desktop shell wrapping the existing React UI.

## Prerequisites

- [Rust](https://www.rust-lang.org/tools/install) (for Tauri)
- Node.js 20+
- Docker (for Postgres + Redis in v1)

## Development

```bash
# Start database dependencies
npm run docker:desktop-deps

# Backend API (separate terminal)
npm run dev:backend

# Desktop + Vite UI
npm run dev:desktop
```

The desktop window loads `http://localhost:5173` in dev and talks to the backend at `http://127.0.0.1:3000`.

## Production build

```bash
npm run build:desktop
```

Installers are emitted under `desktop/src-tauri/target/release/bundle/`.

## Architecture

| Layer | Role |
|-------|------|
| `frontend/` | React UI (unchanged) |
| `backend/` | NestJS API (run locally or via Docker) |
| `desktop/src-tauri/` | Tauri shell (window, CSP, future sidecar) |

### Phase 2 (future)

- Bundle NestJS as a Tauri sidecar (`mock-api-backend`)
- Portable Postgres/SQLite profile for true offline without Docker

## Configuration

Copy `desktop/.env.example` to `desktop/.env` for local overrides.
