"""
Retrieval Service.
Searches Qdrant for relevant code chunks based on a query.
Also builds rich context including repo structure.
"""
from __future__ import annotations
from typing import List, Dict, Any
from loguru import logger

from app.core.config import settings
from app.services import embeddings as emb_svc
from app.services import vector_store as vs
from app.services.indexer import collect_files, build_repo_structure
from app.models.schemas import CodeChunk


async def retrieve_relevant_chunks(
    query: str,
    repo_path: str,
    top_k: int | None = None,
    score_threshold: float | None = None,
) -> List[CodeChunk]:
    """
    1. Embed the query
    2. Search Qdrant for top-k similar chunks
    3. Return as CodeChunk list
    """
    k         = top_k or settings.retrieval.top_k
    threshold = score_threshold or settings.retrieval.score_threshold

    if not vs.collection_exists(repo_path):
        logger.warning(f"No index found for {repo_path}. Please index first.")
        return []

    logger.info(f"Retrieving chunks for: '{query[:80]}...' (top_k={k})")

    query_embedding = await emb_svc.embed_query(query)
    raw_results     = vs.search(repo_path, query_embedding, top_k=k, score_threshold=threshold)

    chunks = []
    for r in raw_results:
        chunks.append(CodeChunk(
            chunk_id=f"{r.get('file_path')}:{r.get('chunk_number')}",
            file_path=r.get("file_path", ""),
            file_name=r.get("file_name", ""),
            language=r.get("language", "text"),
            content=r.get("content", ""),
            chunk_number=r.get("chunk_number", 0),
            total_chunks=r.get("total_chunks", 1),
            last_modified=r.get("last_modified", ""),
            score=r.get("score"),
        ))

    logger.info(f"Retrieved {len(chunks)} chunks (scores: {[round(c.score,3) for c in chunks]})")
    return chunks


async def build_context(
    query: str,
    repo_path: str,
    chunks: List[CodeChunk],
) -> str:
    """
    Builds a rich context string for the LLM:
    - Repository structure overview
    - Most relevant code chunks with file paths
    """
    # Repo structure (limit output)
    try:
        files = collect_files(repo_path)
        structure = build_repo_structure(repo_path, files)
        # Limit structure size
        if len(structure) > 3000:
            lines = structure.split("\n")
            structure = "\n".join(lines[:80]) + f"\n... ({len(lines)-80} more items)"
    except Exception as e:
        logger.warning(f"Could not build structure: {e}")
        structure = "(structure unavailable)"

    # Unique files referenced
    unique_files = list(dict.fromkeys(c.file_path for c in chunks))

    # Build context sections
    ctx_parts = []

    ctx_parts.append(f"""=== REPOSITORY STRUCTURE ===
{structure}

=== RELEVANT FILES FOUND ===
{chr(10).join(f'- {f}' for f in unique_files)}

=== USER REQUEST ===
{query}

=== RELEVANT CODE CONTEXT ===
""")

    for i, chunk in enumerate(chunks, 1):
        ctx_parts.append(
            f"--- [{i}] {chunk.file_path} (chunk {chunk.chunk_number+1}/{chunk.total_chunks}, "
            f"lang={chunk.language}, relevance={round(chunk.score or 0, 3)}) ---\n"
            f"{chunk.content}\n"
        )

    return "".join(ctx_parts)
