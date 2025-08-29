from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Callable
import re
import json
import logging

logger = logging.getLogger(__name__)

class InputValidationMiddleware(BaseHTTPMiddleware):
    """
    Enhanced middleware to validate and sanitize input data with comprehensive security checks
    """

    def __init__(self, app: Callable):
        super().__init__(app)

        # Comprehensive security patterns
        self.sql_patterns = [
            r';\s*--',  # SQL comment
            r';\s*/\*',  # SQL comment block
            r'union\s+select',  # UNION SELECT
            r'1=1',  # Always true condition
            r'1\s*=\s*1',  # Always true condition with spaces
            r'drop\s+table',  # DROP TABLE
            r'delete\s+from',  # DELETE FROM
            r'insert\s+into',  # INSERT INTO
            r'update\s+.*set',  # UPDATE ... SET
            r'select\s+.*from',  # SELECT ... FROM
            r'or\s+1\s*=\s*1',  # OR 1=1
            r'and\s+1\s*=\s*1',  # AND 1=1
        ]

        self.xss_patterns = [
            r'<script[^>]*>.*?</script>',  # Script tags
            r'javascript:',  # JavaScript URLs
            r'on\w+\s*=',  # Event handlers
            r'<iframe[^>]*>.*?</iframe>',  # Iframe tags
            r'<object[^>]*>.*?</object>',  # Object tags
            r'<embed[^>]*>.*?</embed>',  # Embed tags
            r'vbscript:',  # VBScript URLs
            r'data:text/html',  # Data URLs with HTML
        ]

        self.path_traversal_patterns = [
            r'\.\./',  # Parent directory
            r'\.\.\\',  # Parent directory (Windows)
            r'%2e%2e%2f',  # URL encoded ../
            r'%2e%2e%5c',  # URL encoded ..\
            r'\.\.%2f',  # Mixed encoding
        ]

        self.command_injection_patterns = [
            r';\s*(?:ls|cat|rm|mkdir|echo|eval)',  # Unix commands
            r'&&\s*(?:dir|type|del|copy|echo)',  # Windows commands
            r'\|\s*(?:more|find|grep|awk)',  # Pipe commands
            r'`.*`',  # Command substitution
            r'\$\(.*\)',  # Command substitution
        ]

    async def dispatch(self, request: Request, call_next):
        # Validate all requests (GET, POST, PUT, PATCH) for malicious input
        try:
            # Check URL path for malicious patterns
            self._validate_url_path(request.url.path, request)

            # Check query parameters for malicious patterns
            query_string = str(request.url.query)
            if query_string:
                self._validate_input(query_string, request)

            # Only validate POST, PUT, PATCH requests with JSON content
            if request.method in ["POST", "PUT", "PATCH"]:
                content_type = request.headers.get("content-type", "")
                if "application/json" in content_type:
                    # Read the request body
                    body = await request.body()
                    if body:
                        body_str = body.decode('utf-8')

                        # Basic JSON validation
                        json_data = json.loads(body_str)

                        # Comprehensive input validation
                        self._validate_input(body_str, request)

                        # Log validation success for monitoring
                        logger.debug("Input validation passed", extra={
                            'path': request.url.path,
                            'method': request.method,
                            'content_length': len(body_str)
                        })

        except json.JSONDecodeError:
            logger.warning("Invalid JSON format", extra={
                'path': request.url.path,
                'client_ip': request.client.host if request.client else 'unknown'
            })
            raise HTTPException(status_code=400, detail="Invalid JSON format")
        except Exception as e:
            logger.error("Request validation failed", extra={
                'path': request.url.path,
                'error': str(e),
                'client_ip': request.client.host if request.client else 'unknown'
            })
            raise HTTPException(status_code=400, detail=f"Request validation failed: {str(e)}")

        response = await call_next(request)
        return response

    def _validate_input(self, input_str: str, request: Request):
        """
        Comprehensive input validation for security threats
        """
        # Check for SQL injection patterns
        for pattern in self.sql_patterns:
            if re.search(pattern, input_str, re.IGNORECASE):
                logger.warning("SQL injection pattern detected", extra={
                    'pattern': pattern,
                    'path': request.url.path,
                    'client_ip': request.client.host if request.client else 'unknown'
                })
                raise HTTPException(
                    status_code=400,
                    detail="Invalid input detected. Possible SQL injection attempt."
                )

        # Check for XSS patterns
        for pattern in self.xss_patterns:
            if re.search(pattern, input_str, re.IGNORECASE):
                logger.warning("XSS pattern detected", extra={
                    'pattern': pattern,
                    'path': request.url.path,
                    'client_ip': request.client.host if request.client else 'unknown'
                })
                raise HTTPException(
                    status_code=400,
                    detail="Invalid input detected. Possible XSS attempt."
                )

        # Check for path traversal
        for pattern in self.path_traversal_patterns:
            if re.search(pattern, input_str, re.IGNORECASE):
                logger.warning("Path traversal pattern detected", extra={
                    'pattern': pattern,
                    'path': request.url.path,
                    'client_ip': request.client.host if request.client else 'unknown'
                })
                raise HTTPException(
                    status_code=400,
                    detail="Invalid path detected in request."
                )

        # Check for command injection
        for pattern in self.command_injection_patterns:
            if re.search(pattern, input_str, re.IGNORECASE):
                logger.warning("Command injection pattern detected", extra={
                    'pattern': pattern,
                    'path': request.url.path,
                    'client_ip': request.client.host if request.client else 'unknown'
                })
                raise HTTPException(
                    status_code=400,
                    detail="Invalid input detected. Possible command injection attempt."
                )

        # Additional security checks
        self._check_input_length(input_str, request)
        self._check_suspicious_patterns(input_str, request)

    def _validate_url_path(self, path: str, request: Request):
        """
        Validate URL path for malicious patterns
        """
        # Check for path traversal in URL
        for pattern in self.path_traversal_patterns:
            if re.search(pattern, path, re.IGNORECASE):
                logger.warning("Path traversal in URL detected", extra={
                    'pattern': pattern,
                    'path': path,
                    'client_ip': request.client.host if request.client else 'unknown'
                })
                raise HTTPException(
                    status_code=400,
                    detail="Invalid path detected in URL."
                )

        # Check for suspicious patterns in URL
        suspicious_url_patterns = [
            r'<[^>]*>',  # HTML tags
            r'javascript:',  # JavaScript URLs
            r'vbscript:',  # VBScript URLs
            r'data:text/html',  # Data URLs
            r'%3c', r'%3e',  # Encoded < >
        ]

        for pattern in suspicious_url_patterns:
            if re.search(pattern, path, re.IGNORECASE):
                logger.warning("Suspicious URL pattern detected", extra={
                    'pattern': pattern,
                    'path': path,
                    'client_ip': request.client.host if request.client else 'unknown'
                })
                raise HTTPException(
                    status_code=400,
                    detail="Invalid characters detected in URL."
                )

    def _check_input_length(self, input_str: str, request: Request):
        """
        Check for unusually long input that might indicate attacks
        """
        max_length = 10000  # 10KB limit
        if len(input_str) > max_length:
            logger.warning("Input too long", extra={
                'length': len(input_str),
                'path': request.url.path,
                'client_ip': request.client.host if request.client else 'unknown'
            })
            raise HTTPException(
                status_code=413,
                detail="Request payload too large."
            )

    def _check_suspicious_patterns(self, input_str: str, request: Request):
        """
        Check for other suspicious patterns
        """
        suspicious_patterns = [
            r'<[^>]*>',  # HTML tags (beyond basic XSS check)
            r'\\x[0-9a-fA-F]{2}',  # Hex encoding
            r'%[0-9a-fA-F]{2}',  # URL encoding
            r'\u[0-9a-fA-F]{4}',  # Unicode encoding
        ]

        for pattern in suspicious_patterns:
            if re.search(pattern, input_str):
                logger.warning("Suspicious pattern detected", extra={
                    'pattern': pattern,
                    'path': request.url.path,
                    'client_ip': request.client.host if request.client else 'unknown'
                })
                raise HTTPException(
                    status_code=400,
                    detail="Invalid input detected. Suspicious content found."
                )
