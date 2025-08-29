from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from ..config import get_settings
import logging

settings = get_settings()
logger = logging.getLogger(__name__)

# Rate Limiting Configuration with different limits for different endpoints
limiter = Limiter(key_func=get_remote_address)

# Rate limit configurations
RATE_LIMITS = {
    "auth": "10/minute",  # Authentication endpoints
    "api": "100/minute",  # General API endpoints
    "sensitive": "5/minute",  # Sensitive operations
    "health": "60/minute",  # Health check endpoints
}

# Custom rate limit exceeded handler with enhanced logging
def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    """
    Custom handler for rate limit exceeded errors with security logging
    """
    # Log rate limit violations for security monitoring
    logger.warning(
        f"Rate limit exceeded for {request.method} {request.url.path}",
        extra={
            'client_ip': request.client.host if request.client else 'unknown',
            'user_agent': request.headers.get('user-agent', 'unknown'),
            'endpoint': request.url.path,
            'retry_after': exc.retry_after
        }
    )

    return JSONResponse(
        status_code=429,
        content={
            "error": "Too Many Requests",
            "message": "Rate limit exceeded. Please try again later.",
            "retry_after": exc.retry_after,
            "details": {
                "endpoint": request.url.path,
                "client_ip": request.client.host if request.client else 'unknown'
            }
        },
        headers={
            "Retry-After": str(exc.retry_after),
            "X-RateLimit-Reset": str(exc.retry_after)
        }
    )

def setup_rate_limiting(app):
    """
    Configure rate limiting middleware with enhanced security
    """
    # Add SlowAPI middleware
    app.add_middleware(SlowAPIMiddleware)

    # Register custom exception handler
    app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

    # Log rate limiting setup
    logger.info("Rate limiting middleware configured", extra={
        'rate_limits': RATE_LIMITS,
        'environment': settings.ENV
    })

    return limiter
