from datetime import datetime, timedelta, timezone
from fastapi import HTTPException
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.config import MEDIA_ROOT
from app.services.public_session_store import PublicSessionStore
from app.services.public_session_store import public_session_store


@pytest.fixture(autouse=True)
def clear_public_sessions():
    public_session_store.clear()
    yield
    public_session_store.clear()


def get_mock_gemini_service():
    """Create a mock gemini service for testing."""
    mock_service = MagicMock()
    
    async def _fake_analyze(_: str):
        return {
            "status": "success",
            "analysis": {
                "condition": "Benign lesion",
                "confidence": 72.5,
                "severity": "Low",
                "characteristics": ["flat"],
                "recommendation": "Monitor at home",
                "disclaimer": "demo",
            },
        }
    
    mock_service.analyze_skin_lesion = AsyncMock(side_effect=_fake_analyze)
    return mock_service


def test_public_analyze_returns_session_and_analysis(client):
    mock_service = get_mock_gemini_service()
    
    with patch("app.routes.public_try.get_gemini_service", return_value=mock_service):
        response = client.post(
            "/public/try/analyze",
            files={"file": ("lesion.png", b"fake-bytes", "image/png")},
        )

    assert response.status_code == 200
    payload = response.json()
    assert payload["session_id"]
    assert payload["condition"] == "Benign lesion"
    assert payload["status"] == "success"
    assert payload["recommendation"]


def test_public_chat_uses_session_history(client):
    mock_service = get_mock_gemini_service()
    
    async def _fake_chat(context, message, history=None):
        assert context["condition"] == "Benign lesion"
        assert history and len(history) == 1
        assert history[0].message == "Hi"
        return "AI preview response"
    
    mock_service.chat_about_lesion = AsyncMock(side_effect=_fake_chat)

    with patch("app.routes.public_try.get_gemini_service", return_value=mock_service):
        analysis_res = client.post(
            "/public/try/analyze",
            files={"file": ("lesion.png", b"fake-bytes", "image/png")},
        )
        session_id = analysis_res.json()["session_id"]

        chat_res = client.post(
            "/public/try/chat",
            json={"session_id": session_id, "message": "Hi"},
        )

    assert chat_res.status_code == 200
    payload = chat_res.json()
    assert payload["session_id"] == session_id
    assert payload["reply"] == "AI preview response"
    assert payload["analysis"]["condition"] == "Benign lesion"


def test_public_chat_rejects_missing_session(client):
    response = client.post(
        "/public/try/chat",
        json={"session_id": "missing", "message": "Hello"},
    )

    assert response.status_code == 404


def test_public_session_cleanup_removes_file():
    store = PublicSessionStore(ttl_minutes=20)
    anon_dir = MEDIA_ROOT / "anonymous"
    anon_dir.mkdir(parents=True, exist_ok=True)
    file_path = anon_dir / "cleanup_test.png"
    file_path.write_bytes(b"fake-bytes")

    session_id = store.create_session(
        {"status": "success"},
        image_path=f"anonymous/{file_path.name}",
    )
    store.sessions[session_id]["created_at"] = datetime.now(timezone.utc) - timedelta(minutes=30)

    with pytest.raises(HTTPException):
        store.get_session(session_id)

    assert not file_path.exists()
