from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from ..config import get_settings

settings = get_settings()

# Rate Limiting Configuration
limiter = Limiter(key_func=get_remote_address)

# Custom rate limit exceeded handler
def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    """
    Custom handler for rate limit exceeded errors
    """
    return JSONResponse(
        status_code=429,
        content={
            "error": "Too Many Requests",
            "message": "Rate limit exceeded. Please try again later.",
            "retry_after": exc.retry_after
        },
        headers={"Retry-After": str(exc.retry_after)}
    )

def setup_rate_limiting(app):
    """
    Configure rate limiting middleware
    """
    # Add SlowAPI middleware
    app.add_middleware(SlowAPIMiddleware)

    # Register custom exception handler
    app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

    return limiter
