import mimetypes

from fastapi import APIRouter, HTTPException, Query, status
from fastapi.responses import FileResponse

from app.config import MEDIA_URL_TTL_SECONDS
from app.services.media_service import resolve_media_path, verify_media_token

router = APIRouter(prefix="/media", tags=["Media"])


@router.get("/{media_path:path}")
def get_media_file(media_path: str, token: str = Query(default=None)) -> FileResponse:
    """
    Serve protected media files using a short-lived signed token.
    """
    if not token or not verify_media_token(token, media_path):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or missing media token",
        )

    file_path = resolve_media_path(media_path)
    media_type, _ = mimetypes.guess_type(str(file_path))
    headers = {"Cache-Control": f"private, max-age={MEDIA_URL_TTL_SECONDS}"}
    return FileResponse(
        path=file_path,
        media_type=media_type or "application/octet-stream",
        headers=headers,
    )
