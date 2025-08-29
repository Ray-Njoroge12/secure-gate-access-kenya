from fastapi import FastAPI, Request, Response
from .config import get_settings
from .routers import visitors, access_codes, auth, analytics, security, roles, invitations
from .database import engine
from . import models
from .middleware import (
    setup_cors,
    setup_rate_limiting,
    SecurityHeadersMiddleware,
    InputValidationMiddleware,
    SecurityMonitoringMiddleware
)
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
import time
import logging
import json
from datetime import datetime, timezone
import psutil
from dataclasses import asdict
from .metrics import REQUEST_COUNT, REQUEST_LATENCY, ACTIVE_CONNECTIONS, VISITOR_REGISTRATIONS, ACCESS_CODE_VERIFICATIONS
from .services.performance_service import get_performance_service
from .services.cache_service import get_cache_service
from .services.query_service import get_query_service

# Configure structured logging
def setup_logging():
    """Configure structured JSON logging for Loki"""
    class StructuredFormatter(logging.Formatter):
        def format(self, record):
            log_entry = {
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "level": record.levelname,
                "logger": record.name,
                "message": record.getMessage(),
                "module": record.module,
                "function": record.funcName,
                "line": record.lineno,
            }

            # Add extra fields if present
            if hasattr(record, 'extra_fields'):
                log_entry.update(record.extra_fields)

            return json.dumps(log_entry)

    # Configure root logger
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)

    # Remove existing handlers
    for handler in logger.handlers[:]:
        logger.removeHandler(handler)

    # Add structured handler
    handler = logging.StreamHandler()
    handler.setFormatter(StructuredFormatter())
    logger.addHandler(handler)

    return logger

