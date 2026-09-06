"""
Repository Indexer Service.
Reads all project files, splits into chunks, generates embeddings, stores in Qdrant.
Supports incremental re-indexing (only changed files).
"""
from __future__ import annotations
import os
import time
import hashlib
import json
from pathlib import Path
from typing import List, Dict, Any, Tuple
from datetime import datetime
from loguru import logger

from app.core.config import settings
from app.services import embeddings as emb_svc
from app.services import vector_store as vs


# Cache file to track indexed file hashes
CACHE_DIR = Path(".agent_cache")
CACHE_DIR.mkdir(exist_ok=True)


def _get_cache_path(repo_path: str) -> Path:
    safe = hashlib.md5(repo_path.encode()).hexdigest()[:12]
    return CACHE_DIR / f"{safe}.json"


def _load_cache(repo_path: str) -> Dict[str, str]:
    p = _get_cache_path(repo_path)
    if p.exists():
        try:
            return json.loads(p.read_text())
        except Exception:
            pass
    return {}


def _save_cache(repo_path: str, cache: Dict[str, str]):
    _get_cache_path(repo_path).write_text(json.dumps(cache, indent=2))


def _file_hash(path: Path) -> str:
    try:
        content = path.read_bytes()
        return hashlib.md5(content).hexdigest()
    except Exception:
        return ""


def _detect_language(path: Path) -> str:
    ext_map = {
        ".py":   "python",
        ".ts":   "typescript",
        ".tsx":  "typescript",
        ".js":   "javascript",
        ".jsx":  "javascript",
        ".html": "html",
        ".css":  "css",
        ".scss": "scss",
        ".json": "json",
        ".yaml": "yaml",
        ".yml":  "yaml",
        ".md":   "markdown",
        ".toml": "toml",
    }
    return ext_map.get(path.suffix.lower(), "text")


def _should_ignore(path: Path, ignore_dirs: List[str]) -> bool:
    for part in path.parts:
        if part in ignore_dirs:
            return True
    return False


def _chunk_text(text: str, chunk_size: int, overlap: int) -> List[str]:
    """Split text into overlapping chunks."""
    if len(text) <= chunk_size:
        return [text]
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - overlap
    return chunks


def collect_files(repo_path: str) -> List[Path]:
    """Recursively collect all supported files."""
    root = Path(repo_path)
    if not root.exists():
        raise FileNotFoundError(f"Repository path not found: {repo_path}")

    exts = set(settings.indexer.supported_extensions)
    ignore = set(settings.indexer.ignore_dirs)
    max_kb = settings.indexer.max_file_size_kb * 1024

    files = []
    for p in root.rglob("*"):
        if not p.is_file():
            continue
        if _should_ignore(p.relative_to(root), ignore):
            continue
        if p.suffix.lower() not in exts:
            continue
        if p.stat().st_size > max_kb:
            logger.debug(f"Skipping large file: {p}")
            continue
        files.append(p)

    return sorted(files)


def build_repo_structure(repo_path: str, files: List[Path]) -> str:
    """Build a tree-like string of the repo structure."""
    root = Path(repo_path)
    dirs_seen = set()
    lines = [f"📁 {root.name}/"]
    for f in sorted(files):
        rel = f.relative_to(root)
        parts = rel.parts
        for i, part in enumerate(parts[:-1]):
            key = "/".join(parts[:i+1])
            if key not in dirs_seen:
                dirs_seen.add(key)
                indent = "  " * (i + 1)
                lines.append(f"{indent}📁 {part}/")
        indent = "  " * len(parts)
        lines.append(f"{indent}📄 {parts[-1]}")
    return "\n".join(lines)


def prepare_chunks(repo_path: str, files: List[Path]) -> List[Dict[str, Any]]:
    """Read files and split into chunks with metadata."""
    root = Path(repo_path)
    chunk_size = settings.embeddings.chunk_size
    overlap    = settings.embeddings.chunk_overlap
    all_chunks = []

    for file_path in files:
        try:
            content = file_path.read_text(encoding="utf-8", errors="ignore")
        except Exception as e:
            logger.warning(f"Cannot read {file_path}: {e}")
            continue

        if not content.strip():
            continue

        lang     = _detect_language(file_path)
        rel_path = str(file_path.relative_to(root))
        mtime    = datetime.fromtimestamp(file_path.stat().st_mtime).isoformat()
        text_chunks = _chunk_text(content, chunk_size, overlap)

        for i, chunk_text in enumerate(text_chunks):
            all_chunks.append({
                "file_path":     rel_path,
                "file_name":     file_path.name,
                "language":      lang,
                "content":       chunk_text,
                "chunk_number":  i,
                "total_chunks":  len(text_chunks),
                "last_modified": mtime,
                "repo_path":     repo_path,
            })

    return all_chunks


async def index_repository(repo_path: str, force: bool = False) -> Dict[str, Any]:
    """
    Main indexing function.
    - Collect files
    - Detect changed files (skip unchanged unless force=True)
    - Generate embeddings
    - Store in Qdrant
    """
    start = time.time()
    errors = []

    logger.info(f"Starting index of: {repo_path} (force={force})")

    files = collect_files(repo_path)
    logger.info(f"Found {len(files)} files")

    # Check which files changed
    cache = _load_cache(repo_path)
    changed_files = []
    new_cache = {}

    for f in files:
        h = _file_hash(f)
        rel = str(f.relative_to(Path(repo_path)))
        new_cache[rel] = h
        if force or cache.get(rel) != h:
            changed_files.append(f)

    if not changed_files and not force and vs.collection_exists(repo_path):
        logger.info("No files changed, skipping re-index.")
        count = vs.get_collection_count(repo_path)
        return {
            "status": "skipped",
            "files_indexed": 0,
            "chunks_stored": count,
            "duration_seconds": round(time.time() - start, 2),
            "errors": [],
        }

    logger.info(f"{len(changed_files)} files to index")

    # Prepare chunks
    chunks = prepare_chunks(repo_path, changed_files if not force else files)
    if not chunks:
        return {"status": "empty", "files_indexed": 0, "chunks_stored": 0,
                "duration_seconds": 0, "errors": []}

    # Get embedding dimension and init collection
    from app.services.embeddings import get_embedding_dim
    dim = get_embedding_dim()
    vs.init_collection(dim, repo_path)

    # Generate embeddings in batches
    logger.info(f"Generating embeddings for {len(chunks)} chunks...")
    texts = [c["content"] for c in chunks]

    from app.services.embeddings import embed_texts
    batch = settings.embeddings.batch_size
    all_embeddings = []
    for i in range(0, len(texts), batch):
        batch_texts = texts[i:i+batch]
        batch_embs  = await embed_texts(batch_texts)
        all_embeddings.extend(batch_embs)
        logger.debug(f"  Embedded {min(i+batch, len(texts))}/{len(texts)} chunks")

    # Store in Qdrant
    vs.upsert_chunks(repo_path, chunks, all_embeddings)

    # Save cache
    _save_cache(repo_path, new_cache)

    duration = round(time.time() - start, 2)
    logger.info(f"Indexing complete: {len(chunks)} chunks in {duration}s")

    return {
        "status": "completed",
        "files_indexed": len(changed_files),
        "chunks_stored": len(chunks),
        "duration_seconds": duration,
        "errors": errors,
    }
