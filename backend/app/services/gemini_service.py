import os
import base64
from pathlib import Path
import google.generativeai as genai
from typing import Dict, Any

class GeminiService:
    """Service for AI-powered skin lesion analysis using Google Gemini"""
    
    def __init__(self):
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("GOOGLE_API_KEY not found in environment variables")
        
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-2.5-flash')
    
    def analyze_skin_lesion(self, image_path: str) -> Dict[str, Any]:
        """
        Analyze a skin lesion image and return AI analysis results
        
        Args:
            image_path: Path to the uploaded image file
            
        Returns:
            Dictionary containing analysis results
        """
        try:
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
            
            # Generate analysis
            response = self.model.generate_content([prompt, image_parts[0]])
            
            # Parse and structure the response
            analysis_data = self._parse_json_response(response.text)
            
            return {
                "status": "success",
                "analysis": analysis_data, # For backward compatibility or if we want the full object
                **analysis_data # Flatten for easier access if needed, but keeping structure is better. 
                                # Actually, based on previous code, it returned a dict. 
                                # Let's stick to returning a dict that matches the requested structure + status.
            }
            
        except Exception as e:
            print(f"GEMINI ERROR: {e}")
            return {
                "status": "error",
                "error": str(e),
                "message": "Failed to analyze the image. Please try again or consult a healthcare professional."
            }

    def chat_about_lesion(self, analysis_context: Dict[str, Any], user_message: str) -> str:
        """
        Chat with the AI about a specific lesion analysis.
        
        Args:
            analysis_context: The structured analysis result from a previous run
            user_message: The user's question or comment
            
        Returns:
            String response from the AI
        """
        try:
            context_prompt = f"""
            You are a helpful medical AI assistant. You are discussing a specific skin lesion analysis with a user.
            
            Here is the analysis of the lesion in question:
            Condition: {analysis_context.get('condition', 'Unknown')}
            Severity: {analysis_context.get('severity', 'Unknown')}
            Characteristics: {', '.join(analysis_context.get('characteristics', []))}
            Recommendation: {analysis_context.get('recommendation', 'N/A')}
            
            User Message: {user_message}
            
            Please answer the user's question based on the analysis context. 
            Be helpful, empathetic, but always remind them that you are an AI and this is not a professional diagnosis if they ask for medical advice.
            Keep your answers concise and relevant to the context.
            """
            
            response = self.model.generate_content(context_prompt)
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

async def analyze_with_gemini(image_path: str) -> str:
    """
    Analyze dermatological image using Gemini
    Returns structured analysis
    """
    # Read image
    with open(image_path, 'rb') as f:
        image_data = f.read()
    
    # Structured prompt for consistent output
    prompt = """
    Analyze this dermatological image and provide a structured response in JSON format:
    
    {
        "condition": "Primary skin condition detected",
        "confidence": 0.85,  // Float between 0 and 1
        "recommendation": "Specific clinical recommendation",
        "observations": [
            "Key observation 1",
            "Key observation 2"
        ],
        "severity": "mild|moderate|severe|critical",
        "urgency": "routine|prompt|urgent|emergency"
    }
    
    Important:
    - Be specific about the condition
    - Provide realistic confidence based on image quality
    - Always recommend consulting a dermatologist
    - Note any limitations in the assessment
    """
    
    # Call Gemini API (adjust based on your current implementation)
    response = await gemini_service.model.generate_content_async([prompt, image_data])
    
    return response.text

# gemini_service.py - Add chat function

async def chat_with_context(
    user_message: str, 
    analysis_context: str
) -> str:
    """
    Generate contextual chat response using Gemini
    
    Args:
        user_message: User's question
        analysis_context: System context with analysis results
        
    Returns:
        AI's contextual response
    """
    # Combine context and user message
    full_prompt = f"{analysis_context}\n\n{user_message}"
    
    try:
        # Call Gemini API using the singleton instance's model
        # Use generate_content_async for async context
        response = await gemini_service.model.generate_content_async(full_prompt)
        return response.text
        
    except Exception as e:
        # Fallback response if API fails
        return (
            "I apologize, but I'm having trouble processing your question. "
            "Please try again or consult with a dermatologist directly."
        )
# Create a singleton instance
gemini_service = GeminiService()