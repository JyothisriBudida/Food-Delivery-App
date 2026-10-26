"""Backend configuration using environment variables."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    firebase_service_account_key: str = "./serviceAccountKey.json"
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    debug: bool = True
    frontend_url: str = "http://localhost:3000"

    class Config:
        env_file = ".env"


settings = Settings()
