from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    HOST: str = "0.0.0.0"
    PORT: int = 8090
    LOG_LEVEL: str = "INFO"
    UPLOAD_DIR: str = "/app/uploads"
    OUTPUT_DIR: str = "/app/outputs"
    REDIS_URL: str = "redis://localhost:6379"
    MAX_FILE_SIZE_MB: int = 50

    class Config:
        env_file = ".env"


settings = Settings()
