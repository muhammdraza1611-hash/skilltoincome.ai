"""
Embedding service using BAAI/bge-small-en-v1.5 locally.
Singleton pattern — model loaded once.
"""
from __future__ import annotations
import asyncio
from typing import List
from loguru import logger
from app.core.config import settings

_model = None


def _get_model():
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        logger.info(f"Loading embedding model: {settings.embeddings.model}")
        _model = SentenceTransformer(
            settings.embeddings.model,
            device=settings.embeddings.device,
        )
        logger.info("Embedding model loaded.")
    return _model


async def embed_texts(texts: List[str]) -> List[List[float]]:
    """Embed a list of texts asynchronously (runs in thread pool)."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _embed_sync, texts)


def _embed_sync(texts: List[str]) -> List[List[float]]:
    model = _get_model()
    embeddings = model.encode(
        texts,
        batch_size=settings.embeddings.batch_size,
        show_progress_bar=False,
        normalize_embeddings=True,   # cosine similarity
    )
    return embeddings.tolist()


async def embed_query(query: str) -> List[float]:
    """Embed a single query string."""
    results = await embed_texts([query])
    return results[0]


def get_embedding_dim() -> int:
    """Return dimension of the embedding model."""
    model = _get_model()
    return model.get_sentence_embedding_dimension()
