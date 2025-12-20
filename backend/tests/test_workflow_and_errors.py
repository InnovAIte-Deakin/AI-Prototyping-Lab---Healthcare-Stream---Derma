import pytest
import json
from unittest.mock import patch, AsyncMock
from fastapi import status
from app.models import AnalysisReport, Image
from app.services.auth import create_access_token

class TestWorkflowAndErrors:

    @pytest.mark.asyncio
    @patch('app.routes.analysis.gemini_service.analyze_skin_lesion', new_callable=AsyncMock)
    async def test_quota_error_handling(self, mock_analyze, client, db_session, sample_user):
        """Test that a 429 quota error results in a Service Unavailable report, not a 500 crash."""
        
        # Setup mock to return error
        mock_analyze.return_value = {
            "status": "error",
            "error": "429 Quota Exceeded"
        }
        
        # Create image
        image = Image(patient_id=sample_user.id, image_url="/media/test.jpg")
        db_session.add(image)
        db_session.commit()
        db_session.refresh(image)

        # Mock resolve_image_path to assume file exists
        with patch('app.routes.analysis._resolve_image_path') as mock_path:
            with patch('os.path.exists', return_value=True):
                mock_path.return_value = "/tmp/test.jpg"
                
                # Make request
                token = create_access_token({"sub": str(sample_user.id)})
                headers = {"Authorization": f"Bearer {token}"}
                response = client.post(f"/api/analysis/{image.id}", headers=headers)
                
                # Should be 200 OK because we fallback gracefully
                assert response.status_code == status.HTTP_200_OK
                data = response.json()
                
                assert data["status"] == "error"
                assert "Service Unavailable" in data["condition"]
                assert "Quota Exceeded" in data["recommendation"]
                
                # Verify report saved in DB
                reports = db_session.query(AnalysisReport).filter(AnalysisReport.image_id == image.id).all()
                assert len(reports) == 1
                assert "Service Unavailable" in reports[0].report_json

    def test_latest_report_fetch(self, client, db_session, sample_user, sample_image):
        """Test that GET /api/analysis/{image_id} returns the LATEST report."""
        from datetime import datetime
        
        # Create Old Report
        old_report = AnalysisReport(
            image_id=sample_image.id,
            patient_id=sample_user.id,
            report_json='{"condition": "Old Report", "confidence": 10}',
            created_at=datetime(2024, 1, 1, 10, 0, 0)
        )
        db_session.add(old_report)
        db_session.commit()
        
        # Create New Report
        new_report = AnalysisReport(
            image_id=sample_image.id,
            patient_id=sample_user.id,
            report_json='{"condition": "New Quota Error", "confidence": 0}',
            created_at=datetime(2025, 1, 1, 10, 0, 0)
        )
        db_session.add(new_report)
        db_session.commit()

        # Fetch
        token = create_access_token({"sub": str(sample_user.id)})
        headers = {"Authorization": f"Bearer {token}"}
        
        # Note: path is /api/analysis/image/{id} based on my conflict resolution choice
        response = client.get(f"/api/analysis/image/{sample_image.id}", headers=headers)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        # Should match NEW report
        assert data["condition"] == "New Quota Error"
        # Verify it has correct report_id
        assert data["report_id"] == new_report.id
