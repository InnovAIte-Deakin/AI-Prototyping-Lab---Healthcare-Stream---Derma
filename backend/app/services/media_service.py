from __future__ import annotations

from datetime import datetime, timedelta, timezone
import logging
from pathlib import Path, PurePosixPath
from typing import Optional
from urllib.parse import unquote, urlparse

from fastapi import HTTPException, status
from jose import JWTError, jwt

from app.config import (
    ALGORITHM,
    MEDIA_ROOT,
    MEDIA_URL,
    MEDIA_URL_TTL_SECONDS,
    SECRET_KEY,
)

logger = logging.getLogger("app.media")


def normalize_media_path(raw_path: str) -> str:
    """
    Normalize a media path to a relative POSIX path under MEDIA_ROOT.
    """
    if not raw_path:
        logger.warning("media.path.missing")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing media path",
        )

    parsed = urlparse(raw_path)
    path = parsed.path if parsed.scheme or parsed.netloc else raw_path
    path = unquote(path)

    if path.startswith(MEDIA_URL):
        path = path[len(MEDIA_URL):]

    path = path.lstrip("/").replace("\\", "/")
    posix_path = PurePosixPath(path)

    if ".." in posix_path.parts or path == "":
        logger.warning(
            "media.path.invalid",
            extra={"path": posix_path.as_posix()},
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid media path",
        )

    return posix_path.as_posix()


def _media_path_from_absolute(path: Path) -> str:
    try:
        relative = path.resolve().relative_to(MEDIA_ROOT.resolve())
    except ValueError as exc:
        logger.warning("media.path.outside_root")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Media path is outside the media root",
        ) from exc
    return PurePosixPath(relative).as_posix()


def resolve_media_path(raw_path: str) -> Path:
    """
    Resolve a stored media path to an absolute path under MEDIA_ROOT.
    """
    candidate = Path(raw_path)
    if candidate.is_absolute():
        relative = _media_path_from_absolute(candidate)
        candidate = MEDIA_ROOT / relative
    else:
        relative = normalize_media_path(raw_path)
        candidate = MEDIA_ROOT / relative

    candidate = candidate.resolve()
    if not candidate.exists():
        logger.warning(
            "media.path.not_found",
            extra={"path": candidate.as_posix()},
        )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Media file not found",
        )

    return candidate


def create_media_token(media_path: str, expires_in_seconds: Optional[int] = None) -> str:
    """
    Create a signed token for a media path that expires after a short TTL.
    """
    normalized = normalize_media_path(media_path)
    ttl = expires_in_seconds or MEDIA_URL_TTL_SECONDS
    payload = {
        "path": normalized,
        "scope": "media",
        "exp": datetime.now(timezone.utc) + timedelta(seconds=ttl),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def verify_media_token(token: str, media_path: str) -> bool:
    """
    Validate that the token matches the requested media path.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return False

    if payload.get("scope") != "media":
        return False

    try:
        normalized = normalize_media_path(media_path)
    except HTTPException:
        return False

    return payload.get("path") == normalized


def create_signed_media_url(media_path: str) -> str:
    """
    Build a signed URL that can be safely shared for short-lived access.
    """
    normalized = normalize_media_path(media_path)
    token = create_media_token(normalized)
    return f"{MEDIA_URL}/{normalized}?token={token}"


def safe_remove_media_file(raw_path: str) -> bool:
    """
    Delete a media file if it is under MEDIA_ROOT. Returns True if removed.
    """
    if not raw_path:
        return False

    try:
        candidate = Path(raw_path)
        if candidate.is_absolute():
            relative = _media_path_from_absolute(candidate)
            candidate = MEDIA_ROOT / relative
        else:
            relative = normalize_media_path(raw_path)
            candidate = MEDIA_ROOT / relative

        candidate = candidate.resolve()
    except HTTPException:
        logger.warning("media.delete.invalid_path")
        return False

    if not candidate.exists():
        return False

    try:
        candidate.unlink()
        return True
    except OSError:
        logger.exception("media.delete_failed", extra={"path": candidate.as_posix()})
        return False
