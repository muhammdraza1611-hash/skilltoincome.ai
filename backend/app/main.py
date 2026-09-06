from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request as StarletteRequest
from starlette.responses import Response as StarletteResponse
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from loguru import logger
import os

from app.core.config import settings
from app.core.exceptions import AppException, app_exception_handler, generic_exception_handler
from app.api.v1.router import api_router

# Rate limiter
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title=settings.APP_NAME,
    description="AI-powered platform to help students convert skills into income",
    version=settings.APP_VERSION,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# Middleware — CORS: allow all localhost origins (any port)
import re as _re

class DynamicCORSMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: StarletteRequest, call_next):
        origin = request.headers.get("origin", "")
        # Allow any localhost or 127.0.0.1 origin
        allowed = bool(_re.match(r'https?://(localhost|127\.0\.0\.1)(:\d+)?$', origin))
        
        if request.method == "OPTIONS":
            response = StarletteResponse(status_code=200)
        else:
            response = await call_next(request)
        
        if allowed or not origin:
            response.headers["Access-Control-Allow-Origin"]      = origin or "*"
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"]     = "GET,POST,PUT,PATCH,DELETE,OPTIONS"
            response.headers["Access-Control-Allow-Headers"]     = "*"
            response.headers["Access-Control-Expose-Headers"]    = "*"
        
        return response

app.add_middleware(DynamicCORSMiddleware)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Exception handlers
app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

# Static files for uploads
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# API routes
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": settings.APP_VERSION, "app": settings.APP_NAME}


@app.on_event("startup")
async def startup_event():
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")


@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down...")
