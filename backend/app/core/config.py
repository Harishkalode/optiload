from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "OptiLoad Backend"
    api_prefix: str = "/api/v1"
    database_url: str = "sqlite:///./optiload.db"
    jwt_secret_key: str = "change-me"
    jwt_algorithm: str = "HS256"
    jwt_access_token_minutes: int = 120
    rate_limit_per_minute: int = 120

    model_config = SettingsConfigDict(env_prefix="OPTILOAD_", env_file=".env", extra="ignore")


settings = Settings()
