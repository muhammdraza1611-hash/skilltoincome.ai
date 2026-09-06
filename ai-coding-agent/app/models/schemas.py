from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class IndexRequest(BaseModel):
    repo_path: str
    force_reindex: bool = False


class IndexStatus(BaseModel):
    status: str
    files_indexed: int
    chunks_stored: int
    duration_seconds: float
    errors: List[str] = []


class CodeChunk(BaseModel):
    chunk_id: str
    file_path: str
    file_name: str
    language: str
    content: str
    chunk_number: int
    total_chunks: int
    last_modified: str
    score: Optional[float] = None


class AgentRequest(BaseModel):
    query: str
    repo_path: str
    model: Optional[str] = None          # override model from config
    provider: Optional[str] = None       # override provider


class AgentResponse(BaseModel):
    query: str
    answer: str
    code_blocks: List[Dict[str, str]] = []   # [{"language": "python", "code": "..."}]
    relevant_files: List[str] = []
    chunks_used: int
    model_used: str
    repo_analyzed: bool = True


class SearchRequest(BaseModel):
    query: str
    repo_path: str
    top_k: int = 8


class SearchResponse(BaseModel):
    query: str
    results: List[CodeChunk]
    total_found: int


class RepoStructure(BaseModel):
    repo_path: str
    total_files: int
    languages: Dict[str, int]
    structure: str           # tree string
    indexed_at: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    qdrant: str
    embeddings_model: str
    llm_provider: str
    version: str = "1.0.0"
