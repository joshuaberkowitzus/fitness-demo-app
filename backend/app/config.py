"""Environment configuration for the Fitness Tracker API."""

from functools import lru_cache
from typing import Any

from pydantic import computed_field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Firebase
    firebase_project_id: str = ""
    firebase_service_account_path: str = "service-account.json"

    # Google Fit OAuth
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:8000/api/v1/health/google-fit/callback"

    # API Configuration
    api_prefix: str = "/api/v1"
    cors_origins_str: str = "http://localhost:5173,http://localhost:3000"
    debug: bool = False

    # Encryption key for Google Fit tokens (generate with: openssl rand -hex 32)
    encryption_key: str = ""

    @computed_field
    @property
    def cors_origins(self) -> list[str]:
        """Parse CORS origins from comma-separated string."""
        return [origin.strip() for origin in self.cors_origins_str.split(",") if origin.strip()]

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


@lru_cache
def get_settings() -> Settings:
    """Get cached application settings."""
    return Settings()
