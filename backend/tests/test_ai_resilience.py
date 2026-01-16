import pytest
import asyncio
from unittest.mock import Mock, patch, MagicMock, AsyncMock
from app.services.gemini_service import GeminiService
from app.main import app
from app.models import User
from app.auth_helpers import get_current_user
import os

@pytest.mark.asyncio
async def test_gemini_timeout(test_db):
    """Test that GeminiService handles timeouts correctly."""
    with patch.dict(os.environ, {'GOOGLE_API_KEY': 'test_key'}):
        service = GeminiService()
        
        # Mock the model's async method to never return
        mock_model = MagicMock()
        # Side effect that sleeps longer than our timeout
        async def slow_generate(*args, **kwargs):
            await asyncio.sleep(1)
            return Mock()
            
        mock_model.generate_content_async = AsyncMock(side_effect=slow_generate)
        service.model = mock_model
        
        # Patch the timeout value where it's imported in gemini_service
        with patch('app.services.gemini_service.AI_TIMEOUT_SECONDS', 0.001):
            result = await service.analyze_skin_lesion('test_image.jpg')
            
            assert result['status'] == 'error'
            assert result['error'] == 'TIMEOUT'
            assert "timed out" in result['message']

@pytest.mark.asyncio
async def test_gemini_missing_key():
    """Test that GeminiService handles missing API key gracefully."""
    with patch.dict(os.environ, {}, clear=True):
        service = GeminiService()
        assert service.is_ready is False
        
        result = await service.analyze_skin_lesion('test_image.jpg')
        assert result['status'] == 'error'
        assert result['error'] == 'API_KEY_MISSING'

def test_analysis_route_fallback(client, test_db):
    """Test that the analysis endpoint creates a fallback report on AI error."""
    # 1. Create a doctor first (needed for foreign key on Image)
    dr_response = client.post(
        "/auth/signup",
        json={"email": "dr@test.com", "password": "password123", "role": "doctor"},
    )
    doctor_id = dr_response.json()["user_id"]

    # 2. Create patient
    p_response = client.post(
        "/auth/signup",
        json={"email": "fallback@test.com", "password": "password123", "role": "patient"},
    )
    patient_id = p_response.json()["user_id"]
    
    # 3. Create image in DB and physical file
    from app.models import Image
    from app.config import MEDIA_ROOT
    
    file_name = "resilience_test.png"
    file_path = MEDIA_ROOT / file_name
    file_path.write_bytes(b"fake image data")
    
    image = Image(patient_id=patient_id, doctor_id=doctor_id, image_url=file_name)
    test_db.add(image)
    test_db.commit()
    test_db.refresh(image)

    try:
        user = User(id=patient_id, role="patient", email="fallback@test.com")
        app.dependency_overrides[get_current_user] = lambda: user

        # 4. Mock GeminiService to return TIMEOUT
        mock_service = MagicMock()
        mock_service.analyze_skin_lesion = AsyncMock(return_value={
            "status": "error",
            "error": "TIMEOUT",
            "message": "Timed out"
        })
        
        with patch('app.routes.analysis.get_gemini_service', return_value=mock_service):
            url = f"/api/analysis/{image.id}"
            print(f"DEBUG: Testing URL: {url}")
            response = client.post(url)
            
            app.dependency_overrides.pop(get_current_user, None)
            
            if response.status_code != 200:
                print(f"DEBUG: Response status: {response.status_code}")
                print(f"DEBUG: Response detail: {response.json()}")
                
            assert response.status_code == 200 # We return 200 with fallback data
            data = response.json()
            assert data["status"] == "error"
            assert data["is_fallback"] is True
            assert "Analysis Unavailable" in data["condition"]
            assert "report_id" in data
    finally:
        if file_path.exists():
            file_path.unlink()
