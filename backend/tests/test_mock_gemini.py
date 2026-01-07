"""
Tests for the MockGeminiService and get_gemini_service factory.
"""
import pytest
import os
from unittest.mock import patch
import importlib


class TestMockGeminiService:
    """Tests for MockGeminiService."""
    
    @pytest.mark.asyncio
    async def test_analyze_returns_deterministic_response(self):
        """Mock analyze should always return the same structure."""
        from app.services.mock_gemini_service import MockGeminiService
        
        service = MockGeminiService()
        result = await service.analyze_skin_lesion("/fake/path.png")
        
        assert result["status"] == "success"
        assert "condition" in result
        assert "confidence" in result
        assert isinstance(result["confidence"], float)
        assert "severity" in result
        assert "characteristics" in result
        assert isinstance(result["characteristics"], list)
        assert "recommendation" in result
        assert "disclaimer" in result
    
    @pytest.mark.asyncio
    async def test_chat_returns_deterministic_response(self):
        """Mock chat should return a response mentioning the user's message."""
        from app.services.mock_gemini_service import MockGeminiService
        
        service = MockGeminiService()
        context = {"condition": "Test Condition", "confidence": 80}
        
        result = await service.chat_about_lesion(context, "Is this serious?")
        
        assert isinstance(result, str)
        assert len(result) > 0
        # Response should mention the condition from context
        assert "Test Condition" in result or "condition" in result.lower()
    
    @pytest.mark.asyncio
    async def test_mock_responses_are_consistent(self):
        """Mock should return the same response for the same inputs."""
        from app.services.mock_gemini_service import MockGeminiService
        
        service = MockGeminiService()
        
        result1 = await service.analyze_skin_lesion("/path1.png")
        result2 = await service.analyze_skin_lesion("/path2.png")
        
        # Should be structurally identical (deterministic)
        assert result1["condition"] == result2["condition"]
        assert result1["confidence"] == result2["confidence"]


class TestGetGeminiServiceFactory:
    """Tests for the get_gemini_service factory function."""
    
    def test_returns_mock_when_mock_ai_true(self):
        """Factory should return MockGeminiService when MOCK_AI=true."""
        # Set env before importing
        original = os.environ.get("MOCK_AI")
        os.environ["MOCK_AI"] = "true"
        
        try:
            from app.services.mock_gemini_service import MockGeminiService
            
            # Reimport the module to pick up env change
            import app.services.gemini_service as gs_module
            importlib.reload(gs_module)
            
            service = gs_module.get_gemini_service()
            assert isinstance(service, MockGeminiService)
        finally:
            if original:
                os.environ["MOCK_AI"] = original
            elif "MOCK_AI" in os.environ:
                del os.environ["MOCK_AI"]
    
    def test_factory_returns_mock_for_uppercase_TRUE(self):
        """Factory should be case-insensitive for MOCK_AI value."""
        original = os.environ.get("MOCK_AI")
        os.environ["MOCK_AI"] = "TRUE"
        
        try:
            from app.services.mock_gemini_service import MockGeminiService
            
            import app.services.gemini_service as gs_module
            importlib.reload(gs_module)
            
            service = gs_module.get_gemini_service()
            assert isinstance(service, MockGeminiService)
        finally:
            if original:
                os.environ["MOCK_AI"] = original
            elif "MOCK_AI" in os.environ:
                del os.environ["MOCK_AI"]
