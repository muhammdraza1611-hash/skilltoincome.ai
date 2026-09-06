"""
AI Coding Agent — FastAPI Application Entry Point
"""
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from app.core.config import settings
from app.core.logging import setup_logging
from app.api.routes import router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    setup_logging(debug=True)
    os.makedirs("logs", exist_ok=True)
    logger.info("=" * 50)
    logger.info("AI Coding Agent starting up")
    logger.info(f"LLM Provider : {settings.llm.provider}")
    logger.info(f"LLM Model    : {settings.llm.openrouter_model}")
    logger.info(f"Embeddings   : {settings.embeddings.model}")
    logger.info(f"Qdrant       : {'in-memory' if settings.qdrant.in_memory else 'remote'}")
    logger.info("=" * 50)

    # Pre-load embedding model
    logger.info("Pre-loading embedding model...")
    try:
        from app.services.embeddings import get_embedding_dim
        dim = get_embedding_dim()
        logger.info(f"Embedding model ready (dim={dim})")
    except Exception as e:
        logger.error(f"Failed to load embedding model: {e}")

    yield
    # Shutdown
    logger.info("AI Coding Agent shutting down")


app = FastAPI(
    title="AI Coding Agent",
    description="""
## AI Coding Agent

An intelligent coding assistant that **analyzes your entire repository** before generating code.

### How it works:
1. **Index** → reads all project files, generates embeddings, stores in Qdrant
2. **Retrieve** → when you ask a question, finds the most relevant code chunks
3. **Analyze** → builds context from repo structure + relevant files
4. **Generate** → sends context to LLM, which generates code following your patterns

### Key Features:
- ✅ Repository-aware code generation (never generates without context)
- ✅ Incremental indexing (only re-indexes changed files)
- ✅ Local embeddings (BAAI/bge-small-en-v1.5)
- ✅ Qdrant vector database (in-memory or remote)
- ✅ OpenRouter (GPT-4o, Claude, DeepSeek) or Ollama (local models)
""",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200", "http://localhost:4201", "http://127.0.0.1:4200", "*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api/v1")


@app.get("/")
async def root():
    return {
        "name": "AI Coding Agent",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "running",
        "workflow": [
            "POST /api/v1/index         → Index your repository",
            "POST /api/v1/search        → Search for relevant code",
            "POST /api/v1/agent         → Ask AI to generate code",
            "GET  /api/v1/health        → Check system health",
        ],
    }
