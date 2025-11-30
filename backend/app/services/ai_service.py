import os
import base64
from pathlib import Path
import google.generativeai as genai
from typing import Dict, Any

class AIService:
    """Service for AI-powered skin lesion analysis using Google Gemini"""
    
    def __init__(self):
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("GOOGLE_API_KEY not found in environment variables")
        
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-1.5-flash')
    
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
            You are a dermatology AI assistant. Analyze this skin lesion image and provide:
            
            1. **Preliminary Assessment**: What type of skin condition might this be?
            2. **Key Characteristics**: Describe visible features (color, texture, size, borders, symmetry)
            3. **Severity Level**: Rate as Low, Moderate, or High concern
            4. **Recommendations**: Should the patient see a dermatologist urgently, soon, or for routine checkup?
            5. **Important Disclaimer**: This is NOT a diagnosis. Professional medical evaluation is required.
            
            Provide your response in a clear, structured format.
            Be cautious and err on the side of recommending professional consultation.
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
            analysis_result = {
                "status": "success",
                "analysis": response.text,
                "model_used": "gemini-1.5-flash",
                "disclaimer": "This analysis is for preliminary information only and does not constitute medical advice. Please consult a qualified dermatologist for proper diagnosis and treatment."
            }
            
            return analysis_result
            
        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "message": "Failed to analyze the image. Please try again or consult a healthcare professional."
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

# Create a singleton instance
ai_service = AIService()