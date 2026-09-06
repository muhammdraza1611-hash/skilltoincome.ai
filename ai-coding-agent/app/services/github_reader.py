"""
GitHub Repository Reader — fetch code directly from GitHub without cloning.
Uses GitHub raw content URLs for fast parallel fetching (no rate limit issues).
"""
from __future__ import annotations
import re
import tempfile
import asyncio
from pathlib import Path
from typing import Optional
from loguru import logger
import httpx

SUPPORTED_EXTENSIONS = {
    ".py", ".ts", ".tsx", ".js", ".jsx",
    ".html", ".css", ".scss", ".json",
    ".yaml", ".yml", ".md", ".toml"
}
IGNORE_DIRS = {
    "node_modules", "dist", "build", ".git", "__pycache__",
    ".angular", "venv", ".venv", ".cache", "coverage", ".next"
}
MAX_FILE_SIZE = 150 * 1024   # 150KB
MAX_FILES     = 80            # cap to avoid long waits
CONCURRENCY   = 20            # parallel downloads


def parse_github_url(url: str) -> tuple[str, str, str]:
    """Extract owner, repo, branch from GitHub URL."""
    url = url.rstrip("/")
    pattern = r"github\.com/([^/]+)/([^/]+?)(?:\.git)?(?:/tree/([^/]+))?$"
    m = re.search(pattern, url)
    if not m:
        raise ValueError(f"Invalid GitHub URL: {url}")
    return m.group(1), m.group(2), m.group(3) or "main"


def _should_include(file_path: str) -> bool:
    p = Path(file_path)
    for part in p.parts:
        if part in IGNORE_DIRS or part.startswith("."):
            continue
    for part in p.parts[:-1]:  # directories only
        if part in IGNORE_DIRS:
            return False
    return p.suffix.lower() in SUPPORTED_EXTENSIONS


async def _get_default_branch(owner: str, repo: str, headers: dict) -> str:
    """Get the default branch name."""
    async with httpx.AsyncClient(timeout=10) as c:
        r = await c.get(
            f"https://api.github.com/repos/{owner}/{repo}",
            headers=headers
        )
        if r.status_code == 200:
            return r.json().get("default_branch", "main")
    return "main"


async def _fetch_tree(owner: str, repo: str, branch: str, headers: dict) -> list[dict]:
    """Get full file tree via GitHub API."""
    async with httpx.AsyncClient(timeout=20) as c:
        r = await c.get(
            f"https://api.github.com/repos/{owner}/{repo}/git/trees/{branch}?recursive=1",
            headers=headers
        )
        if r.status_code == 404:
            # Try master
            r = await c.get(
                f"https://api.github.com/repos/{owner}/{repo}/git/trees/master?recursive=1",
                headers=headers
            )
        r.raise_for_status()
        return r.json().get("tree", [])


async def _fetch_raw(session: httpx.AsyncClient, owner: str, repo: str,
                     branch: str, path: str) -> Optional[str]:
    """Fetch raw file content using shared client."""
    url = f"https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}"
    try:
        r = await session.get(url)
        if r.status_code == 200 and len(r.content) <= MAX_FILE_SIZE:
            return r.text
    except Exception:
        pass
    return None


async def clone_github_to_temp(github_url: str, token: Optional[str] = None) -> str:
    """
    Fetch a GitHub repo and save files to a temp directory.
    Uses raw.githubusercontent.com for fast parallel downloads.
    Returns the temp directory path.
    """
    owner, repo, branch = parse_github_url(github_url)
    logger.info(f"Fetching GitHub: {owner}/{repo}")

    headers = {"Accept": "application/vnd.github.v3+json"}
    if token:
        headers["Authorization"] = f"token {token}"

    # Get default branch if not specified in URL
    if branch == "main":
        branch = await _get_default_branch(owner, repo, headers)

    # Get file tree
    try:
        tree = await _fetch_tree(owner, repo, branch, headers)
    except Exception as e:
        raise ValueError(f"Could not fetch repo tree for {owner}/{repo}: {e}")

    # Filter to supported files
    files = [
        item["path"] for item in tree
        if item["type"] == "blob" and _should_include(item["path"])
    ]

    # Prioritize important files, limit total
    priority = ["README", "package.json", "requirements", "main", "index", "app", "config"]
    files.sort(key=lambda f: (
        0 if any(p in Path(f).stem.lower() for p in priority) else 1,
        len(f.split("/"))  # shallower files first
    ))
    files = files[:MAX_FILES]
    logger.info(f"Fetching {len(files)} files from {owner}/{repo}@{branch}")

    # Create temp dir
    tmp = tempfile.mkdtemp(prefix=f"gh_{repo}_")

    # Parallel download — single shared client, semaphore for concurrency
    sem = asyncio.Semaphore(CONCURRENCY)

    async def fetch_one(path: str, client: httpx.AsyncClient) -> tuple[str, Optional[str]]:
        async with sem:
            content = await _fetch_raw(client, owner, repo, branch, path)
            return path, content

    async with httpx.AsyncClient(follow_redirects=True, timeout=15) as shared_client:
        tasks = [fetch_one(f, shared_client) for f in files]
        results = await asyncio.gather(*tasks)

    written = 0
    for path, content in results:
        if not content:
            continue
        out = Path(tmp) / path
        out.parent.mkdir(parents=True, exist_ok=True)
        try:
            out.write_text(content, encoding="utf-8", errors="ignore")
            written += 1
        except Exception:
            pass

    logger.info(f"✅ Saved {written}/{len(files)} files to {tmp}")
    return tmp
