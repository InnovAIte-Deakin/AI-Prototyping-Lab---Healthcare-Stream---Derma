# Operations Runbook (DERMA)

This runbook covers basic operational tasks for the DERMA platform.

## Start and stop services

Backend:
```bash
cd backend
uvicorn app.main:app --reload
```

Frontend:
```bash
cd frontend
npm run dev
```

Database (Docker):
```bash
cd backend
docker-compose up -d
docker-compose down
```

## Health checks

- `GET /health` returns overall status plus DB/env checks.
- `GET /ready` mirrors `/health` for readiness probes.
- Healthy responses return HTTP 200. Degraded responses return HTTP 503.

## Logs and request tracing

- Logs are JSON formatted and include `request_id` for correlation.
- Every response includes an `X-Request-ID` header; capture it for support.
- Configure log verbosity with `LOG_LEVEL` (e.g., `INFO`, `DEBUG`, `WARNING`).

## Migrations and seeds

```bash
cd backend
alembic upgrade head
python -m app.seed_doctors
python -m app.seed_data
python -m app.seed_e2e_fixtures
```

## Rotate secrets

1. Update values in `backend/.env` (or deployment secrets store).
2. Restart the backend service.
3. If `SECRET_KEY` changes, existing JWT sessions are invalidated.

## Capture diagnostics

When reporting an issue:
1. Capture the `X-Request-ID` from the failing response.
2. Record the endpoint, request time, and user role.
3. Check backend logs for the matching `request_id`.
4. Confirm DB connectivity (via `/health`) and storage access.

## Troubleshooting & Database Reset

If you find that **old login credentials no longer work** (e.g., after an auth upgrade), you may need to reset the database.

### 1. Reset Database Volume
Navigate to `backend/` and run:

```bash
# Destroy containers and DELETE the data volume (-v)
docker-compose down -v

# Start a fresh, empty database connection
docker-compose up -d
```

### 2. Run Migrations & Seeds
Re-create the schema and populate test users:

```bash
# Apply schema
alembic upgrade head

# Seed Doctors (Alice, Bob, etc.)
python -m app.seed_doctors

# (Optional) Seed Admin or E2E data
python -m app.seed_data
```

### 3. Restart Backend
Restart your uvicorn server to pick up the new DB connection.

**Default Credentials:** `alice@derma.com` / `password123`
