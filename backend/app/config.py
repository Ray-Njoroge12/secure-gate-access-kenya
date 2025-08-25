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



@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore
