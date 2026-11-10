import os
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "HandoverTrail API"
    ENVIRONMENT: str = "development"
    HOST: str = "0.0.0.0"
    PORT: int = int(os.getenv("PORT", "8080"))

    # Gemini API Configuration (optional - fallback to deterministic cache when empty)
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or ""
    LLM_MODEL: str = os.getenv("LLM_MODEL", "gemini-2.5-flash")

    # Database (SQLite with WAL mode)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./handovertrail.db")

    # Frontend dist directory
    FRONTEND_DIST: str = os.getenv("FRONTEND_DIST", "../frontend/dist")

    # CORS Origins
    CORS_ORIGINS: str = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173",
    )

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def cors_origins_list(self) -> List[str]:
        origins = [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]
        # Guard against wildcard CORS in production
        if getattr(self, "ENVIRONMENT", "development") == "production" and "*" in origins:
            return [o for o in origins if o != "*"]
        return origins

    @property
    def FRONTEND_DIR(self) -> str:
        """Alias for backward compatibility."""
        return self.FRONTEND_DIST


settings = Settings()
