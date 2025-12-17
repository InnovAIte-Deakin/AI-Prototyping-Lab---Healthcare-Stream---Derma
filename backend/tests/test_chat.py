import pytest
import json
from app.models import AnalysisReport

def test_chat_endpoint_success(client, db_session, sample_image, mocker):
    """Test successful chat interaction"""
    # Create analysis report for the image
    report_data = {
        "condition": "Test Condition",
        "confidence": 0.95,
        "recommendation": "Test Recommendation",
        "analysis": {"detailed": "data"}
    }
    
    report = AnalysisReport(
        image_id=sample_image.id,
        condition="Test Condition",
        confidence=0.95,
        recommendation="Test Recommendation",
        report_json=json.dumps(report_data)
    )
    db_session.add(report)
    db_session.commit()

    # Mock Gemini service
    mocker.patch("app.routes.chat.chat_with_context", return_value="AI Response")
    response = client.post(
            f"/analysis/{sample_image.id}/chat",
            json={"message": "What should I do?"}
        )
    assert response.status_code == 200
    data = response.json()
    assert "ai_response" in data
    assert data["ai_response"] == "AI Response"
    assert data["context_used"] is True

def test_chat_endpoint_missing_image(client):
    """Test chat with non-existent image"""
    response = client.post(
        "/analysis/99999/chat",
        json={"message": "Test"}
    )
    assert response.status_code == 404

def test_chat_endpoint_empty_message(client, sample_image):
    """Test chat with empty message"""
    response = client.post(
        f"/analysis/{sample_image.id}/chat",
        json={"message": ""}
    )
    assert response.status_code == 422  # Validation error