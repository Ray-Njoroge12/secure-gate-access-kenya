from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Callable
import re
import json

class InputValidationMiddleware(BaseHTTPMiddleware):
    """
    Middleware to validate and sanitize input data
    """

    def __init__(self, app: Callable):
        super().__init__(app)

    async def dispatch(self, request: Request, call_next):
        # Only validate POST, PUT, PATCH requests with JSON content
        if request.method in ["POST", "PUT", "PATCH"]:
            content_type = request.headers.get("content-type", "")
            if "application/json" in content_type:
                try:
                    # Read the request body
                    body = await request.body()
                    if body:
                        body_str = body.decode('utf-8')
                        # Basic JSON validation
                        json.loads(body_str)

                        # Check for potentially dangerous patterns
                        self._validate_input(body_str)

                except json.JSONDecodeError:
                    raise HTTPException(status_code=400, detail="Invalid JSON format")
                except Exception as e:
                    raise HTTPException(status_code=400, detail=f"Request validation failed: {str(e)}")

        response = await call_next(request)
        return response

    def _validate_input(self, input_str: str):
        """
        Validate input for potentially dangerous patterns
        """
        # Check for SQL injection patterns
        sql_patterns = [
            r';\s*--',  # SQL comment
            r';\s*/\*',  # SQL comment block
            r'union\s+select',  # UNION SELECT
            r'1=1',  # Always true condition
            r'1\s*=\s*1',  # Always true condition with spaces
        ]

        for pattern in sql_patterns:
            if re.search(pattern, input_str, re.IGNORECASE):
                raise HTTPException(
                    status_code=400,
                    detail="Invalid input detected. Please check your request."
                )

        # Check for XSS patterns
        xss_patterns = [
            r'<script[^>]*>.*?</script>',  # Script tags
            r'javascript:',  # JavaScript URLs
            r'on\w+\s*=',  # Event handlers
        ]

        for pattern in xss_patterns:
            if re.search(pattern, input_str, re.IGNORECASE):
                raise HTTPException(
                    status_code=400,
                    detail="Invalid input detected. Please check your request."
                )

        # Check for path traversal
        if '..' in input_str or '../' in input_str or '..\\' in input_str:
            raise HTTPException(
                status_code=400,
                detail="Invalid path detected in request."
            )
