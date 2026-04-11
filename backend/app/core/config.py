"""Central configuration with environment-driven defaults.

A single OPTILOAD_ENVIRONMENT variable (local|test|production) controls
all security, performance, and behavioral settings automatically.
Explicit env vars override auto-defaults.
"""

from enum import Enum
from typing import Literal

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class AppEnvironment(str, Enum):
    local = "local"
    testing = "testing"
    production = "production"


_DEFAULT_JWT_SECRET = "dev-secret-change-in-production-32chars-minimum"


class Settings(BaseSettings):
    # ─── CORE ────────────────────────────────────────────────────────
    app_name: str = "OptiLoad"
    api_prefix: str = "/api/v1"
    environment: str = "local"

    # ─── DATABASE ────────────────────────────────────────────────────
    database_url: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/optiload"
    database_read_url: str | None = None

    db_pool_size: int | None = None
    db_max_overflow: int | None = None
    db_pool_timeout: int | None = None
    db_pool_recycle: int | None = None
    db_statement_timeout_ms: int | None = None

    # ─── JWT / AUTH ──────────────────────────────────────────────────
    jwt_secret_key: str = Field(default=_DEFAULT_JWT_SECRET, min_length=32)
    jwt_algorithm: str = "HS256"
    jwt_access_token_minutes: int | None = None
    jwt_refresh_token_days: int | None = None
    jwt_issuer: str = "optiload"
    jwt_audience: str = "optiload-clients"

    access_token_cookie_name: str = "optiload_access"
    refresh_token_cookie_name: str = "optiload_refresh"
    cookie_samesite: str | None = None

    # ─── RATE LIMITING ───────────────────────────────────────────────
    rate_limit_per_minute: int | None = None
    auth_login_rate_limit_per_minute: int | None = None
    rate_limit_backend: str | None = None
    redis_url: str | None = None
    redis_rate_limit_key_prefix: str = "optiload:rl"

    # ─── SECURITY FEATURES ───────────────────────────────────────────
    csrf_enabled: bool | None = None
    account_lockout_enabled: bool | None = None
    account_lockout_max_attempts: int = 5
    account_lockout_duration_minutes: int = 15
    mfa_required_for_roles: list[str] | None = None
    max_request_body_bytes: int | None = None

    # ─── CORS / HOSTS ────────────────────────────────────────────────
    cors_allowed_origins: list[str] = ["http://localhost:5173"]
    trusted_hosts: list[str] = ["localhost", "127.0.0.1"]

    # ─── REGISTRATION ────────────────────────────────────────────────
    allow_public_registration: bool | None = None
    bootstrap_super_admin_enabled: bool = False
    bootstrap_super_admin_email: str | None = None
    bootstrap_super_admin_password: str | None = None
    bootstrap_super_admin_name: str = "Platform Admin"

    # ─── API DOCS ────────────────────────────────────────────────────
    enable_api_docs: bool | None = None

    # ─── LOGGING ─────────────────────────────────────────────────────
    log_level: str | None = None
    structured_logging: bool | None = None
    access_log_enabled: bool | None = None

    # ─── ERROR HANDLING ──────────────────────────────────────────────
    expose_detailed_errors: bool | None = None
    sentry_dsn: str | None = None

    # ─── CACHING ─────────────────────────────────────────────────────
    cache_enabled: bool | None = None
    cache_default_ttl: int = 300
    cache_max_ttl: int = 3600

    # ─── MONITORING ──────────────────────────────────────────────────
    enable_health_checks: bool = True
    enable_metrics_endpoint: bool | None = None

    # ─── PERFORMANCE ─────────────────────────────────────────────────
    enable_query_counter: bool | None = None
    query_counter_threshold: int = 10

    # ─── ENVIRONMENT RESOLUTION ──────────────────────────────────────
    @property
    def resolved_environment(self) -> Literal["local", "testing", "production"]:
        env = (self.environment or "local").lower()
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

    # ─── ENVIRONMENT-DRIVEN DEFAULTS ─────────────────────────────────
    def model_post_init(self, __context) -> None:
        env = self.resolved_environment

        if self.jwt_access_token_minutes is None:
            self.jwt_access_token_minutes = {"local": 1440, "testing": 5, "production": 15}[env]
        if self.jwt_refresh_token_days is None:
            self.jwt_refresh_token_days = {"local": 30, "testing": 1, "production": 7}[env]

        if self.cookie_samesite is None:
            self.cookie_samesite = {"local": "lax", "testing": "lax", "production": "strict"}[env]

        if self.rate_limit_per_minute is None:
            self.rate_limit_per_minute = {"local": 100, "testing": 1000, "production": 60}[env]
        if self.auth_login_rate_limit_per_minute is None:
            self.auth_login_rate_limit_per_minute = {"local": 30, "testing": 1000, "production": 5}[env]
        if self.rate_limit_backend is None:
            self.rate_limit_backend = {"local": "memory", "testing": "memory", "production": "redis"}[env]

        if self.csrf_enabled is None:
            self.csrf_enabled = {"local": False, "testing": True, "production": True}[env]
        if self.account_lockout_enabled is None:
            self.account_lockout_enabled = {"local": False, "testing": False, "production": True}[env]
        if self.mfa_required_for_roles is None:
            self.mfa_required_for_roles = {"local": [], "testing": [], "production": ["super_admin", "admin"]}[env]
        if self.max_request_body_bytes is None:
            self.max_request_body_bytes = {"local": 10_485_760, "testing": 10_485_760, "production": 524_288}[env]

        if self.allow_public_registration is None:
            self.allow_public_registration = {"local": True, "testing": True, "production": False}[env]

        if self.enable_api_docs is None:
            self.enable_api_docs = {"local": True, "testing": True, "production": False}[env]

        if self.log_level is None:
            self.log_level = {"local": "DEBUG", "testing": "DEBUG", "production": "WARNING"}[env]
        if self.structured_logging is None:
            self.structured_logging = {"local": False, "testing": False, "production": True}[env]
        if self.access_log_enabled is None:
            self.access_log_enabled = {"local": True, "testing": True, "production": False}[env]

        if self.expose_detailed_errors is None:
            self.expose_detailed_errors = {"local": True, "testing": False, "production": False}[env]

        if self.cache_enabled is None:
            self.cache_enabled = {"local": False, "testing": False, "production": True}[env]

        if self.enable_metrics_endpoint is None:
            self.enable_metrics_endpoint = {"local": True, "testing": True, "production": True}[env]

        if self.enable_query_counter is None:
            self.enable_query_counter = {"local": True, "testing": True, "production": False}[env]

        if self.db_pool_size is None:
            self.db_pool_size = {"local": 5, "testing": 5, "production": 20}[env]
        if self.db_max_overflow is None:
            self.db_max_overflow = {"local": 10, "testing": 10, "production": 40}[env]
        if self.db_pool_timeout is None:
            self.db_pool_timeout = {"local": 30, "testing": 10, "production": 30}[env]
        if self.db_pool_recycle is None:
            self.db_pool_recycle = 1800
        if self.db_statement_timeout_ms is None:
            self.db_statement_timeout_ms = {"local": 60000, "testing": 30000, "production": 30000}[env]

    @model_validator(mode="after")
    def validate_production_requirements(self) -> "Settings":
        if self.is_production:
            if self.jwt_secret_key == _DEFAULT_JWT_SECRET:
                raise ValueError("OPTILOAD_JWT_SECRET_KEY must be set to a unique secret in production")
            if not self.redis_url:
                raise ValueError("OPTILOAD_REDIS_URL is required in production")
            if "*" in self.cors_allowed_origins:
                raise ValueError("CORS wildcard '*' is not allowed in production")
        return self

    @field_validator("bootstrap_super_admin_password")
    @classmethod
    def strip_bootstrap_password(cls, v: str | None) -> str | None:
        if v is not None and not str(v).strip():
            return None
        return v

    model_config = SettingsConfigDict(env_prefix="OPTILOAD_", env_file=".env", extra="ignore")


settings = Settings()
