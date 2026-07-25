import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.config import Settings

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c

def test_cors_origins_property():
    settings = Settings(
        arbiter_secret_key="secret-key-must-be-long-enough-32-chars",
        arbiter_master_key="b1NfZ2VuX2tleV9mb3JfZmVybmV0X3NlY3JldA==", # 32 bytes base64
        pii_service_key="pii-service-key-long-enough-32-chars",
        admin_api_key="admin-api-key-long-enough-32-chars",
        database_url="postgresql+asyncpg://user:pass@host:5432/db",
        cors_allowed_origins="http://localhost:3000, http://localhost:8080,  https://test.example.com  "
    )
    assert settings.cors_origins_list == [
        "http://localhost:3000",
        "http://localhost:8080",
        "https://test.example.com"
    ]
