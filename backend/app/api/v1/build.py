from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from loguru import logger

router = APIRouter(prefix="/build", tags=["Build / Code Editor"])

OPENROUTER_KEY = None  # loaded from settings at runtime
OPENROUTER_URL = "https://openrouter.ai/api/v1"


def _get_or_key() -> str:
    """Get OpenRouter key from env/settings."""
    from app.core.config import settings
    key = settings.OPENROUTER_API_KEY
    if not key:
        raise ValueError("OPENROUTER_API_KEY is not set in environment variables.")
    return key


class CodeGenRequest(BaseModel):
    prompt: str
    html: Optional[str] = ""
    css: Optional[str] = ""
    js: Optional[str] = ""


class CodeGenResponse(BaseModel):
    html: str
    css: str
    js: str
    message: str


SYSTEM_PROMPT = """You are an expert senior frontend engineer. Build STUNNING, professional websites.

MANDATORY RULES:
1. Return ONLY raw JSON: {"html":"...","css":"...","js":"...","message":"..."}
2. NO markdown, NO backticks, NO explanation — pure JSON only

HTML MUST HAVE:
- <!DOCTYPE html> full structure
- <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet">
- <link rel="stylesheet" href="style.css"> and <script src="script.js"></script>
- Real content (no Lorem ipsum)
- Semantic tags: header, nav, main, section, footer

CSS MUST HAVE (minimum 120 lines):
- :root { --bg:#0f0e17; --surface:rgba(255,255,255,0.05); --accent:#6366f1; --text:#fff; }
- * { margin:0; padding:0; box-sizing:border-box; }
- body { font-family:'Inter',sans-serif; background:var(--bg); color:var(--text); }
- Glassmorphism cards: backdrop-filter:blur(20px); border:1px solid rgba(255,255,255,0.1);
- Gradient text: background:linear-gradient(135deg,#6366f1,#a855f7); -webkit-background-clip:text; -webkit-text-fill-color:transparent;
- Animations: @keyframes + transition:all 0.3s cubic-bezier(0.4,0,0.2,1)
- Responsive: @media (max-width:768px)
- Sections with padding:80px 0 and max-width:1200px centered

JS MUST HAVE:
- DOMContentLoaded wrapper
- Sticky navbar on scroll
- IntersectionObserver scroll-reveal animations
- Smooth interactions

DESIGN: dark bg + glassmorphism + gradient accents + big bold typography + professional shadows"""


def build_prompt(req: CodeGenRequest) -> str:
    has_code = bool(req.html or req.css or req.js)
    if has_code:
        return f"""TASK: {req.prompt}

EXISTING CODE (improve/modify — keep what works):
HTML: {req.html[:500] if req.html else 'empty'}
CSS: {req.css[:400] if req.css else 'empty'}
JS: {req.js[:200] if req.js else 'empty'}

Improve the design quality, add missing sections, fix any issues."""
    return f"""TASK: {req.prompt}

Build a COMPLETE, PRODUCTION-QUALITY website with:
- ALL sections fully designed (not skeleton/placeholder)
- Real content (no Lorem ipsum)  
- Beautiful dark theme with glassmorphism
- Smooth CSS animations and scroll effects
- Working JavaScript interactions
- Google Fonts (Inter or similar)
- Responsive layout
- Professional typography and spacing

Make it look like a real website a top agency would build."""


async def _call_openrouter(prompt: str, model: str, max_tokens: int) -> str:
    from openai import AsyncOpenAI
    import re

    client = AsyncOpenAI(
        api_key=_get_or_key(),
        base_url=OPENROUTER_URL,
        default_headers={
            "HTTP-Referer": "https://skilltoincome.ai",
            "X-Title": "SkillToIncome Build Editor",
        },
    )
    resp = await client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user",   "content": prompt},
        ],
        temperature=0.4,
        max_tokens=max_tokens,
        response_format={"type": "json_object"},
    )
    raw = resp.choices[0].message.content or ""
    # Strip DeepSeek think tags
    raw = re.sub(r'<think>[\s\S]*?</think>', '', raw, flags=re.IGNORECASE).strip()
    return raw


async def _call_groq(prompt: str, model: str, max_tokens: int) -> str:
    from app.core.config import settings
    from openai import AsyncOpenAI
    import re

    client = AsyncOpenAI(
        api_key=settings.GROQ_API_KEY,
        base_url="https://api.groq.com/openai/v1",
    )
    resp = await client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user",   "content": prompt},
        ],
        temperature=0.4,
        max_tokens=max_tokens,
        response_format={"type": "json_object"},
    )
    raw = resp.choices[0].message.content or ""
    raw = re.sub(r'<think>[\s\S]*?</think>', '', raw, flags=re.IGNORECASE).strip()
    return raw


@router.post("/generate", response_model=CodeGenResponse)
async def generate_code(
    data: CodeGenRequest,
    current_user=Depends(__import__('app.core.deps', fromlist=['get_current_user']).get_current_user),
):
    import json, re

    user_msg = build_prompt(data)

    # Groq pehle (fast, low latency), OpenRouter fallback (better models)
    attempts = [
        ("groq",       "llama-3.1-8b-instant",                          3500),  # fastest
        ("groq",       "llama-3.3-70b-versatile",                       4000),  # quality
        ("groq",       "gemma2-9b-it",                                  3000),  # fallback
        ("openrouter", "meta-llama/llama-3.3-70b-instruct:free",       4000),  # OR fallback
        ("openrouter", "openai/gpt-oss-120b:free",                      3500),  # OR fallback
        ("openrouter", "nvidia/nemotron-3-super-120b-a12b:free",        3500),  # last resort
    ]

    last_error = None
    for provider, model, max_tok in attempts:
        try:
            logger.info(f"Build: trying {provider}/{model}")
            if provider == "openrouter":
                raw = await _call_openrouter(user_msg, model, max_tok)
            else:
                raw = await _call_groq(user_msg, model, max_tok)

            # Parse JSON
            try:
                parsed = json.loads(raw)
            except json.JSONDecodeError:
                m = re.search(r'\{[\s\S]*\}', raw)
                parsed = json.loads(m.group()) if m else {}

            html = parsed.get("html", "")
            css  = parsed.get("css", "")
            js   = parsed.get("js", "")

            if not html:
                logger.warning(f"{model} returned no HTML, trying next")
                continue

            logger.info(f"Build OK with {provider}/{model}")
            return CodeGenResponse(
                html=html, css=css, js=js,
                message=parsed.get("message", f"Built with {model}"),
            )

        except Exception as e:
            err = str(e)
            if any(x in err for x in ["rate_limit", "429", "413", "402", "quota", "unavailable"]):
                logger.warning(f"{model} rate limited/unavailable, trying next…")
                last_error = e
                continue
            logger.error(f"Build error with {model}: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    raise HTTPException(
        status_code=429,
        detail="All AI models are currently rate limited. Please wait a minute and try again.",
    )
