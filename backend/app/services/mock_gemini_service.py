"""
Mock Gemini Service for E2E testing without API keys.
Returns deterministic responses for predictable test behavior.
"""
from typing import Dict, Any


class MockGeminiService:
    """
    Mock implementation of GeminiService for E2E testing.
    Activated when MOCK_AI=true environment variable is set.
    """
    
    async def analyze_skin_lesion(self, image_path: str) -> Dict[str, Any]:
        """Return deterministic mock analysis response."""
        return {
            "status": "success",
            "condition": "Mock Condition (E2E Test)",
            "confidence": 85.0,
            "severity": "Low",
            "characteristics": ["symmetric", "uniform color", "regular borders"],
            "recommendation": "Monitor for changes. This is a mock response for testing.",
            "disclaimer": "This is a MOCK response for E2E testing. Not a real diagnosis."
        }
    
    async def chat_about_lesion(
        self, 
        analysis_context: Dict[str, Any], 
        user_message: str, 
        history: list = None
    ) -> str:
        """Return deterministic mock chat response."""
        return f"Mock AI Response: I received your message about the condition. The analysis shows {analysis_context.get('condition', 'a skin condition')} with {analysis_context.get('confidence', 0)}% confidence. Please consult a dermatologist for a professional evaluation."
