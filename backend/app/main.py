from fastapi import FastAPI
from .config import get_settings
from .routers import visitors, access_codes

settings = get_settings()


def create_app() -> FastAPI:
    app = FastAPI(title="Secure Gate Backend", version="0.1.0")
    app.include_router(visitors.router, prefix=settings.API_PREFIX)
    app.include_router(access_codes.router, prefix=settings.API_PREFIX)

    @app.get("/healthz")
    def healthz():
        return {"ok": True, "env": settings.ENV}
    return app


app = create_app()
