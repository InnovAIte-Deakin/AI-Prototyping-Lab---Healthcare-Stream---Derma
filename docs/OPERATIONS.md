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
