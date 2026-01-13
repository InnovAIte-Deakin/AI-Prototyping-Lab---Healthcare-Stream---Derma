"""
Tests for the health check endpoint.
"""
import pytest
from fastapi.testclient import TestClient


class TestHealthEndpoint:
    """Tests for /health endpoint."""
    
    def test_health_returns_ok(self, client: TestClient):
        """Health endpoint should return status ok."""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}
    
    def test_health_is_public(self, client: TestClient):
        """Health endpoint should not require authentication."""
        # No auth headers needed
        response = client.get("/health")
        assert response.status_code == 200
