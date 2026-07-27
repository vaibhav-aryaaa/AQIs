import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///smartaqi.db"
    TELEGRAM_BOT_TOKEN: str = ""
    TELEGRAM_CHAT_ID: str = ""
    CORS_ORIGINS: str = "http://localhost:3000"
    MODEL_PATH: str = os.path.join(os.path.dirname(os.path.abspath(__file__)), "aqi_predictor.pkl")
    GEMINI_API_KEY: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
