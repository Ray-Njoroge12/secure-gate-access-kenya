from fastapi import Request, Response
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from ..config import get_settings

settings = get_settings()

# CORS Configuration
def setup_cors(app):
    """
    Configure CORS middleware for cross-origin requests
    """
    # Define allowed origins based on environment
    if settings.ENV == "development":
        allow_origins = [
            "http://localhost:3000",
            "http://localhost:5173",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:5173",
            "http://localhost:8080",
            "http://127.0.0.1:8080"
        ]
    else:
        # In production, specify exact domains
        allow_origins = [
            "https://yourdomain.com",
            "https://www.yourdomain.com"
        ]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allow_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allow_headers=[
            "Accept",
            "Accept-Language",
            "Content-Language",
            "Content-Type",
            "Authorization",
            "X-Requested-With"
        ],
        max_age=86400,  # 24 hours
    )
