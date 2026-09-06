"""
LLM Service — supports OpenRouter and Ollama.
"""
from __future__ import annotations
import re
import json as _json_module
from typing import Optional, List, Dict
from loguru import logger

from app.core.config import settings


AGENT_SYSTEM_PROMPT = """You are an expert AI coding agent AND senior frontend engineer. You analyze repositories AND build stunning websites.

## WHEN GENERATING WEB CODE — ALWAYS FOLLOW THESE RULES:

### HTML: Always use this structure
- Semantic HTML5 (header, nav, main, section, footer, article)
- Google Fonts: <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
- Meta viewport tag for responsiveness
- Link to style.css and script.js separately

### CSS: Professional quality mandatory
- CSS Custom Properties (variables) for colors, spacing, fonts
- Dark theme: --bg: #0f0e17; --surface: rgba(255,255,255,0.05);
- Glassmorphism: backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1);
- Smooth animations: transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
- Scroll reveal with IntersectionObserver
- Gradient headings: background: linear-gradient(...); -webkit-background-clip: text;
- Minimum 150 lines of CSS
- Fully responsive with @media queries

### JS: Working interactions
- DOMContentLoaded wrapper
- Sticky navbar on scroll
- Smooth scroll for anchor links
- IntersectionObserver for scroll animations
- All buttons/forms functional

### DESIGN PRINCIPLES:
1. Large, bold typography (h1: 60-80px, font-weight: 900)
2. Deep dark backgrounds (#0f0e17 or #08111a)
3. Strong accent color (purple/cyan/coral gradient)
4. Generous whitespace (sections: 80-120px padding)
5. Real content — no Lorem ipsum placeholders
6. Professional shadows (box-shadow: 0 20px 60px rgba(0,0,0,0.5))
7. Hover effects on all interactive elements

## WHEN ANALYZING REPOSITORY — FOLLOW THESE RULES:
1. Analyze the provided repository context
2. Understand existing architecture, patterns, naming conventions
3. Generate code that integrates cleanly with the existing codebase
4. Reuse existing services, components, and utilities
5. Follow the project's coding style exactly

## RESPONSE FORMAT:
- Provide brief analysis of what you found/built
- Explain your approach
- Provide complete code in proper markdown code blocks
- Use ```html, ```css, ```javascript for code blocks
- End with placement instructions"""


async def generate_code(
    context: str,
    query: str,
    model: Optional[str] = None,
    provider: Optional[str] = None,
) -> tuple[str, str]:
    """
    Send context + query to LLM and return (response_text, model_used).
    Tries free models in order if rate limited.
    """
    prov  = provider or settings.llm.provider
    mdl   = model or (
        settings.llm.openrouter_model if prov == "openrouter"
        else settings.llm.ollama_model
    )

    messages = [
        {"role": "system", "content": AGENT_SYSTEM_PROMPT},
        {"role": "user",   "content": context},
    ]

    if prov == "ollama":
        logger.info(f"Calling Ollama | model={mdl}")
        response = await _call_ollama(messages, mdl)
        return _clean_response(response), mdl

    # OpenRouter — try free models in order (faster first)
    free_models = [
        mdl,                                              # configured model first
        "meta-llama/llama-3.3-70b-instruct:free",        # Fast 70B — try first
        "nvidia/nemotron-3-super-120b-a12b:free",        # 120B quality fallback
        "qwen/qwen3-coder:free",                         # coding specialized
        "openai/gpt-oss-120b:free",                      # OpenAI OSS
        "nousresearch/hermes-3-llama-3.1-405b:free",     # 405B last resort
    ]
    # Deduplicate while preserving order
    seen = set()
    ordered = []
    for m in free_models:
        if m not in seen:
            seen.add(m)
            ordered.append(m)

    last_err = None
    for attempt_model in ordered:
        try:
            logger.info(f"Calling OpenRouter | model={attempt_model}")
            response = await _call_openrouter(messages, attempt_model)
            return _clean_response(response), attempt_model
        except Exception as e:
            err = str(e)
            if any(x in err for x in ["rate_limit", "429", "402", "quota"]):
                logger.warning(f"Model {attempt_model} rate limited, trying next…")
                last_err = e
                continue
            raise

    raise last_err or RuntimeError("All models failed")


async def _call_openrouter(messages: List[Dict], model: str) -> str:
    from openai import AsyncOpenAI

    if not settings.llm.openrouter_api_key:
        raise ValueError("OPENROUTER_API_KEY not set. Add it to .env file.")

    client = AsyncOpenAI(
        api_key=settings.llm.openrouter_api_key,
        base_url=settings.llm.openrouter_base_url,
        default_headers={
            "HTTP-Referer": "https://ai-coding-agent.local",
            "X-Title": "AI Coding Agent",
        },
    )

    resp = await client.chat.completions.create(
        model=model,
        messages=messages,
        max_tokens=settings.llm.max_tokens,
        temperature=settings.llm.temperature,
    )
    return resp.choices[0].message.content


