import logging
import os
from typing import Any, Dict, Tuple

from fastapi import status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import DATABASE_URL, GOOGLE_API_KEY, SECRET_KEY

logger = logging.getLogger("app.health")


def _check_database(db: Session) -> bool:
    try:
        db.execute(text("SELECT 1"))
        return True
    except Exception:
        logger.exception("health.database_check_failed")
        return False


def _check_env() -> Dict[str, bool]:
    mock_ai = os.getenv("MOCK_AI", "").lower() == "true"
    return {
        "database_url": bool(DATABASE_URL),
        "google_api_key": bool(GOOGLE_API_KEY) or mock_ai,
        "secret_key": bool(SECRET_KEY),
    }


def get_health_response(db: Session) -> Tuple[Dict[str, Any], int]:
    env_checks = _check_env()
    database_ok = _check_database(db)
    env_ok = all(env_checks.values())
    mock_ai = os.getenv("MOCK_AI", "").lower() == "true"

    status_label = "ok" if database_ok and env_ok else "degraded"
    payload = {
        "status": status_label,
        "checks": {
            "database": "ok" if database_ok else "error",
            "env": env_checks,
        },
        "mock_ai": mock_ai,
    }
    http_status = (
        status.HTTP_200_OK
        if status_label == "ok"
        else status.HTTP_503_SERVICE_UNAVAILABLE
    )
    return payload, http_status
