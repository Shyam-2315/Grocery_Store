"""
Configuration settings for the application.
Uses environment variables with sensible defaults.
"""
from typing import List
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings:
    """Application settings loaded from environment variables"""
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://postgres:Shyam2315@localhost/grocery_pos"
    )
    
    # JWT Security
    SECRET_KEY: str = os.getenv(
        "SECRET_KEY",
        "grocery_pos_super_secret_key_2024_change_in_production"
    )
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    
    # CORS
    CORS_ORIGINS_STR: str = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://localhost:3000"
    )
    CORS_ORIGINS: List[str] = CORS_ORIGINS_STR.split(",") if CORS_ORIGINS_STR else ["http://localhost:5173"]
    
    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"
    
    # Server
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))

# Create settings instance
settings = Settings()
