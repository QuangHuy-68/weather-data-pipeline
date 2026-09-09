import pytest

from fastapi.testclient import TestClient
from src.api.main import app

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()
    assert response.json()["docs_url"] == "/docs"

def test_health_endpoint():
    response = client.get("/health")

    assert response.status_code in [200, 503]

    if response.status_code == 200:
        data = response.json()
        assert data["status"] == "healthy"
        assert "total_records" in data

def test_docs_accessible():
    response = client.get("/docs")
    assert response.status_code == 200