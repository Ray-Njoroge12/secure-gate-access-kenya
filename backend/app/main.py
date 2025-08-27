from fastapi import FastAPI
from .config import get_settings
from .routers import visitors, access_codes, auth, analytics, security, roles, invitations
from .database import engine
from . import models
from .middleware import (
    setup_cors,
    setup_rate_limiting,
    SecurityHeadersMiddleware,
    InputValidationMiddleware
)

settings = get_settings()


def create_app() -> FastAPI:
    app = FastAPI(
        title="Secure Gate Backend",
        version="0.1.0",
        description="Secure visitor management system with RBAC"
    )

    # Create tables if DB configured
    try:
        if engine:
            models.Base.metadata.create_all(bind=engine)
    except Exception:
        pass

    # Security Middleware - Order matters!
    # 1. CORS - must be first
    setup_cors(app)

    # 2. Rate Limiting
    limiter = setup_rate_limiting(app)

    # 3. Security Headers
    app.add_middleware(SecurityHeadersMiddleware)

    # 4. Input Validation
    app.add_middleware(InputValidationMiddleware)

    # Include routers
    app.include_router(visitors.router, prefix=settings.API_PREFIX)
    app.include_router(access_codes.router, prefix=settings.API_PREFIX)
    app.include_router(auth.router, prefix=settings.API_PREFIX)
    app.include_router(analytics.router, prefix=settings.API_PREFIX)
    app.include_router(security.router, prefix=settings.API_PREFIX)
    app.include_router(roles.router, prefix=settings.API_PREFIX)
    app.include_router(invitations.router, prefix=settings.API_PREFIX)

    @app.get("/healthz")
    def healthz():
        return {"ok": True, "env": settings.ENV}

    return app


app = create_app()
