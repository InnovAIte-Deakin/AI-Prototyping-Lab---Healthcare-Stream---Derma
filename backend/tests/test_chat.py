import pytest
import json
from unittest.mock import AsyncMock, patch
from app.models import AnalysisReport
from app.main import app
from app.auth_helpers import get_current_user

def test_chat_endpoint_success(client, db_session, sample_image, sample_user):
    """Test successful chat interaction"""
    # Override auth - use get_current_user since chat endpoint uses that dependency
    app.dependency_overrides[get_current_user] = lambda: sample_user

    try:
        # Create analysis report for the image
        report_data = {
            "condition": "Test Condition",
            "confidence": 0.95,
            "recommendation": "Test Recommendation",
            "analysis": {"detailed": "data"}
        }
        
        report = AnalysisReport(
            image_id=sample_image.id,
            patient_id=sample_user.id,
            condition="Test Condition",
            confidence=0.95,
            recommendation="Test Recommendation",
            report_json=json.dumps(report_data)
        )
        db_session.add(report)
        db_session.commit()

        # Mock Gemini service
        # Note: We must patch the INSTANCE 'gemini_service' used in the route
        with patch("app.routes.analysis.gemini_service.chat_about_lesion", new_callable=AsyncMock) as mock_chat:
            mock_chat.return_value = "AI Response"
            
            response = client.post(
                f"/api/analysis/{sample_image.id}/chat",
                json={"message": "What should I do?"}
            )
            
            assert response.status_code == 200
            data = response.json()
            assert "ai_response" in data
            assert data["ai_response"] == "AI Response"
            assert data["context_used"] is True
    finally:
        app.dependency_overrides = {}

def test_chat_endpoint_missing_image(client, sample_user):
    """Test chat with non-existent image"""
    app.dependency_overrides[get_current_user] = lambda: sample_user
    try:
        response = client.post(
            "/api/analysis/99999/chat",
            json={"message": "Test"}
        )
        assert response.status_code == 404
    finally:
        app.dependency_overrides = {}

def test_chat_endpoint_empty_message(client, sample_image, sample_user):
    """Test chat with empty message"""
    app.dependency_overrides[get_current_user] = lambda: sample_user
    try:
        # Create dummy report to pass initial checks if needed, or endpoint validates body first
        # Chat endpoint fetches report first.
        # But 422 usually comes from Pydantic validation before logic.
        response = client.post(
            f"/api/analysis/{sample_image.id}/chat",
            json={"message": ""}
        )
        assert response.status_code == 422  # Validation error
    finally:
        app.dependency_overrides = {}