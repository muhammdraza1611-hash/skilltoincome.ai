"""
FastAPI Routes for the AI Coding Agent.
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
import json as _json
from loguru import logger

from app.models.schemas import (
    IndexRequest, IndexStatus,
    AgentRequest, AgentResponse,
    SearchRequest, SearchResponse,
    RepoStructure, HealthResponse, CodeChunk,
)
from app.services import agent as agent_svc
from app.services import indexer as idx_svc
from app.services import retrieval as ret_svc
from app.services import vector_store as vs
from app.services.github_reader import clone_github_to_temp, parse_github_url
from app.core.config import settings

router = APIRouter()


# ─── Health ───────────────────────────────────────────────────────────────────

@router.get("/health", response_model=HealthResponse, tags=["System"])
async def health():
    """Check system health — embeddings, Qdrant, LLM config."""
    try:
        from app.services.embeddings import get_embedding_dim
        dim = get_embedding_dim()
        emb_status = f"OK (dim={dim})"
    except Exception as e:
        emb_status = f"ERROR: {e}"

    qdrant_status = "OK (in-memory)" if settings.qdrant.in_memory else "remote"

    return HealthResponse(
        status="healthy",
        qdrant=qdrant_status,
        embeddings_model=settings.embeddings.model,
        llm_provider=settings.llm.provider,
    )


# ─── Index ────────────────────────────────────────────────────────────────────

@router.post("/index", response_model=IndexStatus, tags=["Indexer"])
async def index_repository(req: IndexRequest):
    """
    Index a repository — supports:
    - Local path: `{"repo_path": "C:/myproject"}`
    - GitHub URL: `{"repo_path": "https://github.com/owner/repo"}`
    """
    try:
        repo_path = req.repo_path

        # Auto-detect GitHub URL
        if "github.com" in repo_path:
            from app.services.github_reader import clone_github_to_temp
            logger.info(f"GitHub URL detected — fetching: {repo_path}")
            repo_path = await clone_github_to_temp(repo_path)
            logger.info(f"Using temp dir: {repo_path}")

        result = await idx_svc.index_repository(repo_path, force=req.force_reindex)
        return IndexStatus(**result)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.exception(f"Indexing failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/index/{repo_path:path}/status", tags=["Indexer"])
async def index_status(repo_path: str):
    """Check if a repository has been indexed."""
    exists  = vs.collection_exists(repo_path)
    count   = vs.get_collection_count(repo_path) if exists else 0
    return {"indexed": exists, "chunks": count, "repo_path": repo_path}


@router.get("/index/{repo_path:path}/structure", response_model=RepoStructure, tags=["Indexer"])
async def repo_structure(repo_path: str):
    """Get the file structure of a repository."""
    try:
        files     = idx_svc.collect_files(repo_path)
        structure = idx_svc.build_repo_structure(repo_path, files)

        # Count languages
        from collections import Counter
        langs = Counter(idx_svc._detect_language(f) for f in files)

        return RepoStructure(
            repo_path=repo_path,
            total_files=len(files),
            languages=dict(langs),
            structure=structure,
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ─── Search ───────────────────────────────────────────────────────────────────

@router.post("/search", response_model=SearchResponse, tags=["Retrieval"])
async def search_code(req: SearchRequest):
    """
    Search the indexed repository for relevant code chunks.
    Useful for testing retrieval quality before running the full agent.
    """
    if not vs.collection_exists(req.repo_path):
        raise HTTPException(
            status_code=404,
            detail=f"Repository not indexed: {req.repo_path}. Call POST /index first."
        )
    try:
        chunks = await ret_svc.retrieve_relevant_chunks(
            req.query, req.repo_path, top_k=req.top_k
        )
        return SearchResponse(
            query=req.query,
            results=chunks,
            total_found=len(chunks),
        )
    except Exception as e:
        logger.exception(f"Search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ─── Agent ────────────────────────────────────────────────────────────────────

@router.post("/agent", response_model=AgentResponse, tags=["Agent"])
async def run_agent(req: AgentRequest):
    """
    Main agent endpoint. Supports:
    - Local repo: `{"query": "...", "repo_path": "C:/myproject"}`
    - GitHub URL: `{"query": "...", "repo_path": "https://github.com/owner/repo"}`
    - No repo (pure coding): `{"query": "Build a todo app", "repo_path": ""}`

    Workflow:
    1. If GitHub URL → fetch repo to temp dir
    2. Auto-index repository (incremental)
    3. Embed query → search Qdrant
    4. Build context (structure + relevant files)
    5. Send to LLM → return explanation + code
    """
    try:
        # Resolve GitHub URL to temp local path
        if req.repo_path and "github.com" in req.repo_path:
            logger.info(f"GitHub URL detected in agent request: {req.repo_path}")
            local_path = await clone_github_to_temp(req.repo_path)
            req = AgentRequest(
                query=req.query,
                repo_path=local_path,
                model=req.model,
                provider=req.provider,
            )

        response = await agent_svc.run_agent(req)
        return response
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception(f"Agent error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/agent/stream", tags=["Agent"])
async def stream_agent(req: AgentRequest):
    """
    Streaming agent endpoint — returns Server-Sent Events.
    Frontend receives tokens in real-time as they are generated.

    SSE event types:
    - `status`: progress messages (indexing, searching, etc.)
    - `token`: individual text tokens from LLM
    - `done`: final JSON with code_blocks, relevant_files, model_used
    - `error`: error message
    """
    async def event_stream():
        import json

        def sse(event: str, data: str) -> str:
            # Escape newlines so SSE parser doesn't break
            escaped = data.replace("\n", "\\n").replace("\r", "")
            return f"event: {event}\ndata: {escaped}\n\n"

        try:
            # Resolve GitHub URL
            repo_path = req.repo_path
            if repo_path and "github.com" in repo_path:
                yield sse("status", f"📦 Fetching GitHub repo: {repo_path}…")
                repo_path = await clone_github_to_temp(repo_path)
                yield sse("status", f"✅ Repo fetched — indexing…")

            # Build a local req with resolved path
            from app.models.schemas import AgentRequest as AR
            local_req = AR(
                query=req.query,
                repo_path=repo_path or "",
                model=req.model,
                provider=req.provider,
            )

            full_answer = ""
            relevant_files = []
            chunks_used = 0
            model_used = ""

            # Pure mode (no repo)
            if not repo_path:
                yield sse("status", "🤖 Pure AI coding mode…")
                from app.services.llm import stream_code, extract_code_blocks
                context = f"""You are an expert web developer and software engineer.
