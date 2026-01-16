import contextvars
import json
import logging
import sys
import time
import uuid
from datetime import datetime, timezone

from fastapi import Request

from app.config import LOG_LEVEL

REQUEST_ID_HEADER = "X-Request-ID"

_request_id_ctx = contextvars.ContextVar("request_id", default=None)


def get_request_id() -> str | None:
    return _request_id_ctx.get()


class RequestIdFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = get_request_id() or "-"
        return True


class JsonLogFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "level": record.levelname.lower(),
            "logger": record.name,
            "message": record.getMessage(),
            "request_id": getattr(record, "request_id", None),
        }

        reserved = {
            "name",
            "msg",
            "args",
            "levelname",
            "levelno",
            "pathname",
            "filename",
            "module",
            "exc_info",
            "exc_text",
            "stack_info",
            "lineno",
            "funcName",
            "created",
            "msecs",
            "relativeCreated",
            "thread",
            "threadName",
            "processName",
            "process",
            "message",
            "asctime",
        }

        for key, value in record.__dict__.items():
            if key in reserved or key in payload or key.startswith("_"):
                continue
            try:
                json.dumps(value, ensure_ascii=True)
                payload[key] = value
            except TypeError:
                payload[key] = str(value)

        if record.exc_info:
            payload["exc_info"] = self.formatException(record.exc_info)

        return json.dumps(payload, ensure_ascii=True)


def configure_logging() -> None:
    level_name = LOG_LEVEL.upper()
    level = logging._nameToLevel.get(level_name, logging.INFO)

    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(level)
    handler.setFormatter(JsonLogFormatter())
    handler.addFilter(RequestIdFilter())

    root_logger = logging.getLogger()
    root_logger.setLevel(level)
    root_logger.handlers = [handler]

    for logger_name in ("uvicorn", "uvicorn.error", "uvicorn.access"):
        uv_logger = logging.getLogger(logger_name)
        uv_logger.handlers = [handler]
        uv_logger.setLevel(level)
        uv_logger.propagate = False


async def request_id_middleware(request: Request, call_next):
    request_id = request.headers.get(REQUEST_ID_HEADER) or str(uuid.uuid4())
    token = _request_id_ctx.set(request_id)
    start = time.perf_counter()
    request.state.request_id = request_id

    try:
        response = await call_next(request)
    except Exception:
        duration_ms = round((time.perf_counter() - start) * 1000, 2)
        logging.getLogger("app.request").exception(
            "request.failed",
            extra={
                "event": "request.failed",
                "method": request.method,
                "path": request.url.path,
                "status_code": 500,
                "duration_ms": duration_ms,
                "client_ip": request.client.host if request.client else None,
            },
        )
        _request_id_ctx.reset(token)
        raise

    duration_ms = round((time.perf_counter() - start) * 1000, 2)
    response.headers[REQUEST_ID_HEADER] = request_id

    logging.getLogger("app.request").info(
        "request.complete",
        extra={
            "event": "request.complete",
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "duration_ms": duration_ms,
            "client_ip": request.client.host if request.client else None,
        },
    )

    _request_id_ctx.reset(token)
    return response
