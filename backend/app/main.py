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
import asyncio
from datetime import datetime, timezone
import psutil
from dataclasses import asdict
from .metrics import REQUEST_COUNT, REQUEST_LATENCY, ACTIVE_CONNECTIONS, VISITOR_REGISTRATIONS, ACCESS_CODE_VERIFICATIONS
from .services.performance_service import get_performance_service
from .services.cache_service import get_cache_service
from .services.query_service import get_query_service
from .services.realtime_monitoring_service import realtime_monitoring
from .services.audit_service import audit_service
from .services.offline_sync_service import offline_sync_service
from .services.incident_management_service import incident_service
from .services.notification_service import notification_service

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
        logger.info("Initializing Phase 2 & Phase 3 services...")

        # Initialize Phase 2 performance services
        performance_service = get_performance_service()
        performance_service.start_monitoring()
        logger.info("Performance monitoring service started")

        cache_service = get_cache_service()
        logger.info("Cache service initialized")

        query_service = get_query_service()
        logger.info("Query optimization service initialized")

        # Initialize Phase 3 services
        await realtime_monitoring.start_monitoring()
        logger.info("Real-time monitoring service started")

        await notification_service.start_notification_worker()
        logger.info("Notification service started")

        # Start offline sync scheduler
        asyncio.create_task(offline_sync_service.start_sync_scheduler())
        logger.info("Offline sync scheduler started")

        logger.info("All Phase 2 & Phase 3 services initialized successfully")

    # Shutdown event handler
    @app.on_event("shutdown")
    async def shutdown_event():
        """Clean up services on shutdown"""
        logger.info("Shutting down Phase 2 & Phase 3 services...")

        # Clean up Phase 2 services
        try:
            cache_service = get_cache_service()
            cache_service.close()
            logger.info("Cache service closed")
        except Exception as e:
            logger.error(f"Error closing cache service: {e}")

        # Clean up Phase 3 services
        try:
            await realtime_monitoring.stop_monitoring()
            logger.info("Real-time monitoring service stopped")
        except Exception as e:
            logger.error(f"Error stopping real-time monitoring: {e}")

        try:
            await notification_service.stop_notification_worker()
            logger.info("Notification service stopped")
        except Exception as e:
            logger.error(f"Error stopping notification service: {e}")

        logger.info("All Phase 2 & Phase 3 services shutdown complete")

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

    # Phase 3: Security Guard Enhancement Endpoints

    @app.websocket("/ws/monitoring/{client_id}")
    async def websocket_endpoint(websocket, client_id: str, user_type: str = "guard"):
        """WebSocket endpoint for real-time monitoring"""
        await realtime_monitoring.connection_manager.connect(websocket, client_id, user_type)
        try:
            while True:
                # Keep connection alive and handle client messages
                data = await websocket.receive_text()
                # Handle client messages if needed
                if data == "ping":
                    await websocket.send_json({"type": "pong"})
        except Exception as e:
            logger.error(f"WebSocket error for client {client_id}: {e}")
        finally:
            realtime_monitoring.connection_manager.disconnect(websocket, client_id, user_type)

    @app.get("/realtime/stats")
    async def get_live_stats():
        """Get current live statistics"""
        stats = await realtime_monitoring.get_live_stats()
        return {
            "active_visitors": stats.active_visitors,
            "pending_verifications": stats.pending_verifications,
            "today_entries": stats.today_entries,
            "active_alerts": stats.active_alerts,
            "system_health": stats.system_health,
            "last_update": stats.last_update.isoformat()
        }

    @app.get("/realtime/alerts")
    async def get_active_alerts():
        """Get active alerts"""
        alerts = await realtime_monitoring.get_active_alerts()
        return {
            "alerts": [
                {
                    "id": alert.id,
                    "type": alert.type.value,
                    "severity": alert.severity.value,
                    "title": alert.title,
                    "message": alert.message,
                    "timestamp": alert.timestamp.isoformat(),
                    "data": alert.data
                }
                for alert in alerts
            ],
            "count": len(alerts)
        }

    @app.post("/realtime/alerts/{alert_id}/acknowledge")
    async def acknowledge_alert(alert_id: str, guard_id: str):
        """Acknowledge an alert"""
        success = await realtime_monitoring.acknowledge_alert(alert_id, guard_id)
        if success:
            return {"message": "Alert acknowledged successfully"}
        else:
            return {"error": "Alert not found"}, 404

    @app.get("/audit/trail")
    async def get_audit_trail(user_id: str = None, event_type: str = None,
                             start_date: str = None, end_date: str = None,
                             limit: int = 100, offset: int = 0):
        """Get audit trail with filtering"""
        start_dt = datetime.fromisoformat(start_date) if start_date else None
        end_dt = datetime.fromisoformat(end_date) if end_date else None

        event_type_enum = None
        if event_type:
            from .services.audit_service import AuditEventType
            try:
                event_type_enum = AuditEventType(event_type)
            except ValueError:
                return {"error": f"Invalid event type: {event_type}"}, 400

        entries = await audit_service.get_audit_trail(
            user_id=user_id,
            event_type=event_type_enum,
            start_date=start_dt,
            end_date=end_dt,
            limit=limit,
            offset=offset
        )

        return {
            "entries": [
                {
                    "id": entry.id,
                    "event_type": entry.event_type.value,
                    "severity": entry.severity.value,
                    "user_id": entry.user_id,
                    "user_email": entry.user_email,
                    "action": entry.action,
                    "resource_type": entry.resource_type,
                    "resource_id": entry.resource_id,
                    "details": entry.details,
                    "timestamp": entry.timestamp.isoformat(),
                    "success": entry.success,
                    "error_message": entry.error_message
                }
                for entry in entries
            ],
            "count": len(entries)
        }

    @app.get("/audit/compliance")
    async def get_compliance_report(start_date: str, end_date: str):
        """Generate compliance report"""
        try:
            start_dt = datetime.fromisoformat(start_date)
            end_dt = datetime.fromisoformat(end_date)
        except ValueError:
            return {"error": "Invalid date format. Use ISO format (YYYY-MM-DDTHH:MM:SS)"}, 400

        report = await audit_service.get_compliance_report(start_dt, end_dt)
        return report

    @app.get("/audit/user/{user_id}/summary")
    async def get_user_activity_summary(user_id: str, days: int = 30):
        """Get activity summary for a user"""
        summary = await audit_service.get_user_activity_summary(user_id, days)
        return summary

    @app.post("/offline/sync")
    async def trigger_sync():
        """Trigger manual offline sync"""
        result = await offline_sync_service.perform_sync()
        return {
            "success": result.success,
            "synced_items": result.synced_items,
            "failed_items": result.failed_items,
            "conflicts": result.conflicts,
            "errors": result.errors
        }

    @app.get("/offline/status")
    async def get_sync_status():
        """Get offline sync status"""
        status = await offline_sync_service.get_sync_status()
        return status

    @app.post("/offline/retry")
    async def retry_failed_sync():
        """Retry failed sync operations"""
        result = await offline_sync_service.retry_failed_syncs()
        return {
            "success": result.success,
            "synced_items": result.synced_items,
            "failed_items": result.failed_items,
            "conflicts": result.conflicts,
            "errors": result.errors
        }

    @app.get("/offline/data/{device_id}")
    async def get_offline_data(device_id: str):
        """Get offline data for a device"""
        data = await offline_sync_service.get_offline_data_for_device(device_id)
        return {
            "device_id": device_id,
            "data": [
                {
                    "id": item.id,
                    "operation": item.operation.value,
                    "table_name": item.table_name,
                    "data": item.data,
                    "timestamp": item.timestamp.isoformat(),
                    "version": item.version,
                    "checksum": item.checksum
                }
                for item in data
            ],
            "count": len(data)
        }

    @app.post("/incidents")
    async def create_incident(incident_type: str, severity: str, title: str,
                             description: str, location: str = None,
                             reported_by: str = None, details: dict = None,
                             evidence_urls: list = None):
        """Create a new security incident"""
        from .services.incident_management_service import IncidentCategory, IncidentSeverity

        try:
            incident_type_enum = IncidentCategory(incident_type)
            severity_enum = IncidentSeverity(severity)
        except ValueError as e:
            return {"error": f"Invalid incident type or severity: {e}"}, 400

        incident_id = await incident_service.create_incident(
            incident_type=incident_type_enum,
            severity=severity_enum,
            title=title,
            description=description,
            location=location,
            reported_by=reported_by,
            details=details,
            evidence_urls=evidence_urls
        )

        if incident_id:
            return {"incident_id": incident_id, "message": "Incident created successfully"}
        else:
            return {"error": "Failed to create incident"}, 500

    @app.get("/incidents")
    async def get_incidents(status: str = None, severity: str = None,
                           assigned_to: str = None, limit: int = 50, offset: int = 0):
        """Get incidents with filtering"""
        from .services.incident_management_service import IncidentStatus, IncidentSeverity

        status_enum = None
        severity_enum = None

        if status:
            try:
                status_enum = IncidentStatus(status)
            except ValueError:
                return {"error": f"Invalid status: {status}"}, 400

        if severity:
            try:
                severity_enum = IncidentSeverity(severity)
            except ValueError:
                return {"error": f"Invalid severity: {severity}"}, 400

        incidents = await incident_service.get_incidents(
            status=status_enum,
            severity=severity_enum,
            assigned_to=assigned_to,
            limit=limit,
            offset=offset
        )

        return {
            "incidents": [
                {
                    "id": incident.id,
                    "incident_type": incident.incident_type.value,
                    "severity": incident.severity.value,
                    "title": incident.title,
                    "description": incident.description,
                    "location": incident.location,
                    "reported_by": incident.reported_by,
                    "status": incident.status.value,
                    "assigned_to": incident.assigned_to,
                    "priority": incident.priority,
                    "evidence_urls": incident.evidence_urls,
                    "resolution": incident.resolution,
                    "resolved_at": incident.resolved_at.isoformat() if incident.resolved_at else None,
                    "created_at": incident.created_at.isoformat(),
                    "updated_at": incident.updated_at.isoformat(),
                    "estimated_resolution_time": incident.estimated_resolution_time.isoformat() if incident.estimated_resolution_time else None
                }
                for incident in incidents
            ],
            "count": len(incidents)
        }

    @app.get("/incidents/{incident_id}")
    async def get_incident(incident_id: int):
        """Get detailed incident information"""
        incident = await incident_service.get_incident(incident_id)
        if not incident:
            return {"error": "Incident not found"}, 404

        return {
            "id": incident.id,
            "incident_type": incident.incident_type.value,
            "severity": incident.severity.value,
            "title": incident.title,
            "description": incident.description,
            "location": incident.location,
            "reported_by": incident.reported_by,
            "reported_by_email": incident.reported_by_email,
            "status": incident.status.value,
            "assigned_to": incident.assigned_to,
            "priority": incident.priority,
            "details": incident.details,
            "evidence_urls": incident.evidence_urls,
            "resolution": incident.resolution,
            "resolved_by": incident.resolved_by,
            "resolved_at": incident.resolved_at.isoformat() if incident.resolved_at else None,
            "created_at": incident.created_at.isoformat(),
            "updated_at": incident.updated_at.isoformat(),
            "estimated_resolution_time": incident.estimated_resolution_time.isoformat() if incident.estimated_resolution_time else None
        }

    @app.put("/incidents/{incident_id}/status")
    async def update_incident_status(incident_id: int, new_status: str, updated_by: str, notes: str = None):
        """Update incident status"""
        from .services.incident_management_service import IncidentStatus

        try:
            status_enum = IncidentStatus(new_status)
        except ValueError:
            return {"error": f"Invalid status: {new_status}"}, 400

        success = await incident_service.update_incident_status(
            incident_id, status_enum, updated_by, notes
        )

        if success:
            return {"message": "Incident status updated successfully"}
        else:
            return {"error": "Failed to update incident status"}, 500

    @app.put("/incidents/{incident_id}/assign")
    async def assign_incident(incident_id: int, assigned_to: str, assigned_by: str):
        """Assign incident to a user"""
        success = await incident_service.assign_incident(incident_id, assigned_to, assigned_by)

        if success:
            return {"message": "Incident assigned successfully"}
        else:
            return {"error": "Failed to assign incident"}, 500

    @app.post("/incidents/{incident_id}/evidence")
    async def add_evidence(incident_id: int, evidence_type: str, file_name: str,
                          file_url: str, uploaded_by: str, description: str = None,
                          metadata: dict = None):
        """Add evidence to an incident"""
        evidence_id = await incident_service.add_evidence(
            incident_id=incident_id,
            evidence_type=evidence_type,
            file_name=file_name,
            file_url=file_url,
            uploaded_by=uploaded_by,
            description=description,
            metadata=metadata
        )

        if evidence_id:
            return {"evidence_id": evidence_id, "message": "Evidence added successfully"}
        else:
            return {"error": "Failed to add evidence"}, 500

    @app.put("/incidents/{incident_id}/resolve")
    async def resolve_incident(incident_id: int, resolution: str, resolved_by: str):
        """Resolve an incident"""
        success = await incident_service.resolve_incident(incident_id, resolution, resolved_by)

        if success:
            return {"message": "Incident resolved successfully"}
        else:
            return {"error": "Failed to resolve incident"}, 500

    @app.get("/incidents/statistics")
    async def get_incident_statistics(days: int = 30):
        """Get incident statistics"""
        stats = await incident_service.get_incident_statistics(days)
        return stats

    @app.post("/notifications")
    async def send_notification(notification_type: str, priority: str, title: str,
                               message: str, recipient_id: str, channels: list):
        """Send a notification"""
        from .services.notification_service import NotificationType, NotificationPriority, NotificationChannel

        try:
            type_enum = NotificationType(notification_type)
            priority_enum = NotificationPriority(priority)
            channels_enum = [NotificationChannel(channel) for channel in channels]
        except ValueError as e:
            return {"error": f"Invalid notification parameters: {e}"}, 400

        notification_id = await notification_service.send_notification(
            notification_type=type_enum,
            priority=priority_enum,
            title=title,
            message=message,
            recipient_id=recipient_id,
            channels=channels_enum
        )

        if notification_id:
            return {"notification_id": notification_id, "message": "Notification sent successfully"}
        else:
            return {"error": "Failed to send notification"}, 500

    @app.post("/notifications/alert")
    async def send_alert_notification(title: str, message: str, severity: str, recipient_ids: list):
        """Send security alert notification"""
        await notification_service.send_alert_notification(
            title=title,
            message=message,
            severity=severity,
            recipient_ids=recipient_ids
        )
        return {"message": "Alert notifications sent successfully"}

    @app.get("/notifications/{user_id}")
    async def get_user_notifications(user_id: str, limit: int = 50, unread_only: bool = False):
        """Get notifications for a user"""
        notifications = await notification_service.get_user_notifications(
            user_id=user_id,
            limit=limit,
            unread_only=unread_only
        )

        return {
            "notifications": [
                {
                    "id": notification.id,
                    "type": notification.type.value,
                    "priority": notification.priority.value,
                    "title": notification.title,
                    "message": notification.message,
                    "channels": [channel.value for channel in notification.channels],
                    "data": notification.data,
                    "scheduled_for": notification.scheduled_for.isoformat() if notification.scheduled_for else None,
                    "expires_at": notification.expires_at.isoformat() if notification.expires_at else None,
                    "created_at": notification.created_at.isoformat(),
                    "sent_at": notification.sent_at.isoformat() if notification.sent_at else None,
                    "read_at": notification.read_at.isoformat() if notification.read_at else None,
                    "status": notification.status
                }
                for notification in notifications
            ],
            "count": len(notifications)
        }

    @app.put("/notifications/{notification_id}/read")
    async def mark_notification_read(notification_id: int, user_id: str):
        """Mark notification as read"""
        success = await notification_service.mark_as_read(notification_id, user_id)

        if success:
            return {"message": "Notification marked as read"}
        else:
            return {"error": "Notification not found or access denied"}, 404

    @app.get("/notifications/statistics")
    async def get_notification_statistics(days: int = 7):
        """Get notification statistics"""
        stats = await notification_service.get_notification_statistics(days)
        return stats

    @app.get("/metrics")
    def metrics():
        """Prometheus metrics endpoint"""
        return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)

    return app


app = create_app()
