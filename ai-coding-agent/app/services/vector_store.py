"""
Qdrant vector store service.
Supports in-memory mode (no server needed) and remote server mode.
"""
from __future__ import annotations
import uuid
from typing import List, Dict, Any, Optional
from loguru import logger
from app.core.config import settings

_client = None
_collection_name: str = settings.qdrant.collection


def _get_client():
    global _client
    if _client is None:
        from qdrant_client import QdrantClient
        if settings.qdrant.in_memory:
            logger.info("Using Qdrant in-memory mode")
            _client = QdrantClient(":memory:")
        else:
            logger.info(f"Connecting to Qdrant at {settings.qdrant.host}:{settings.qdrant.port}")
            _client = QdrantClient(
                host=settings.qdrant.host,
                port=settings.qdrant.port,
            )
    return _client


def init_collection(dim: int, repo_path: str) -> str:
    """Create or recreate a collection for this repo."""
    from qdrant_client.models import VectorParams, Distance
    col = _collection_name_for(repo_path)
    client = _get_client()
    # Delete if exists (re-index)
    try:
        client.delete_collection(col)
    except Exception:
        pass
    client.create_collection(
        collection_name=col,
        vectors_config=VectorParams(size=dim, distance=Distance.COSINE),
    )
    logger.info(f"Created Qdrant collection: {col} (dim={dim})")
    return col


def collection_exists(repo_path: str) -> bool:
    client = _get_client()
    col = _collection_name_for(repo_path)
    try:
        client.get_collection(col)
        return True
    except Exception:
        return False


def upsert_chunks(repo_path: str, chunks: List[Dict[str, Any]], embeddings: List[List[float]]):
    """Insert or update code chunks with their embeddings."""
    from qdrant_client.models import PointStruct
    client = _get_client()
    col = _collection_name_for(repo_path)

    points = []
    for chunk, emb in zip(chunks, embeddings):
        points.append(PointStruct(
            id=str(uuid.uuid4()),
            vector=emb,
            payload=chunk,
        ))

    # Batch upsert
    batch_size = 100
    for i in range(0, len(points), batch_size):
        client.upsert(collection_name=col, points=points[i:i+batch_size])

    logger.debug(f"Upserted {len(points)} chunks into {col}")


def search(repo_path: str, query_embedding: List[float], top_k: int = 8, score_threshold: float = 0.3) -> List[Dict[str, Any]]:
    """Search for similar chunks."""
    from qdrant_client.models import SearchParams
    client = _get_client()
    col = _collection_name_for(repo_path)

    results = client.search(
        collection_name=col,
        query_vector=query_embedding,
        limit=top_k,
        score_threshold=score_threshold,
        with_payload=True,
    )

    hits = []
    for r in results:
        payload = r.payload or {}
        payload["score"] = r.score
        hits.append(payload)
    return hits


def get_collection_count(repo_path: str) -> int:
    client = _get_client()
    col = _collection_name_for(repo_path)
    try:
        info = client.get_collection(col)
        return info.points_count or 0
    except Exception:
        return 0


def _collection_name_for(repo_path: str) -> str:
    """Sanitize repo path into a valid collection name."""
    import re
    safe = re.sub(r'[^a-zA-Z0-9_]', '_', repo_path.strip("/\\").replace("\\", "_"))
    return f"{_collection_name}_{safe[-40:]}"
