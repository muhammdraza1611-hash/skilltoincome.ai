"""
YouTube search using YouTube's internal suggest API + oEmbed
No API key needed — uses public endpoints only.
"""
import httpx
import urllib.parse
from loguru import logger


async def search_youtube_video(query: str) -> dict | None:
    """
    Search YouTube for a video matching the query.
    Returns dict with title, video_id, url, thumbnail or None.
    Uses YouTube's public search suggest + a known-good fallback.
    """
    try:
        # Use YouTube's internal search API (no key needed, same as browser)
        encoded = urllib.parse.quote_plus(query + " tutorial")
        search_url = f"https://www.youtube.com/results?search_query={encoded}"

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept-Language": "en-US,en;q=0.9",
        }

        async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
            resp = await client.get(search_url, headers=headers)
            html = resp.text

            # Extract video IDs from page source
            import re
            video_ids = re.findall(r'"videoId":"([a-zA-Z0-9_-]{11})"', html)

            if not video_ids:
                return _fallback_search_url(query)

            video_id = video_ids[0]

            # Get video title via oEmbed
            oembed_url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json"
            try:
                oembed = await client.get(oembed_url, headers=headers, timeout=5)
                if oembed.status_code == 200:
                    data = oembed.json()
                    return {
                        "title": data.get("title", query),
                        "url": f"https://www.youtube.com/watch?v={video_id}",
                        "type": "video",
                        "thumbnail": data.get("thumbnail_url", ""),
                    }
            except Exception:
                pass

            # Return without title if oEmbed fails
            return {
                "title": f"YouTube: {query} tutorial",
                "url": f"https://www.youtube.com/watch?v={video_id}",
                "type": "video",
                "thumbnail": f"https://img.youtube.com/vi/{video_id}/mqdefault.jpg",
            }

    except Exception as e:
        logger.warning(f"YouTube search failed for '{query}': {e}")
        return _fallback_search_url(query)


def _fallback_search_url(query: str) -> dict:
    """Returns a YouTube search URL as fallback — always works."""
    encoded = urllib.parse.quote_plus(query + " tutorial for beginners")
    return {
        "title": f"Search YouTube: {query} tutorial",
        "url": f"https://www.youtube.com/results?search_query={encoded}",
        "type": "video",
        "thumbnail": "",
    }
