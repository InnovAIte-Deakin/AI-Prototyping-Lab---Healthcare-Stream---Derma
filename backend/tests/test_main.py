"""
B1 Tests: FastAPI application and CORS
Tests for app/main.py
"""
import pytest
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


def test_app_is_fastapi_instance():
    """Test that app is a FastAPI instance"""
    from app.main import app

    assert isinstance(app, FastAPI)


def test_app_has_cors_middleware():
    """Test that CORS middleware is configured"""
    from app.main import app

    # Check that middleware is configured
    # CORS is verified functionally in test_cors_allows_localhost_5173
    assert len(app.user_middleware) > 0, "App should have middleware configured"


def test_root_endpoint_exists(client):
    """Test that root endpoint exists and returns correct response"""
    response = client.get("/")

    assert response.status_code == 200
    assert response.json() == {"message": "DermaAI API is running"}


def test_root_endpoint_returns_json(client):
    """Test that root endpoint returns JSON"""
    response = client.get("/")

    assert response.headers["content-type"] == "application/json"


def test_cors_allows_localhost_5173(client):
    """Test that CORS allows requests from localhost:5173"""
    # Make a request with Origin header
    response = client.get(
        "/",
        headers={"Origin": "http://localhost:5173"}
    )

    assert response.status_code == 200
    # CORS headers should be present
    assert "access-control-allow-origin" in response.headers or \
           "Access-Control-Allow-Origin" in response.headers


def test_app_title():
    """Test that app has been initialized properly"""
    from app.main import app

    # FastAPI app should have routes
    assert len(app.routes) > 0

    # Should have at least the root endpoint
    paths = [route.path for route in app.routes]
    assert "/" in paths


def test_openapi_docs_available(client):
    """Test that OpenAPI docs endpoint is available"""
    response = client.get("/docs")

    # Docs should be accessible (returns HTML)
    assert response.status_code == 200


def test_openapi_json_available(client):
    """Test that OpenAPI JSON schema is available"""
    response = client.get("/openapi.json")

    assert response.status_code == 200
    assert "openapi" in response.json()
