import pytest
from unittest.mock import AsyncMock

from app.services.public_session_store import public_session_store


@pytest.fixture(autouse=True)
def clear_public_sessions():
    public_session_store.clear()
    yield
    public_session_store.clear()


def mock_analysis(monkeypatch):
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

    monkeypatch.setattr(
        "app.routes.public_try.gemini_service.analyze_skin_lesion",
        AsyncMock(side_effect=_fake_analyze),
    )


def test_public_analyze_returns_session_and_analysis(client, monkeypatch):
    mock_analysis(monkeypatch)

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


def test_public_chat_uses_session_history(client, monkeypatch):
    mock_analysis(monkeypatch)

    async def _fake_chat(context, message, history=None):
        assert context["condition"] == "Benign lesion"
        assert history and len(history) == 1
        assert history[0].message == "Hi"
        return "AI preview response"

    monkeypatch.setattr(
        "app.routes.public_try.gemini_service.chat_about_lesion",
        AsyncMock(side_effect=_fake_chat),
    )

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