async def _call_ollama(messages: List[Dict], model: str) -> str:
    import httpx

    payload = {
        "model": model,
        "messages": messages,
        "stream": False,
        "options": {
            "temperature": settings.llm.temperature,
            "num_predict": settings.llm.max_tokens,
        },
    }

    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(
            f"{settings.llm.ollama_base_url}/api/chat",
            json=payload,
        )
        resp.raise_for_status()
        data = resp.json()
        return data["message"]["content"]


async def stream_code(
    context: str,
    query: str,
    model: Optional[str] = None,
    provider: Optional[str] = None,
):
    """Stream LLM response token by token. Yields text chunks."""
    prov = provider or settings.llm.provider
    mdl  = model or (
        settings.llm.openrouter_model if prov == "openrouter"
        else settings.llm.ollama_model
    )

    messages = [
        {"role": "system", "content": AGENT_SYSTEM_PROMPT},
        {"role": "user",   "content": context},
    ]

    if prov == "ollama":
        async for chunk in _stream_ollama(messages, mdl):
            yield chunk
        return

    # OpenRouter streaming — try models in order
    free_models = [
        mdl,
        "meta-llama/llama-3.3-70b-instruct:free",
        "nvidia/nemotron-3-super-120b-a12b:free",
        "qwen/qwen3-coder:free",
        "openai/gpt-oss-120b:free",
    ]
    seen = set()
    ordered = []
    for m in free_models:
        if m not in seen:
            seen.add(m)
            ordered.append(m)

    for attempt_model in ordered:
        try:
            logger.info(f"Streaming OpenRouter | model={attempt_model}")
            async for chunk in _stream_openrouter(messages, attempt_model):
                yield chunk
            return
        except Exception as e:
            err = str(e)
            if any(x in err for x in ["rate_limit", "429", "402", "quota"]):
                logger.warning(f"Model {attempt_model} rate limited, trying next…")
                continue
            raise


async def _stream_openrouter(messages: List[Dict], model: str):
    from openai import AsyncOpenAI
    if not settings.llm.openrouter_api_key:
        raise ValueError("OPENROUTER_API_KEY not set.")

    client = AsyncOpenAI(
        api_key=settings.llm.openrouter_api_key,
        base_url=settings.llm.openrouter_base_url,
        default_headers={
            "HTTP-Referer": "https://ai-coding-agent.local",
            "X-Title": "AI Coding Agent",
        },
    )

    in_think = False
    response = await client.chat.completions.create(
        model=model,
        messages=messages,
        max_tokens=settings.llm.max_tokens,
        temperature=settings.llm.temperature,
        stream=True,
    )
    async for chunk in response:
        if not chunk.choices:
            continue
        delta = chunk.choices[0].delta.content
        if delta is None:
            continue
        # Strip DeepSeek <think> blocks
        if "<think>" in delta:
            in_think = True
        if "</think>" in delta:
            in_think = False
            delta = delta.split("</think>", 1)[-1]
        if not in_think and delta:
            yield delta


async def _stream_ollama(messages: List[Dict], model: str):
    import httpx
    payload = {
        "model": model,
        "messages": messages,
        "stream": True,
        "options": {"temperature": settings.llm.temperature},
    }
    async with httpx.AsyncClient(timeout=120) as client:
        async with client.stream("POST", f"{settings.llm.ollama_base_url}/api/chat", json=payload) as r:
            async for line in r.aiter_lines():
                if line:
                    try:
                        data = _json_module.loads(line)
                        content = data.get("message", {}).get("content", "")
                        if content:
                            yield content
                    except Exception:
                        pass


def _clean_response(text: str) -> str:
    """Remove DeepSeek R1 <think>...</think> reasoning blocks from response."""
    cleaned = re.sub(r'<think>[\s\S]*?</think>', '', text, flags=re.IGNORECASE).strip()
    return cleaned if cleaned else text


def extract_code_blocks(text: str) -> List[Dict[str, str]]:
    """Extract ```lang ... ``` code blocks from LLM response."""
    pattern = r"```(\w+)?\n([\s\S]*?)```"
    blocks = []
    for m in re.finditer(pattern, text):
        lang = m.group(1) or "text"
        code = m.group(2).strip()
        if code:
            blocks.append({"language": lang, "code": code})
    return blocks
