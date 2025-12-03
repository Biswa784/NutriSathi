<!-- Copilot instructions for AI agents working on NutriSathi -->
# NutriSathi — Copilot Instructions

This file provides focused, actionable guidance for AI coding agents to be immediately productive in this repository.

1) Big picture
-- **Monorepo layout**: top-level folders: `backend/` (FastAPI Python API), `frontend/` (React + Vite + TypeScript + Tailwind), `infra/` (previously used for Docker Compose), plus example `fastapi-sqlite-alembic/` templates. Work touches these three primary components.
-- **Runtime**: This repository no longer includes a canonical docker-compose-based dev run. Run backend and frontend locally as described in the top-level `README.md` (backend on :8000, frontend on :5173 by default).

2) Key files & entrypoints
- Backend: `backend/app/main.py` — primary API for the demo. Note: it currently uses an in-memory `meals_db` list (not persistent). Typical endpoints: `/health`, `/meals` (GET/POST), `/dishes`, `/gamification/stats`.
- Backend config: `backend/requirements.txt`, `backend/Dockerfile` (Python 3.11 base, `uvicorn` entrypoint `app.main:app`).
- Frontend: `frontend/src/App.tsx` (top-level UI), `frontend/src/main.tsx` (app bootstrap). The frontend checks `VITE_API_URL` and defaults to `http://localhost:8000`.
-- Infra: the `infra/` directory previously contained `docker-compose.yml`. Docker artifacts were removed; run services locally and set `DATABASE_URL` as needed for development.
- DB-backed example: `fastapi-sqlite-alembic/` and `fastapi-sqlite-alembic-1/` show a FastAPI + SQLAlchemy + Alembic pattern (app/db, app/api/v1, migrations). Use these as reference when converting the demo backend to persistent storage.

3) Developer workflows (explicit commands)
-- Start everything (recommended):
  - Run backend and frontend locally as described in the top-level `README.md`. If you need a local Postgres DB for development you can start one separately (for example via Docker Desktop) and set the `DATABASE_URL` environment variable accordingly.
- Run backend locally (no Docker):
  - `cd backend` then `pip install -r requirements.txt` and `uvicorn app.main:app --reload`.
- Run frontend locally:
  - `cd frontend` then `npm install` and `npm run dev`.
- Database notes:
  - Docker compose sets `DATABASE_URL=postgresql+psycopg://nutria:nutria@db:5432/nutria` for the backend service.
  - If you need migrations or persistent models, read `fastapi-sqlite-alembic/app` to see `SQLAlchemy` and `alembic` usage.

4) Project-specific conventions & patterns
- **Demo vs. Template**: The `backend/` API is intentionally minimal and uses an in-memory store for quick dev. For production-like changes, prefer patterns from `fastapi-sqlite-alembic/` which contains `app/db`, `app/schemas`, `app/api/v1` and Alembic integration.
- **Env var override**: Frontend reads `VITE_API_URL` (via `import.meta.env.VITE_API_URL`). When updating API URLs, ensure the frontend uses that env var or fallback to `http://localhost:8000`.
- **Ports & CORS**: Backend enables CORS for `*` to simplify local development. When adding auth or stricter CORS, update `backend/app/main.py` middleware.
- **Testing / imports**: There is a `tests/` folder and `backend/test_imports.py` used to verify import health — use these to sanity-check dependency changes.

5) Where to make common changes
- To add a persistent model: create SQLAlchemy models under `fastapi-sqlite-alembic/app/db/models.py`, add CRUD in `fastapi-sqlite-alembic/app/crud`, and adapt `backend/app/main.py` or migrate the backend to use the template structure.
- To change API surface: update `backend/app/main.py` for the demo API; for production-style routes follow `fastapi-sqlite-alembic/app/api/v1/endpoints.py`.
- To update UI behavior: edit `frontend/src/components/*` and `frontend/src/App.tsx`. Use `VITE_API_URL` when calling the backend.

6) Helpful searching shortcuts for agents
- Search for API routes: `grep -R "@app\.get\|@app\.post" backend/ fastapi-sqlite-alembic/`
- Search for DB usage: `grep -R "SQLAlchemy\|alembic\|engine\|session" fastapi-sqlite-alembic/`

7) Safety and scope notes for AI agents
- Avoid changing environment secrets or hard-coded credentials in `infra/docker-compose.yml` without explicit instructions — current values are dev-only (`nutria:nutria`).
- Preserve the demo in-memory behavior unless the user requests a migration to a DB-backed implementation; when migrating, create new modules and leave the demo intact until tested.

If anything important appears missing or any section is unclear, tell me which area you'd like expanded (e.g., deeper DB migration steps, test commands, or frontend build pipeline). Ready to iterate on specifics.
