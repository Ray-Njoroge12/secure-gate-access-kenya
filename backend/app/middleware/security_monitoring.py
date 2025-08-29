"""
Security monitoring middleware for tracking and responding to security events
"""
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Callable
import logging
from ..services.security_monitor import get_security_monitor
from ..config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)
security_monitor = get_security_monitor()

class SecurityMonitoringMiddleware(BaseHTTPMiddleware):
    """
    Middleware for comprehensive security monitoring and threat detection
    """

    def __init__(self, app: Callable):
        super().__init__(app)

    async def dispatch(self, request: Request, call_next):
        # Check if IP is blocked before processing
        client_ip = self._get_client_ip(request)

        if security_monitor.is_ip_blocked(client_ip):
            logger.warning("Blocked request from blocked IP", extra={
                'blocked_ip': client_ip,
                'path': request.url.path,
                'method': request.method
            })
            from fastapi.responses import JSONResponse
            return JSONResponse(
                status_code=403,
                content={
                    "error": "Access Denied",
                    "message": "Your IP address has been temporarily blocked due to suspicious activity.",
                    "contact_support": True
                }
            )

        # Process the request
        response = await call_next(request)

        # Monitor response for security events
        await self._monitor_response(request, response, client_ip)

        return response

    def _get_client_ip(self, request: Request) -> str:
        """
        Extract client IP address from request
        """
        # Check for forwarded headers (common in proxy setups)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            # Take the first IP in case of multiple
            return forwarded_for.split(",")[0].strip()

        # Check other proxy headers
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip

        # Fall back to direct client host
        return request.client.host if request.client else "unknown"

    async def _monitor_response(self, request: Request, response: Response, client_ip: str):
        """
        Monitor response for security-relevant events
        """
        user_agent = request.headers.get("user-agent", "unknown")

        # Monitor authentication failures
        if response.status_code == 401:
            security_monitor.log_security_event(
                event_type="authentication_failure",
                severity="medium",
                source_ip=client_ip,
                user_agent=user_agent,
                endpoint=request.url.path,
                details={
                    "method": request.method,
                    "status_code": response.status_code
                }
            )

        # Monitor authorization failures
        elif response.status_code == 403:
            security_monitor.log_security_event(
                event_type="authorization_failure",
                severity="medium",
                source_ip=client_ip,
                user_agent=user_agent,
                endpoint=request.url.path,
                details={
                    "method": request.method,
                    "status_code": response.status_code
                }
            )

        # Monitor rate limiting
        elif response.status_code == 429:
            security_monitor.log_security_event(
                event_type="rate_limit_exceeded",
                severity="low",
                source_ip=client_ip,
                user_agent=user_agent,
                endpoint=request.url.path,
                details={
                    "method": request.method,
                    "status_code": response.status_code,
                    "retry_after": response.headers.get("Retry-After", "unknown")
                }
            )

        # Monitor suspicious patterns in successful requests
        elif response.status_code < 400:
            await self._monitor_successful_request(request, response, client_ip, user_agent)

    async def _monitor_successful_request(self, request: Request, response: Response,
                                        client_ip: str, user_agent: str):
        """
        Monitor successful requests for suspicious patterns
        """
        # Monitor admin endpoint access
        if "/admin" in request.url.path or "/manage" in request.url.path:
            security_monitor.log_security_event(
                event_type="admin_access",
                severity="low",
                source_ip=client_ip,
                user_agent=user_agent,
                endpoint=request.url.path,
                details={
                    "method": request.method,
                    "admin_endpoint": True
                }
            )

        # Monitor sensitive data access
        sensitive_endpoints = ["/users", "/profiles", "/visitors", "/access-codes"]
        for endpoint in sensitive_endpoints:
            if endpoint in request.url.path:
                security_monitor.log_security_event(
                    event_type="sensitive_data_access",
                    severity="low",
                    source_ip=client_ip,
                    user_agent=user_agent,
                    endpoint=request.url.path,
                    details={
                        "method": request.method,
                        "data_type": endpoint.replace("/", "").replace("-", "_")
                    }
                )
                break

        # Monitor unusual request patterns
        await self._detect_unusual_patterns(request, client_ip, user_agent)

    async def _detect_unusual_patterns(self, request: Request, client_ip: str, user_agent: str):
        """
        Detect unusual request patterns that might indicate attacks
        """
        # Monitor for potential path traversal attempts
        if ".." in request.url.path or "%2e%2e" in request.url.path:
            security_monitor.log_security_event(
                event_type="path_traversal_attempt",
                severity="high",
                source_ip=client_ip,
                user_agent=user_agent,
                endpoint=request.url.path,
                details={
                    "method": request.method,
                    "suspicious_path": request.url.path
                }
            )

        # Monitor for unusual user agents
        suspicious_user_agents = ["", "null", "undefined", "python-requests"]
        if user_agent.lower() in suspicious_user_agents:
            security_monitor.log_security_event(
                event_type="suspicious_user_agent",
                severity="medium",
                source_ip=client_ip,
                user_agent=user_agent,
                endpoint=request.url.path,
                details={
                    "method": request.method,
                    "suspicious_ua": user_agent
                }
            )

        # Monitor for potential API abuse
        if request.url.path.startswith("/api/") and len(request.url.query) > 1000:
            security_monitor.log_security_event(
                event_type="long_query_string",
                severity="low",
                source_ip=client_ip,
                user_agent=user_agent,
                endpoint=request.url.path,
                details={
                    "method": request.method,
                    "query_length": len(request.url.query)
                }
            )