User Request: {req.query}
Generate complete, working, beautiful code. Use modern best practices and impressive design."""

                async for token in stream_code(context, req.query, req.model, req.provider):
                    full_answer += token
                    yield sse("token", token)

            else:
                # Repo-aware mode
                yield sse("status", "🔍 Indexing repository…")
                from app.services import indexer as idx_svc
                from app.services import retrieval as ret_svc
                from app.services import vector_store as vs
                from app.services.llm import stream_code, extract_code_blocks
                from app.services.retrieval import build_context

                # Index
                if not vs.collection_exists(repo_path):
                    result = await idx_svc.index_repository(repo_path, force=False)
                    yield sse("status", f"✅ Indexed {result['files_indexed']} files, {result['chunks_stored']} chunks")
                else:
                    result = await idx_svc.index_repository(repo_path, force=False)
                    if result["status"] != "skipped":
                        yield sse("status", f"🔄 Re-indexed {result['files_indexed']} changed files")
                    else:
                        yield sse("status", "✅ Using cached index")

                # Retrieve
                yield sse("status", "🔎 Searching relevant code chunks…")
                chunks = await ret_svc.retrieve_relevant_chunks(req.query, repo_path)
                chunks_used = len(chunks)
                relevant_files = list(dict.fromkeys(c.file_path for c in chunks))
                yield sse("status", f"📄 Found {chunks_used} relevant chunks in {len(relevant_files)} files")

                # Build context
                yield sse("status", "🧠 Building context for LLM…")
                context = await build_context(req.query, repo_path, chunks)

                # Stream LLM
                yield sse("status", "✨ Generating code…")
                async for token in stream_code(context, req.query, req.model, req.provider):
                    full_answer += token
                    yield sse("token", token)

            # Extract code blocks from full answer
            from app.services.llm import extract_code_blocks
            code_blocks = extract_code_blocks(full_answer)

            # Done — send final summary
            yield sse("done", json.dumps({
                "code_blocks": code_blocks,
                "relevant_files": relevant_files,
                "chunks_used": chunks_used,
                "model_used": model_used or "openrouter",
                "repo_analyzed": bool(repo_path),
            }))

        except Exception as e:
            logger.exception(f"Stream error: {e}")
            yield sse("error", str(e))

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/models", tags=["Agent"])
async def list_models():
    """List available LLM models for OpenRouter."""
    return {
        "provider": settings.llm.provider,
        "current_model": (
            settings.llm.openrouter_model
            if settings.llm.provider == "openrouter"
            else settings.llm.ollama_model
        ),
        "openrouter_models": [
            "deepseek/deepseek-coder",
            "deepseek/deepseek-chat",
            "anthropic/claude-3.5-sonnet",
            "openai/gpt-4o",
            "openai/gpt-4o-mini",
            "meta-llama/llama-3.1-70b-instruct",
            "google/gemini-pro-1.5",
            "mistralai/codestral-latest",
        ],
        "ollama_hint": "Run `ollama list` to see local models",
    }
