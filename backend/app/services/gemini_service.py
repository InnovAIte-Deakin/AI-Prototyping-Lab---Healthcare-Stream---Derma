import os
import base64
from pathlib import Path
import google.generativeai as genai
from typing import Dict, Any
import asyncio
from app.config import AI_TIMEOUT_SECONDS

class GeminiService:
    """Service for AI-powered skin lesion analysis using Google Gemini"""
    
    def __init__(self):
        self.api_key = os.getenv("GOOGLE_API_KEY")
        self.is_ready = False
        
        # Check if we are in mock mode
        is_mock = os.getenv("MOCK_AI", "").lower() == "true"
        
        if self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('gemini-2.5-flash')
            self.is_ready = True
        elif is_mock:
            # In mock mode, we don't need the real API key
            self.model = None
            self.is_ready = False
        else:
            print("WARNING: GOOGLE_API_KEY not found. AI features will be unavailable.")
            self.model = None
            raise ValueError("GOOGLE_API_KEY not found")
    
    async def analyze_skin_lesion(self, image_path: str) -> Dict[str, Any]:
        """
        Analyze a skin lesion image and return AI analysis results
        
        Args:
            image_path: Path to the uploaded image file
            
        Returns:
            Dictionary containing analysis results
        """
        try:
            if not self.is_ready:
                return {
                    "status": "error",
                    "error": "API_KEY_MISSING",
                    "message": "AI analysis is currently unavailable (API key not configured)."
                }

            # Read the image file
            with open(image_path, 'rb') as img_file:
                image_data = img_file.read()
            
            # Create the prompt for skin lesion analysis
            prompt = """
            You are a dermatology AI assistant. Analyze this skin lesion image and provide the output in strict JSON format.
            Do not include markdown code blocks (like ```json ... ```) in the response, just the raw JSON string.
            
            The JSON object must have the following structure:
            {
                "condition": "Name of the condition (or 'Unknown' if unclear)",
                "confidence": 0.0 to 100.0 (float representing confidence percentage),
                "severity": "Low", "Moderate", or "High",
                "characteristics": ["feature 1", "feature 2", "feature 3"],
                "recommendation": "Brief recommendation (e.g., 'See a dermatologist soon')",
                "disclaimer": "This is NOT a diagnosis. Professional medical evaluation is required."
            }
            
            Analyze the image carefully before generating the JSON.
            """
            
            # Upload the image to Gemini
            image_parts = [
                {
                    "mime_type": self._get_mime_type(image_path),
                    "data": image_data
                }
            ]
            
            # Generate analysis with timeout
            try:
                response = await asyncio.wait_for(
                    self.model.generate_content_async([prompt, image_parts[0]]),
                    timeout=AI_TIMEOUT_SECONDS
                )
            except asyncio.TimeoutError:
                return {
                    "status": "error",
                    "error": "TIMEOUT",
                    "message": f"AI analysis timed out after {AI_TIMEOUT_SECONDS} seconds."
                }
            
            # Parse and structure the response
            analysis_data = self._parse_json_response(response.text)
            
            return {
                "status": "success",
                "analysis": analysis_data, 
                **analysis_data
            }
            
        except Exception as e:
            print(f"GEMINI ERROR: {e}")
            return {
                "status": "error",
                "error": str(e),
                "message": "Failed to analyze the image. Please try again or consult a healthcare professional."
            }

    async def chat_about_lesion(self, analysis_context: Dict[str, Any], user_message: str, history: list = None) -> str:
        """
        Chat with the AI about a specific lesion analysis.
        
        Args:
            analysis_context: The structured analysis result from a previous run
            user_message: The user's question or comment
            history: Optional list of ChatMessage objects for history
            
        Returns:
            String response from the AI
        """
        try:
            # Construct history string
            history_str = ""
            if history:
                for msg in history:
                    # Map sender roles to clear labels for the AI
                    role_label = "Patient" if msg.sender_role == "patient" else "AI Assistant"
                    if msg.sender_role == "doctor": role_label = "Doctor (Human)"
                    history_str += f"{role_label}: {msg.message}\n"

            context_prompt = f"""
            You are a helpful medical AI assistant. You are discussing a specific skin lesion analysis with a user.
            
            Here is the analysis of the lesion in question:
            Condition: {analysis_context.get('condition', 'Unknown')}
            Confidence: {analysis_context.get('confidence', 0)}%
            Severity: {analysis_context.get('severity', 'Unknown')}
            Characteristics: {', '.join(analysis_context.get('characteristics', []))}
            Recommendation: {analysis_context.get('recommendation', 'N/A')}
            
            Previous Conversation:
            {history_str}
            
            User Message: {user_message}
            
            Please answer the user's question based on the analysis context and history. 
            Be helpful, empathetic, but always remind them that you are an AI and this is not a professional diagnosis if they ask for medical advice.
            Keep your answers concise and relevant to the context. Do not use markdown.
            """
            
            response = await self.model.generate_content_async(context_prompt)
            return response.text
        except Exception as e:
            print(f"GEMINI CHAT ERROR: {e}")
            return "I apologize, but I'm having trouble processing your request right now. Please try again later."

    def _parse_json_response(self, text: str) -> Dict[str, Any]:
        """
        Robustly parse JSON from LLM response, handling markdown blocks if present.
        """
        import json
        import re
        
        cleaned_text = text.strip()
        
        # Remove markdown code blocks if present
        if "```" in cleaned_text:
            # Regex to capture content inside ```json ... ``` or just ``` ... ```
            match = re.search(r"```(?:json)?\s*(.*?)\s*```", cleaned_text, re.DOTALL)
            if match:
                cleaned_text = match.group(1)
        
        try:
            return json.loads(cleaned_text)
        except json.JSONDecodeError:
            print(f"FAILED TO PARSE JSON: {text}")
            # Fallback to a basic structure if parsing fails
            return {
                "condition": "Error parsing result",
                "confidence": 0.0,
                "severity": "Unknown",
                "characteristics": ["Analysis available but format was invalid"],
                "recommendation": "Please consult a doctor.",
                "disclaimer": "System error parsing AI response."
            }

            
    def _get_mime_type(self, file_path: str) -> str:
        """Determine MIME type based on file extension"""
        extension = Path(file_path).suffix.lower()
        mime_types = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp'
        }
        return mime_types.get(extension, 'image/jpeg')


def get_gemini_service():
    """
    Factory function to get the appropriate Gemini service.
    Returns MockGeminiService when MOCK_AI=true (for CI), otherwise real service.
    """
    if os.getenv("MOCK_AI", "").lower() == "true":
        from app.services.mock_gemini_service import MockGeminiService
        return MockGeminiService()
    return gemini_service


# Create singleton instance only if not in mock mode
# This prevents crashes when GOOGLE_API_KEY is not set in CI
if os.getenv("MOCK_AI", "").lower() != "true":
    gemini_service = GeminiService()
else:
    gemini_service = None  # Will use MockGeminiService via factory