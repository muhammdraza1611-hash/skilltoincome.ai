import json
import re
from typing import Optional
from loguru import logger
from app.core.config import settings


def _extract_json(text: str) -> str:
    """Extract JSON from AI response that may contain extra text."""
    text = text.strip()
    # Try to find JSON block
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    if match:
        return match.group(1).strip()
    # Try to find array or object
    for pattern in [r"(\[[\s\S]*\])", r"(\{[\s\S]*\})"]:
        match = re.search(pattern, text)
        if match:
            return match.group(1)
    return text


async def call_ai(prompt: str, system_prompt: Optional[str] = None, expect_json: bool = True) -> str:
    """Unified AI caller supporting OpenAI, Groq, and Gemini."""
    provider = settings.AI_PROVIDER.lower()

    if provider == "groq":
        if not settings.GROQ_API_KEY:
            raise ValueError("GROQ_API_KEY is not set.")
        return await _call_groq(prompt, system_prompt, expect_json)
    elif provider == "openai":
        if not settings.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY is not set. Please add it to your .env file.")
        return await _call_openai(prompt, system_prompt, expect_json)
    elif provider == "gemini":
        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is not set. Please add it to your .env file.")
        return await _call_gemini(prompt, system_prompt)
    else:
        raise ValueError(f"Unsupported AI provider: {provider}")


async def _call_groq(prompt: str, system_prompt: Optional[str], expect_json: bool) -> str:
    """Groq uses OpenAI-compatible API — llama-3.3-70b-versatile is fast & free."""
    from openai import AsyncOpenAI
    client = AsyncOpenAI(
        api_key=settings.GROQ_API_KEY,
        base_url="https://api.groq.com/openai/v1",
    )
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    kwargs = {
        "model": "llama-3.1-8b-instant",
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 4096,
    }
    # Groq supports JSON mode
    if expect_json:
        kwargs["response_format"] = {"type": "json_object"}

    try:
        response = await client.chat.completions.create(**kwargs)
        return response.choices[0].message.content
    except Exception as e:
        logger.error(f"Groq error: {e}")
        raise


async def _call_openai(prompt: str, system_prompt: Optional[str], expect_json: bool) -> str:
    from openai import AsyncOpenAI
    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    kwargs = {
        "model": "gpt-4o-mini",
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 4096,
    }
    if expect_json:
        kwargs["response_format"] = {"type": "json_object"}

    try:
        response = await client.chat.completions.create(**kwargs)
        return response.choices[0].message.content
    except Exception as e:
        logger.error(f"OpenAI error: {e}")
        raise


async def _call_gemini(prompt: str, system_prompt: Optional[str]) -> str:
    import google.generativeai as genai
    genai.configure(api_key=settings.GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-1.5-flash")

    full_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
    try:
        response = await model.generate_content_async(full_prompt)
        return _extract_json(response.text)
    except Exception as e:
        logger.error(f"Gemini error: {e}")
        raise


async def parse_ai_json(response: str) -> dict | list:
    """Parse and clean JSON from AI response."""
    text = response.strip()

    # Try direct parse first (fastest, most reliable)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Try extracting from markdown code block
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    if match:
        try:
            return json.loads(match.group(1).strip())
        except json.JSONDecodeError:
            pass

    # Try to find the outermost JSON object or array using decoder
    for start_char, end_char in [('{', '}'), ('[', ']')]:
        start = text.find(start_char)
        if start == -1:
            continue
        # Walk from the end to find matching close
        depth = 0
        end = -1
        in_string = False
        escape = False
        for i, ch in enumerate(text[start:], start):
            if escape:
                escape = False
                continue
            if ch == '\\' and in_string:
                escape = True
                continue
            if ch == '"':
                in_string = not in_string
                continue
            if in_string:
                continue
            if ch == start_char:
                depth += 1
            elif ch == end_char:
                depth -= 1
                if depth == 0:
                    end = i + 1
                    break
        if end != -1:
            try:
                return json.loads(text[start:end])
            except json.JSONDecodeError:
                pass

    logger.error(f"Failed to parse AI JSON.\nResponse: {text[:500]}")
    raise ValueError("AI returned invalid JSON")
