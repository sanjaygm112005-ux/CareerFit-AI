from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    gemini_api_key: Optional[str] = ""
    database_url: Optional[str] = ""
    neon_database_url: Optional[str] = ""
    max_file_size_mb: int = 20

    # Custom Neon Auth & JWT
    jwt_secret: str = "careerfit-super-secret-jwt-key-2026-production"
    jwt_algorithm: str = "HS256"
    jwt_expires_in_days: int = 7
    frontend_url: str = "https://frontend-nine-rouge-55.vercel.app"

    # Custom Email / SMTP
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = "sanjaygm112005@gmail.com"
    smtp_password: str = "pdfvypvdecosqdak"
    emails_from_name: str = "CareerFit AI"
    emails_from_email: str = "sanjaygm112005@gmail.com"
    send_welcome_email: bool = True

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


settings = Settings()
