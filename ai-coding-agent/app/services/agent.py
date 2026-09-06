"""
Agent Service — orchestrates the full workflow:
  User Request
       ↓
  Repository Analysis (ensure indexed)
       ↓
  Embedding Search (retrieve relevant chunks)
       ↓
  Build Context (structure + chunks)
       ↓
  Send to LLM
       ↓
  Return Explanation + Code
"""
from __future__ import annotations
from typing import Optional
from loguru import logger

from app.models.schemas import AgentRequest, AgentResponse
from app.services import indexer as idx_svc
from app.services import retrieval as ret_svc
from app.services import llm as llm_svc
from app.services import vector_store as vs
from app.core.config import settings


async def run_agent(request: AgentRequest) -> AgentResponse:
    """
    Main agent entry point.
    Steps:
      1. Auto-index repo if not yet indexed (or changed files exist)
      2. Retrieve relevant chunks
      3. Build rich context
      4. Call LLM
      5. Parse and return response
    """
    repo_path = request.repo_path
    query     = request.query

    logger.info(f"Agent request: '{query[:80]}' | repo={repo_path or 'none (pure coding)'}")

    # ── Pure coding mode (no repo) ─────────────────────────────────────────
    if not repo_path:
        logger.info("No repo path — pure coding mode, calling LLM directly")
        from app.services import llm as llm_svc
        pure_context = f"""You are an expert web developer and software engineer.

User Request: {query}

Generate complete, working, beautiful code to fulfill this request.
Use modern best practices, clean architecture, and impressive design.
"""
        answer, model_used = await llm_svc.generate_code(
            context=pure_context,
            query=query,
            model=request.model,
            provider=request.provider,
        )
        code_blocks = llm_svc.extract_code_blocks(answer)
        return AgentResponse(
            query=query,
            answer=answer,
            code_blocks=code_blocks,
            relevant_files=[],
            chunks_used=0,
            model_used=model_used,
            repo_analyzed=False,
        )

    # ── Step 1: Ensure repository is indexed ──────────────────────────────
    logger.info("Step 1: Checking repository index...")
    if not vs.collection_exists(repo_path):
        logger.info("  → No index found. Indexing repository...")
        index_result = await idx_svc.index_repository(repo_path, force=False)
        logger.info(f"  → Indexed {index_result['files_indexed']} files, "
                    f"{index_result['chunks_stored']} chunks")
    else:
        # Incremental — only re-index changed files
        logger.info("  → Index exists. Checking for changed files...")
        index_result = await idx_svc.index_repository(repo_path, force=False)
        if index_result["status"] == "skipped":
            logger.info("  → No changes detected.")
        else:
            logger.info(f"  → Re-indexed {index_result['files_indexed']} changed files")

    # ── Step 2: Retrieve relevant chunks ─────────────────────────────────
    logger.info("Step 2: Retrieving relevant code chunks...")
    chunks = await ret_svc.retrieve_relevant_chunks(query, repo_path)

    if not chunks:
        logger.warning("  → No relevant chunks found. Trying with lower threshold...")
        chunks = await ret_svc.retrieve_relevant_chunks(
            query, repo_path,
            top_k=settings.retrieval.top_k,
            score_threshold=0.1,
        )

    # ── Step 3: Build context ─────────────────────────────────────────────
    logger.info(f"Step 3: Building context from {len(chunks)} chunks...")
    context = await ret_svc.build_context(query, repo_path, chunks)

    # ── Step 4: Call LLM ──────────────────────────────────────────────────
    logger.info("Step 4: Calling LLM...")
    answer, model_used = await llm_svc.generate_code(
        context=context,
        query=query,
        model=request.model,
        provider=request.provider,
    )

    # ── Step 5: Parse response ────────────────────────────────────────────
    logger.info("Step 5: Parsing response...")
    code_blocks    = llm_svc.extract_code_blocks(answer)
    relevant_files = list(dict.fromkeys(c.file_path for c in chunks))

    logger.info(f"Agent complete. Code blocks: {len(code_blocks)}, Files: {len(relevant_files)}")

    return AgentResponse(
        query=query,
        answer=answer,
        code_blocks=code_blocks,
        relevant_files=relevant_files,
        chunks_used=len(chunks),
        model_used=model_used,
        repo_analyzed=True,
    )
