# AI Coding Agent

An intelligent coding assistant that **analyzes your entire repository before generating any code**.

## Project Structure

```
ai-coding-agent/
├── app/
│   ├── main.py                    # FastAPI app entry point
│   ├── core/
│   │   ├── config.py              # Settings from config.yaml + .env
│   │   └── logging.py             # Loguru setup
│   ├── models/
│   │   └── schemas.py             # Pydantic request/response models
│   ├── services/
│   │   ├── embeddings.py          # BAAI/bge-small-en-v1.5 embedding service
│   │   ├── vector_store.py        # Qdrant integration
│   │   ├── indexer.py             # Repository file reader + chunker
│   │   ├── retrieval.py           # Semantic search + context builder
│   │   ├── llm.py                 # OpenRouter / Ollama LLM calls
│   │   └── agent.py               # Main agent orchestrator
│   └── api/
│       └── routes.py              # FastAPI route handlers
├── config.yaml                    # All configuration
├── .env.example                   # Environment variables template
├── requirements.txt
└── README.md
```

## Installation

### 1. Clone and setup
```bash
cd ai-coding-agent
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/Mac
pip install -r requirements.txt
```

### 2. Configure
```bash
cp .env.example .env
```
Edit `.env`:
```env
OPENROUTER_API_KEY=sk-or-your-key-here   # Get free at openrouter.ai
LLM_PROVIDER=openrouter
LLM_MODEL=deepseek/deepseek-coder
```

Or to use Ollama (local):
```env
LLM_PROVIDER=ollama
```
Then run: `ollama pull codellama:13b`

### 3. Run
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

Open http://localhost:8001/docs

---

## How the AI Understands Your Repository

### Step-by-Step Workflow

```
User Request
     ↓
[1] Repository Indexing
    - Reads ALL project files recursively
    - Skips: node_modules, dist, .git, __pycache__, etc.
    - Supports: .py .ts .js .html .css .scss .json .yaml .md
    - Splits large files into overlapping chunks (1500 chars, 200 overlap)
     ↓
[2] Embedding Generation
    - Uses BAAI/bge-small-en-v1.5 locally (no API needed)
    - Generates 384-dim vector for each chunk
    - Normalized for cosine similarity
     ↓
[3] Vector Storage (Qdrant)
    - Stores each chunk with metadata:
      * file_path, file_name, language
      * chunk_number, total_chunks
      * last_modified date
    - In-memory by default (no separate server needed)
    - Incremental: only re-indexes changed files (MD5 hash cache)
     ↓
[4] Query Processing
    - User asks a question
    - Query is embedded using same BAAI model
    - Qdrant cosine similarity search → top-8 relevant chunks
     ↓
[5] Context Building
    - Full repository structure (file tree)
    - List of relevant files found
    - Top-k code chunks with relevance scores
     ↓
[6] LLM Generation
    - System prompt: "You are an expert AI agent. Analyze the repo before coding."
    - Full context sent to LLM (OpenRouter or Ollama)
    - LLM follows existing patterns, naming conventions, architecture
     ↓
[7] Response
    - Explanation of what was found
    - Generated code in proper markdown blocks
    - List of files referenced
```

---

## API Usage

### Index a repository
```bash
curl -X POST http://localhost:8001/api/v1/index \
  -H "Content-Type: application/json" \
  -d '{"repo_path": "C:/projects/my-app", "force_reindex": false}'
```

### Ask the agent
```bash
curl -X POST http://localhost:8001/api/v1/agent \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Add a new API endpoint for user notifications following existing patterns",
    "repo_path": "C:/projects/my-app"
  }'
```

### Search code
```bash
curl -X POST http://localhost:8001/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{"query": "authentication middleware", "repo_path": "C:/projects/my-app"}'
```

### Use different model
```bash
curl -X POST http://localhost:8001/api/v1/agent \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Refactor the user service to use async/await",
    "repo_path": "C:/projects/my-app",
    "model": "anthropic/claude-3.5-sonnet",
    "provider": "openrouter"
  }'
```

---

## Configuration (config.yaml)

| Setting | Description |
|---|---|
| `llm.provider` | `openrouter` or `ollama` |
| `llm.openrouter_model` | e.g. `deepseek/deepseek-coder`, `openai/gpt-4o` |
| `embeddings.model` | `BAAI/bge-small-en-v1.5` (local, free) |
| `embeddings.chunk_size` | Characters per chunk (default: 1500) |
| `qdrant.in_memory` | `true` = no Qdrant server needed |
| `retrieval.top_k` | Number of chunks to retrieve (default: 8) |
| `indexer.ignore_dirs` | Directories to skip |

---

## OpenRouter Free Models
- `deepseek/deepseek-coder` — Best for code generation
- `deepseek/deepseek-chat` — General purpose
- `meta-llama/llama-3.1-70b-instruct:free` — Free tier
- `google/gemma-2-9b-it:free` — Free tier

Get API key at: https://openrouter.ai (free credits included)
