"""
RepoChat Backend - Core Configuration
"""
from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional
import os


class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    # App
    APP_NAME: str = "RepoChat"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = False
    
    # API
    API_PREFIX: str = "/api"
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    # LLM Configuration
    LLM_PROVIDER: str = "local"  # "local" or "huggingface"
    LLM_BASE_URL: str = "http://127.0.0.1:1234/v1"
    LLM_MODEL: str = "local-model"
    LLM_TEMPERATURE: float = 0.1
    LLM_MAX_TOKENS: int = 2048
    
    # Embeddings
    EMBEDDING_MODEL: str = "sentence-transformers/all-mpnet-base-v2"
    USE_LOCAL_EMBEDDINGS: bool = True
    
    # Vector Store
    FAISS_INDEX_PATH: str = "data/faiss_index"
    REPO_DATA_PATH: str = "data/repos"
    
    # RAG Configuration
    CHUNK_SIZE: int = 1500
    CHUNK_OVERLAP: int = 300
    RETRIEVAL_K: int = 10
    CONTEXT_WINDOW: int = 6000
    
    # Hugging Face (optional) - support both naming conventions
    HUGGINGFACEHUB_API_TOKEN: Optional[str] = Field(default=None)
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Ignore extra fields in .env


settings = Settings()
