from enum import Enum
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class AppEnvironment(str, Enum):
    local = "local"
    development = "development"
    testing = "testing"
    production = "production"


DEFAULT_JWT_SECRET_PLACEHOLDER = "replace-this-in-env-with-32-plus-characters"


class Settings(BaseSettings):
    app_name: str = "OptiLoad"
    api_prefix: str = "/api/v1"
    environment: str = "development"

    database_url: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/optiload"

    jwt_secret_key: str = Field(default=DEFAULT_JWT_SECRET_PLACEHOLDER, min_length=32)
    jwt_algorithm: str = "HS256"
    jwt_access_token_minutes: int = 15
    jwt_refresh_token_days: int = 7
    jwt_issuer: str = "optiload"
    jwt_audience: str = "optiload-clients"

    access_token_cookie_name: str = "optiload_access"
    refresh_token_cookie_name: str = "optiload_refresh"

    rate_limit_per_minute: int = 60
    auth_login_rate_limit_per_minute: int = 10
    rate_limit_backend: str = "memory"
    redis_url: str | None = None
    redis_rate_limit_key_prefix: str = "optiload:rl"

    max_request_body_bytes: int = 1_048_576

    cors_allowed_origins: list[str] = ["http://localhost:5173"]
    trusted_hosts: list[str] = ["localhost", "127.0.0.1"]

    allow_public_registration: bool = True
    bootstrap_super_admin_enabled: bool = False
    bootstrap_super_admin_email: str | None = None
    bootstrap_super_admin_password: str | None = None
    bootstrap_super_admin_name: str = "Platform Admin"

    @property
    def resolved_environment(self) -> Literal["local", "testing", "production"]:
        env = (self.environment or "development").lower()
        if env in ("production", "prod"):
            return "production"
        if env in ("testing", "test", "staging", "qa"):
            return "testing"
        return "local"

    @property
    def is_production(self) -> bool:
        return self.resolved_environment == "production"

    @property
    def is_testing_env(self) -> bool:
        return self.resolved_environment == "testing"

    @property
    def cookie_secure(self) -> bool:
        return self.is_production

    @property
    def include_tokens_in_json_response(self) -> bool:
        return not self.is_production

    @property
    def expose_detailed_http_errors(self) -> bool:
        return self.resolved_environment == "local"

    @property
    def debug_logging(self) -> bool:
        return self.resolved_environment == "local"

    @field_validator("bootstrap_super_admin_password")
    @classmethod
    def strip_bootstrap_password(cls, v: str | None) -> str | None:
        if v is not None and not str(v).strip():
            return None
        return v

    model_config = SettingsConfigDict(env_prefix="OPTILOAD_", env_file=".env", extra="ignore")


settings = Settings()
