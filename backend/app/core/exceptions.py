from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from loguru import logger


class AppException(HTTPException):
    def __init__(self, status_code: int, detail: str, error_code: str = None):
        super().__init__(status_code=status_code, detail=detail)
        self.error_code = error_code


class NotFoundException(AppException):
    def __init__(self, resource: str):
        super().__init__(404, f"{resource} not found", "NOT_FOUND")


class UnauthorizedException(AppException):
    def __init__(self, detail: str = "Unauthorized"):
        super().__init__(401, detail, "UNAUTHORIZED")


class ForbiddenException(AppException):
    def __init__(self, detail: str = "Forbidden"):
        super().__init__(403, detail, "FORBIDDEN")


class ConflictException(AppException):
    def __init__(self, detail: str):
        super().__init__(409, detail, "CONFLICT")


class ValidationException(AppException):
    def __init__(self, detail: str):
        super().__init__(422, detail, "VALIDATION_ERROR")


async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    logger.warning(f"AppException: {exc.status_code} - {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.error_code or "ERROR",
            "detail": exc.detail,
            "status_code": exc.status_code,
        },
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception(f"Unhandled exception: {exc}")
    # Return the actual message for ValueError (e.g. missing API key, invalid JSON)
    if isinstance(exc, ValueError):
        return JSONResponse(
            status_code=400,
            content={"error": "BAD_REQUEST", "detail": str(exc)},
        )
    return JSONResponse(
        status_code=500,
        content={"error": "INTERNAL_SERVER_ERROR", "detail": "An unexpected error occurred"},
    )
