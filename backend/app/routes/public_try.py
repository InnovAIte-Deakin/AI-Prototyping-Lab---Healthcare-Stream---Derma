import tempfile
from pathlib import Path
from typing import Any, Dict

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.schemas import PublicChatRequest, PublicChatResponse
from app.services.gemini_service import gemini_service
from app.services.public_session_store import public_session_store

router = APIRouter(prefix="/public", tags=["Public/Anonymous"])

DEFAULT_DISCLAIMER = (
    "DISCLAIMER: I am an AI assistant. This analysis is for informational purposes only and does NOT constitute a medical diagnosis. "
    "Please consult a medical professional."
)


def _normalize_analysis(raw_result: Dict[str, Any]) -> Dict[str, Any]:
    """Ensure the analysis payload has all fields and sensible defaults."""
    nested = raw_result.get("analysis", {}) if isinstance(raw_result, dict) else {}
    base: Dict[str, Any] = {}
    if isinstance(raw_result, dict):
        base.update(raw_result)
    base.update({k: v for k, v in nested.items() if v is not None})

    characteristics = base.get("characteristics") or []
    if not isinstance(characteristics, list):
        characteristics = [str(characteristics)]

    status_value = base.get("status") or raw_result.get("status") or "success"

    normalized = {
        "status": status_value,
        "condition": base.get("condition") or "Unknown",
        "confidence": float(base.get("confidence") or 0),
        "severity": base.get("severity") or "Unknown",
        "characteristics": characteristics,
        "recommendation": base.get("recommendation") or "Please consult a dermatologist for a full assessment.",
        "disclaimer": base.get("disclaimer") or DEFAULT_DISCLAIMER,
    }

    # Include raw error detail for the UI to show a gentle message if the AI call failed
    if base.get("error"):
        normalized["error"] = base.get("error")

    return normalized


@router.post("/try/analyze")
async def analyze_anonymously(file: UploadFile = File(...)) -> Dict[str, Any]:
    """Allow anonymous users to upload and receive a one-off AI analysis without auth."""
    from app.config import MEDIA_ROOT
    import uuid
    import shutil

    file_bytes = await file.read()
    # await file.close() # Don't close yet if we want to write it again, but we read bytes so it's fine.

    if not file_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file cannot be empty",
        )

    # Setup anonymous storage
    anon_dir = MEDIA_ROOT / "anonymous"
    anon_dir.mkdir(parents=True, exist_ok=True)
    
    suffix = Path(file.filename or "upload.png").suffix or ".png"
    filename = f"{uuid.uuid4().hex}{suffix}"
    file_path = anon_dir / filename

    # Save file persistently (until cleanup)
    with open(file_path, "wb") as f:
        f.write(file_bytes)

    try:
        raw_result = await gemini_service.analyze_skin_lesion(str(file_path))
    except Exception as exc:  # noqa: BLE001 - surface graceful error
        raw_result = {"status": "error", "error": str(exc)}
        # If analysis fails, we might still want to keep the file? 
        # Or maybe not. For now let's keep it simple.

    analysis = _normalize_analysis(raw_result)
    
    # Store session with image path relative to media root or absolute?
    # Storing absolute path for simplicity in backend usage.
    session_id = public_session_store.create_session(analysis, image_path=str(file_path))

    return {"session_id": session_id, **analysis}


@router.post("/try/chat", response_model=PublicChatResponse)
async def chat_preview(payload: PublicChatRequest) -> PublicChatResponse:
    """
    Minimal chat preview for anonymous sessions. Does not use websockets or auth.
    Conversations stay in memory and expire with the session.
    """
    session = public_session_store.get_session(payload.session_id)

    public_session_store.append_message(payload.session_id, "patient", payload.message)

    try:
        reply_text = await gemini_service.chat_about_lesion(
            session["analysis"], payload.message, history=session["messages"]
        )
    except Exception as exc:  # noqa: BLE001 - user-facing fallback
        reply_text = (
            "I'm having trouble answering right now, but your preview analysis recommends speaking with a clinician. "
            f"(Details: {exc})"
        )

    public_session_store.append_message(payload.session_id, "ai", reply_text)

    return PublicChatResponse(
        session_id=payload.session_id,
        reply=reply_text,
        analysis=session["analysis"],
    )
