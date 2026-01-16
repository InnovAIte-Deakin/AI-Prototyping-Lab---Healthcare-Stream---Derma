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
        payload = response.json()
        assert payload["status"] == "ok"
        assert payload["checks"]["database"] == "ok"
        assert payload["checks"]["env"]["database_url"] is True
        assert payload["checks"]["env"]["secret_key"] is True
    
    def test_health_is_public(self, client: TestClient):
        """Health endpoint should not require authentication."""
        # No auth headers needed
        response = client.get("/health")
        assert response.status_code == 200

    def test_ready_returns_ok(self, client: TestClient):
        """Ready endpoint should return status ok."""
        response = client.get("/ready")
        assert response.status_code == 200
        payload = response.json()
        assert payload["status"] == "ok"
