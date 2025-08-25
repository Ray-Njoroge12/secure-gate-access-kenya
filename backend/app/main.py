from fastapi import FastAPI
from .config import get_settings
from .routers import visitors, access_codes
from .database import engine
from . import models

settings = get_settings()


def create_app() -> FastAPI:
    app = FastAPI(title="Secure Gate Backend", version="0.1.0")
    # Create tables if DB configured
    try:
        if engine:
            models.Base.metadata.create_all(bind=engine)
    except Exception:
        pass
    app.include_router(visitors.router, prefix=settings.API_PREFIX)
    app.include_router(access_codes.router, prefix=settings.API_PREFIX)

    @app.get("/healthz")
    def healthz():
        return {"ok": True, "env": settings.ENV}
    return app


app = create_app()
