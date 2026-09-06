import yaml
import os
from pathlib import Path
from pydantic import BaseModel
from pydantic_settings import BaseSettings
from typing import List, Optional
from dotenv import load_dotenv

load_dotenv()

CONFIG_PATH = Path(__file__).parent.parent.parent / "config.yaml"


def _load_yaml() -> dict:
    with open(CONFIG_PATH) as f:
        return yaml.safe_load(f)


_cfg = _load_yaml()


class LLMConfig(BaseModel):
    provider: str = "openrouter"
    openrouter_api_key: str = ""
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    openrouter_model: str = "deepseek/deepseek-coder"
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "codellama:13b"
    max_tokens: int = 8192
    temperature: float = 0.2


class EmbeddingConfig(BaseModel):
    model: str = "BAAI/bge-small-en-v1.5"
    device: str = "cpu"
    batch_size: int = 32
    chunk_size: int = 1500
    chunk_overlap: int = 200


class QdrantConfig(BaseModel):
    host: str = "localhost"
    port: int = 6333
    collection: str = "code_index"
    in_memory: bool = True


class IndexerConfig(BaseModel):
    supported_extensions: List[str]
    ignore_dirs: List[str]
    max_file_size_kb: int = 500


class RetrievalConfig(BaseModel):
    top_k: int = 8
    score_threshold: float = 0.3


class Settings(BaseModel):
    llm: LLMConfig = LLMConfig(**_cfg.get("llm", {}))
    embeddings: EmbeddingConfig = EmbeddingConfig(**_cfg.get("embeddings", {}))
    qdrant: QdrantConfig = QdrantConfig(**_cfg.get("qdrant", {}))
    indexer: IndexerConfig = IndexerConfig(**_cfg.get("indexer", {}))
    retrieval: RetrievalConfig = RetrievalConfig(**_cfg.get("retrieval", {}))

    def __init__(self, **data):
        super().__init__(**data)
        # Override from env
        key = os.getenv("OPENROUTER_API_KEY", "")
        if key:
            self.llm.openrouter_api_key = key
        provider = os.getenv("LLM_PROVIDER", "")
        if provider:
            self.llm.provider = provider
        model = os.getenv("LLM_MODEL", "")
        if model:
            self.llm.openrouter_model = model


settings = Settings()
