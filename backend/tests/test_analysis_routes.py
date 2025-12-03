import pytest
from unittest.mock import patch, Mock
import os
from app.models import Image


class TestAnalysisRoutes:
    """Integration tests for analysis API endpoints"""
    
    @patch('app.routes.analysis.ai_service.analyze_skin_lesion')
    @patch('os.path.exists')
    def test_analyze_image_success(self, mock_exists, mock_analyze, client, sample_image):
        """Test successful image analysis"""
        # Setup mocks
        mock_exists.return_value = True
        mock_analyze.return_value = {
            'status': 'success',
            'analysis': 'Test analysis result',
            'model_used': 'gemini-1.5-flash',
            'disclaimer': 'Test disclaimer'
        }
        
        # Execute
        response = client.post(f"/api/analysis/{sample_image.id}")
        
        # Verify
        assert response.status_code == 200
        data = response.json()
        assert data['status'] == 'success'
        assert 'analysis' in data
        assert data['model_used'] == 'gemini-1.5-flash'
        mock_analyze.assert_called_once()
    
    def test_analyze_image_not_found(self, client):
        """Test analysis of non-existent image"""
        response = client.post("/api/analysis/99999")
        
        assert response.status_code == 404
        assert 'not found' in response.json()['detail'].lower()
    
    @patch('os.path.exists')
    def test_analyze_image_file_missing(self, mock_exists, client, sample_image):
        """Test analysis when image file is missing from filesystem"""
        mock_exists.return_value = False
        
        response = client.post(f"/api/analysis/{sample_image.id}")
        
        assert response.status_code == 404
        assert 'file not found' in response.json()['detail'].lower()
    
    @patch('app.routes.analysis.ai_service.analyze_skin_lesion')
    @patch('os.path.exists')
    def test_analyze_image_ai_error(self, mock_exists, mock_analyze, client, sample_image):
        """Test analysis when AI service fails"""
        mock_exists.return_value = True
        mock_analyze.return_value = {
            'status': 'error',
            'message': 'Analysis failed'
        }
        
        response = client.post(f"/api/analysis/{sample_image.id}")
        
        assert response.status_code == 500
    
    def test_get_analysis_success(self, client, db_session, sample_image):
        """Test retrieving existing analysis"""
        # Add analysis to the image
        from app.models import AnalysisReport
        import json
        
        analysis_content = {
            "status": "success",
            "analysis": "Previous analysis result",
            "model_used": "gemini-1.5-flash",
            "disclaimer": "Test disclaimer"
        }
        
        report = AnalysisReport(
            image_id=sample_image.id,
            patient_id=sample_image.patient_id,
            report_json=json.dumps(analysis_content)
        )
        db_session.add(report)
        db_session.commit()
        
        response = client.get(f"/api/analysis/{sample_image.id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data['status'] == 'success'
        assert data['analysis'] == "Previous analysis result"
        assert data['image_id'] == sample_image.id
    
    def test_get_analysis_not_found(self, client):
        """Test retrieving analysis for non-existent image"""
        response = client.get("/api/analysis/99999")
        
        assert response.status_code == 404
    
    def test_get_analysis_no_analysis_exists(self, client, sample_image):
        """Test retrieving analysis when none exists"""
        response = client.get(f"/api/analysis/{sample_image.id}")
        
        assert response.status_code == 404
        assert 'no analysis found' in response.json()['detail'].lower()