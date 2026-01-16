import pytest
from unittest.mock import Mock, patch, MagicMock, AsyncMock
from app.services.gemini_service import GeminiService
import os


class TestGeminiService:
    """Unit tests for Gemini Service"""
    
    @patch('app.services.gemini_service.genai')
    def test_gemini_service_initialization(self, mock_genai):
        """Test that Gemini service initializes correctly with API key"""
        with patch.dict(os.environ, {'GOOGLE_API_KEY': 'test_key'}):
            service = GeminiService()
            mock_genai.configure.assert_called_once_with(api_key='test_key')
    
    def test_gemini_service_missing_api_key(self):
        """Test that Gemini service raises ValueError when API key is missing"""
        with patch.dict(os.environ, {}, clear=True):
            with pytest.raises(ValueError, match="GOOGLE_API_KEY not found"):
                GeminiService()
    
    @patch('app.services.gemini_service.genai')
    def test_get_mime_type(self, mock_genai):
        """Test MIME type detection for different file extensions"""
        with patch.dict(os.environ, {'GOOGLE_API_KEY': 'test_key'}):
            service = GeminiService()
            
            assert service._get_mime_type('image.jpg') == 'image/jpeg'
            assert service._get_mime_type('image.jpeg') == 'image/jpeg'
            assert service._get_mime_type('image.png') == 'image/png'
            assert service._get_mime_type('image.gif') == 'image/gif'
            assert service._get_mime_type('image.webp') == 'image/webp'
            assert service._get_mime_type('image.unknown') == 'image/jpeg'  # default
    
    @pytest.mark.asyncio
    @patch('app.services.gemini_service.genai')
    @patch('builtins.open', create=True)
    async def test_analyze_skin_lesion_success(self, mock_open, mock_genai):
        """Test successful skin lesion analysis"""
        # Setup mocks
        with patch.dict(os.environ, {'GOOGLE_API_KEY': 'test_key'}):
            mock_file = MagicMock()
            mock_file.read.return_value = b'fake_image_data'
            mock_open.return_value.__enter__.return_value = mock_file
            
            mock_response = Mock()
            mock_response.text = "Preliminary Assessment: Possible melanoma"
            
            mock_model = MagicMock()
            # Mock async generation
            mock_model.generate_content_async = AsyncMock(return_value=mock_response)
            mock_genai.GenerativeModel.return_value = mock_model
            
            # Execute
            service = GeminiService()
            result = await service.analyze_skin_lesion('test_image.jpg')
            
            # Verify
            assert result['status'] == 'success'
            assert 'analysis' in result
            assert 'confidence' in result  # Part of fallback parsing if plain text
            
            mock_model.generate_content_async.assert_called_once()
    
    @pytest.mark.asyncio
    @patch('app.services.gemini_service.genai')
    @patch('builtins.open', side_effect=FileNotFoundError)
    async def test_analyze_skin_lesion_file_not_found(self, mock_open, mock_genai):
        """Test analysis when image file doesn't exist"""
        with patch.dict(os.environ, {'GOOGLE_API_KEY': 'test_key'}):
            service = GeminiService()
            result = await service.analyze_skin_lesion('nonexistent.jpg')
            
            assert result['status'] == 'error'
            assert 'error' in result
            assert 'message' in result
    
    @pytest.mark.asyncio
    @patch('app.services.gemini_service.genai')
    @patch('builtins.open', create=True)
    async def test_analyze_skin_lesion_api_error(self, mock_open, mock_genai):
        """Test analysis when Gemini API fails"""
        with patch.dict(os.environ, {'GOOGLE_API_KEY': 'test_key'}):
            mock_file = MagicMock()
            mock_file.read.return_value = b'fake_image_data'
            mock_open.return_value.__enter__.return_value = mock_file
            
            mock_model = MagicMock()
            # Mock async failure
            mock_model.generate_content_async = AsyncMock(side_effect=Exception("API Error"))
            mock_genai.GenerativeModel.return_value = mock_model
            
            service = GeminiService()
            result = await service.analyze_skin_lesion('test_image.jpg')
            
            assert result['status'] == 'error'
            assert 'API Error' in result['error']