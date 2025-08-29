from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Ignore unrelated frontend env vars (VITE_*, NODE_ENV, etc.) so they don't raise ValidationError
    model_config = SettingsConfigDict(extra="ignore")
    ENV: str = Field("development", description="Environment name")
    API_PREFIX: str = "/api"
    PORT: int = 8000

    RS256_PRIVATE_KEY: str | None = None
    RS256_PUBLIC_KEY: str | None = None
    APP_ENCRYPTION_KEY: str = Field(
        default="dev_app_encryption_key_32bytes_!!!!",
        description="32 byte key (or longer, trimmed) used for AES-GCM"
    )

    ACCESS_CODE_TTL_HOURS: int = 24
    ACCESS_CODE_MODE: str = Field("prod", description="prod | dev")

    INTERNAL_API_KEY: str | None = None

    DATABASE_URL: str | None = None
    JWT_SECRET: str = Field(
        default="your-secret-key-change-in-production",
        description="Secret key for JWT token signing"
    )

    # Redis Configuration
    REDIS_URL: str = Field(
        default="redis://localhost:6379",
        description="Redis connection URL"
    )
    REDIS_CACHE_TTL: int = Field(
        default=3600,
        description="Default cache TTL in seconds"
    )
    REDIS_MAX_CONNECTIONS: int = Field(
        default=20,
        description="Maximum Redis connections"
    )



@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore
