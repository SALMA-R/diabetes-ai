"""
Pre-load the ML model once for the entire test session.
TestClient used without context manager does not trigger the async lifespan,
so we call ml_service.load() directly here.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.ml_service import ml_service


def pytest_configure(config):
    """Load ML model before any test is collected."""
    ml_service.load()


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:
        yield c
