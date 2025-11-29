"""
ComChatX Backend Configuration
Centralized configuration management using Pydantic Settings
"""

from pydantic_settings import BaseSettings
from typing import List
import os
import errno
from pathlib import Path


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Server Configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    ENVIRONMENT: str = "development"
    
    # Database
    # DATABASE_URL 可以通过环境变量覆盖；未设置时根据运行环境自动生成
    DATABASE_URL: str = ""
    
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


def _init_data_dir() -> Path:
    """
    初始化数据目录：
    - 本地开发：使用 backend/data
    - Vercel Serverless：使用 /tmp/comchatx_data（/var/task 为只读）
    """
    # 允许通过环境变量自定义
    base_dir = os.getenv("DATA_DIR_PATH")
    if base_dir:
        data_dir = Path(base_dir)
    else:
        # 在 Vercel Serverless 环境下，代码被打包到 /var/task，且该路径只读
        # 这里通过检测 __file__ 路径是否位于 /var/task 来判断
        running_in_vercel = os.getenv("VERCEL") or str(Path(__file__).parent).startswith("/var/task")
        if running_in_vercel:
            data_dir = Path("/tmp/comchatx_data")
        else:
            data_dir = Path(__file__).parent / "data"

    try:
        data_dir.mkdir(exist_ok=True, parents=True)
    except OSError as e:
        # 只读文件系统或无权限则退回 /tmp
        if e.errno in (errno.EROFS, errno.EACCES):
            data_dir = Path("/tmp/comchatx_data")
            data_dir.mkdir(exist_ok=True, parents=True)
        else:
            raise

    return data_dir


# Ensure data directory exists
DATA_DIR = _init_data_dir()

# Set DATABASE_URL after settings initialization
if not settings.DATABASE_URL:
    if os.getenv("VERCEL"):
        # Vercel Serverless: use /tmp (only writable directory)
        db_path = "/tmp/comchatx_v2.db"
    else:
        # Local development: use current directory
        db_path = str(Path(__file__).parent / "comchatx_v2.db")
    settings.DATABASE_URL = f"sqlite+aiosqlite:///{db_path}"