# Global logger
logger = setup_logging()
import logging
import json
from datetime import datetime

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

    # Metrics middleware
    @app.middleware("http")
    async def metrics_middleware(request: Request, call_next):
        start_time = time.time()

        # Track active connections (only if metrics are enabled)
        if ACTIVE_CONNECTIONS is not None:
            ACTIVE_CONNECTIONS.inc()

        try:
            response = await call_next(request)
            process_time = time.time() - start_time

            # Record metrics (only if metrics are enabled)
            if REQUEST_COUNT is not None and REQUEST_LATENCY is not None:
                REQUEST_COUNT.labels(
                    method=request.method,
                    endpoint=request.url.path,
                    status=str(response.status_code)
                ).inc()

                REQUEST_LATENCY.labels(
                    method=request.method,
                    endpoint=request.url.path
                ).observe(process_time)

            # Record performance metrics with new service
            performance_service = get_performance_service()
            performance_service.record_api_metric(
                endpoint=request.url.path,
                method=request.method,
                response_time=process_time,
                status_code=response.status_code,
                user_id=getattr(request.state, 'user_id', None) if hasattr(request, 'state') else None
            )

            # Structured logging for HTTP requests
            logger.info(
                f"HTTP {request.method} {request.url.path} - {response.status_code}",
                extra={
                    'extra_fields': {
                        'method': request.method,
                        'path': request.url.path,
                        'status_code': response.status_code,
                        'duration_ms': round(process_time * 1000, 2),
                        'user_agent': request.headers.get('user-agent', ''),
                        'remote_addr': request.client.host if request.client else '',
                    }
                }
            )

            return response
        except Exception as e:
            # Log errors
            logger.error(
                f"HTTP request error: {str(e)}",
                extra={
                    'extra_fields': {
                        'method': request.method,
                        'path': request.url.path,
                        'error': str(e),
                        'remote_addr': request.client.host if request.client else '',
                    }
                }
            )
            raise
        finally:
            # Track active connections (only if metrics are enabled)
            if ACTIVE_CONNECTIONS is not None:
                ACTIVE_CONNECTIONS.dec()

    # Security Middleware - Order matters!
    # 1. Security Monitoring (must be first to check blocked IPs)
    app.add_middleware(SecurityMonitoringMiddleware)

    # 2. CORS - must be early
    setup_cors(app)

    # 3. Rate Limiting
    limiter = setup_rate_limiting(app)
    app.state.limiter = limiter

    # 4. Security Headers
    app.add_middleware(SecurityHeadersMiddleware)

    # 5. Input Validation
    app.add_middleware(InputValidationMiddleware)

    # Startup event handler
    @app.on_event("startup")
    async def startup_event():
        """Initialize services on startup"""
        logger.info("Initializing performance optimization services...")

        # Initialize performance monitoring
        performance_service = get_performance_service()
        performance_service.start_monitoring()
        logger.info("Performance monitoring service started")

        # Initialize cache service
        cache_service = get_cache_service()
        logger.info("Cache service initialized")

        # Initialize query optimization service
        query_service = get_query_service()
        logger.info("Query optimization service initialized")

        logger.info("All performance services initialized successfully")

    # Shutdown event handler
    @app.on_event("shutdown")
    async def shutdown_event():
        """Clean up services on shutdown"""
        logger.info("Shutting down performance optimization services...")

        # Clean up cache service
        try:
            cache_service = get_cache_service()
            await cache_service.close()
            logger.info("Cache service closed")
        except Exception as e:
            logger.error(f"Error closing cache service: {e}")

        logger.info("Performance services shutdown complete")

    # Include routers
    app.include_router(visitors.router, prefix=settings.API_PREFIX)
    app.include_router(access_codes.router, prefix=settings.API_PREFIX)
    app.include_router(auth.router, prefix=settings.API_PREFIX)
    app.include_router(analytics.router, prefix=settings.API_PREFIX)
    app.include_router(security.router, prefix=settings.API_PREFIX)
    app.include_router(roles.router, prefix=settings.API_PREFIX)
    app.include_router(invitations.router, prefix=settings.API_PREFIX)

    @app.get("/ready")
    def readiness_check():
        """Kubernetes readiness probe endpoint"""

        # Check if database is ready (if configured)
        db_ready = True
        try:
            if engine:
                with engine.connect() as conn:
                    conn.execute("SELECT 1")
        except Exception:
            db_ready = False

        # Check system resources
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')

        ready = db_ready and memory.percent < 95 and disk.percent < 95

        if not ready:
            return {
                "ready": False,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "checks": {
                    "database": db_ready,
                    "memory_usage": f"{memory.percent:.1f}%",
                    "disk_usage": f"{disk.percent:.1f}%"
                }
            }, 503

        return {
            "ready": True,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "checks": {
                "database": db_ready,
                "memory_usage": f"{memory.percent:.1f}%",
                "disk_usage": f"{disk.percent:.1f}%"
            }
        }

    @app.post("/test/validation")
    def test_input_validation(data: dict):
        """Test endpoint for input validation testing"""
        return {"received": data, "validated": True}

    @app.get("/health")
    async def health_check():
        """Comprehensive health check endpoint with security monitoring"""

        # Basic system metrics
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')

        # Security status checks
        security_status = {
            "rate_limiting": "active" if hasattr(app.state, 'limiter') else "inactive",
            "security_headers": "configured",
            "input_validation": "active",
            "authentication": "configured",
            "encryption": "configured" if settings.APP_ENCRYPTION_KEY else "not_configured"
        }

        # Database connectivity check
        db_status = "unknown"
        try:
            if engine:
                with engine.connect() as conn:
                    conn.execute("SELECT 1")
                    db_status = "healthy"
            else:
                db_status = "not_configured"
        except Exception as e:
            db_status = f"error: {str(e)}"

        # Performance metrics
        performance_service = get_performance_service()
        performance_summary = performance_service.get_performance_summary(hours=1)

        # Cache status
        cache_status = "unknown"
        try:
            cache_service = get_cache_service()
            cache_stats = await cache_service.get_stats_async()
            cache_status = "healthy" if cache_stats.get('status') == 'connected' else "disconnected"
        except Exception as e:
            cache_status = f"error: {str(e)}"

        health_data = {
            "status": "healthy",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "version": "1.0.0",
            "environment": settings.ENV,
            "uptime_seconds": time.time() - psutil.boot_time(),

            # System metrics
            "system": {
                "cpu_percent": psutil.cpu_percent(interval=1),
                "memory": {
                    "total": memory.total,
                    "available": memory.available,
                    "percent": memory.percent
                },
                "disk": {
                    "total": disk.total,
                    "free": disk.free,
                    "percent": disk.percent
                }
            },

            # Application metrics
            "application": {
                "database": db_status,
                "security": security_status,
                "cache": cache_status,
                "performance_monitoring": "active"
            },

            # Performance metrics (last hour)
            "performance": {
                "api_requests_total": performance_summary.get("total_metrics", 0),
                "avg_response_time_ms": performance_summary.get("metrics_summary", {}).get("api.endpoint.response_time", {}).get("average", 0) * 1000,
                "cache_hit_rate": cache_stats.get('hit_rate', 0) if 'cache_stats' in locals() else 0
            },

            # Security monitoring
            "security": {
                "rate_limiting_active": security_status["rate_limiting"] == "active",
                "security_headers_enabled": True,
                "input_validation_enabled": True,
                "authentication_enabled": True,
                "encryption_configured": settings.APP_ENCRYPTION_KEY != "dev_app_encryption_key_32bytes_!!!!"
            }
        }

        # Determine overall health status
        if db_status.startswith("error") or memory.percent > 95 or disk.percent > 95:
            health_data["status"] = "unhealthy"
            return health_data, 503
        elif memory.percent > 80 or disk.percent > 80:
            health_data["status"] = "degraded"
            return health_data, 200

        return health_data

    @app.get("/security/status")
    def security_status():
        """Security monitoring status endpoint"""
        from .services.security_monitor import get_security_monitor
        monitor = get_security_monitor()
        return monitor.get_security_stats()

    @app.get("/security/events")
    def security_events(limit: int = 100):
        """Recent security events endpoint"""
        from .services.security_monitor import get_security_monitor
        monitor = get_security_monitor()

        # Get recent events (last 24 hours)
        from datetime import datetime, timedelta
        cutoff_time = datetime.now() - timedelta(hours=24)
        recent_events = [
            event for event in monitor.events
            if event.timestamp > cutoff_time
        ][-limit:]  # Get last 'limit' events

        return {
            "events": [asdict(event) for event in recent_events],
            "total_count": len(recent_events)
        }

    @app.get("/performance/summary")
    def performance_summary(hours: int = 24):
        """Get performance summary for the last N hours"""
        performance_service = get_performance_service()
        return performance_service.get_performance_summary(hours)

    @app.get("/performance/trends/{metric_name}")
    def performance_trends(metric_name: str, hours: int = 24):
        """Get performance trends for a specific metric"""
        performance_service = get_performance_service()
        return performance_service.get_performance_trends(metric_name, hours)

    @app.get("/performance/cache/stats")
    async def cache_stats():
        """Get cache performance statistics"""
        cache_service = get_cache_service()
        return await cache_service.get_stats_async()

    @app.post("/performance/cache/clear")
    async def clear_cache(pattern: str = "*"):
        """Clear cache entries matching pattern"""
        cache_service = get_cache_service()
        await cache_service.clear_pattern_async(pattern)
        return {"message": f"Cache cleared for pattern: {pattern}"}

    @app.get("/performance/cache/stats")
    async def cache_stats():
        """Get cache performance statistics"""
        cache_service = get_cache_service()
        return await cache_service.get_stats_async()

    @app.post("/performance/cache/clear")
    async def clear_cache(pattern: str = "*"):
        """Clear cache entries matching pattern"""
        cache_service = get_cache_service()
        await cache_service.clear_pattern_async(pattern)
        return {"message": f"Cache cleared for pattern: {pattern}"}

    @app.get("/performance/query/stats")
    def query_stats():
        """Get query optimization statistics"""
        query_service = get_query_service()
        return query_service.get_query_statistics()

    @app.get("/metrics")
    def metrics():
        """Prometheus metrics endpoint"""
        return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)

    return app


app = create_app()
