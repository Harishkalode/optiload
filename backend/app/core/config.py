from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "OptiLoad"
    api_prefix: str = "/api/v1"
    environment: str = "development"

    database_url: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/optiload"

    jwt_secret_key: str = Field(default="replace-this-in-env-with-32-plus-characters", min_length=32)
    jwt_algorithm: str = "HS256"
    jwt_access_token_minutes: int = 30

    rate_limit_per_minute: int = 60

    cors_allowed_origins: list[str] = ["http://localhost:5173"]
    trusted_hosts: list[str] = ["localhost", "127.0.0.1"]

    model_config = SettingsConfigDict(env_prefix="OPTILOAD_", env_file=".env", extra="ignore")


settings = Settings()
