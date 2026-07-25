"""
config.py
=========
Central configuration for the Foretyx Data Plane.
All values loaded from environment variables via Pydantic Settings.
No hardcoded secrets — ever.
"""

from pydantic_settings import BaseSettings
from pydantic import Field, SecretStr, field_validator
from typing import List
from cryptography.fernet import Fernet


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    Override any value by setting the corresponding env var or adding it to .env.
    """

    # ── Arbiter Security ───────────────────────────────────────────────────────
    arbiter_secret_key: SecretStr = Field(
        ..., description="Secret key for JWT signing"
    )
    arbiter_master_key: SecretStr = Field(
        ..., description="Fernet master key for data encryption (32-byte URL-safe base64)"
    )

    # ── PII Service ────────────────────────────────────────────────────────────
    pii_service_url: str = Field(
        "http://pii-service:8001", description="PII detection service URL"
    )
    pii_service_key: SecretStr = Field(
        ..., description="API key for PII service authentication"
    )

    # ── Database ──────────────────────────────────────────────────────────────
    database_url: SecretStr = Field(
        ...,
        description="PostgreSQL database URL, e.g. postgresql+asyncpg://user:pass@host:5432/db",
    )

    # ── Security / Authentication ──────────────────────────────────────────────
    admin_api_key: SecretStr = Field(
        ..., description="Admin API key for protected endpoints (e.g., /logs, /metrics)"
    )

    # ── Logging ──────────────────────────────────────────────────────────────
    log_level: str = Field(
        "INFO", description="Logging level (DEBUG, INFO, WARNING, ERROR)"
    )
    log_format: str = Field(
        "json", description="Log format: 'json' for production, 'console' for dev"
    )

    # ── Server ──────────────────────────────────────────────────────────────
    host: str = Field("0.0.0.0", description="Bind host")
    port: int = Field(8000, ge=1, le=65535, description="Bind port")

    # ── CORS ─────────────────────────────────────────────────────────────────
    cors_allowed_origins: str = Field(
        "http://localhost:3000,http://localhost:8080",
        description="Comma-separated list of allowed CORS origins"
    )

    @property
    def cors_origins_list(self) -> List[str]:
        """Split cors_allowed_origins on comma and strip whitespace."""
        return [origin.strip() for origin in self.cors_allowed_origins.split(",") if origin.strip()]

    @field_validator("arbiter_master_key")
    @classmethod
    def validate_fernet_key(cls, v: SecretStr) -> SecretStr:
        """Validate that arbiter_master_key is a valid Fernet key."""
        try:
            Fernet(v.get_secret_value())
        except Exception as e:
            raise ValueError(f"Invalid Fernet key: {str(e)}")
        return v

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
    }
