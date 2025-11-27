"""
ComChatX Backend Configuration
Centralized configuration management using Pydantic Settings
"""

from pydantic_settings import BaseSettings
from typing import List
import os
from pathlib import Path


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Server Configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    ENVIRONMENT: str = "development"
    
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./comchatx.db"
    
    # AI API Keys
    DEEPSEEK_API_KEY: str
    MINIMAX_API_KEY: str
    
    # LLM Configuration
    DEEPSEEK_BASE_URL: str = "https://api.deepseek.com"
    MINIMAX_BASE_URL: str = "https://api.minimax-ai.com"
    DEEPSEEK_MODEL: str = "deepseek-chat"
    MINIMAX_MODEL: str = "abab6.5s-chat"
    
    # Model Parameters
    DEFAULT_TEMPERATURE: float = 0.7
    DEFAULT_MAX_TOKENS: int = 4000
    
    # CORS Settings
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,https://comchatx.icu,https://www.comchatx.icu"
    
    # Security
    SECRET_KEY: str = "your-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 43200
    
    class Config:
        env_file = ".env"
        case_sensitive = True
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins string into list"""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]


# Global settings instance
settings = Settings()


# Ensure data directory exists
DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(exist_ok=True)

