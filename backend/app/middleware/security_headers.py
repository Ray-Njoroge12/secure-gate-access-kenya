from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Callable
from ..config import get_settings
import logging

settings = get_settings()
logger = logging.getLogger(__name__)

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Enhanced middleware to add comprehensive security headers to all responses
    """

    def __init__(self, app: Callable):
        super().__init__(app)

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        # Essential Security Headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"

        # Prevent MIME type sniffing
        response.headers["X-Download-Options"] = "noopen"

        # Prevent clickjacking
        response.headers["X-Permitted-Cross-Domain-Policies"] = "none"

        # HSTS (HTTP Strict Transport Security) - only in production
        if settings.ENV == "production":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"

        # Enhanced Content Security Policy
        csp = self._get_content_security_policy(request)
        response.headers["Content-Security-Policy"] = csp

        # Log security headers application for monitoring
        if settings.ENV == "development":
            logger.debug("Security headers applied", extra={
                'path': request.url.path,
                'method': request.method,
                'csp_length': len(csp)
            })

        return response

    def _get_content_security_policy(self, request: Request) -> str:
        """
        Generate dynamic Content Security Policy based on request context
        """
        base_csp = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
            "img-src 'self' data: https: blob:",
            "font-src 'self' https://fonts.gstatic.com",
            "connect-src 'self' https://api.",
            "media-src 'none'",
            "object-src 'none'",
            "child-src 'none'",
            "worker-src 'none'",
            "frame-ancestors 'none'",
            "form-action 'self'",
            "upgrade-insecure-requests"
        ]

        # Add additional CSP directives for API endpoints
        if request.url.path.startswith("/api/"):
            base_csp.extend([
                "connect-src 'self'",
                "frame-ancestors 'none'"
            ])

        return "; ".join(base_csp)
