"""
Real-time Monitoring Service for Security Guard Operations
Provides live monitoring, alerts, and real-time updates for security operations.
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum

from fastapi import WebSocket, WebSocketDisconnect
from sqlalchemy import func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models import (
    Profile, AccessCode, Invitation, AnalyticsEvent,
    SecurityIncident, VisitorLog
)

logger = logging.getLogger(__name__)


class AlertSeverity(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class AlertType(Enum):
    SECURITY_BREACH = "security_breach"
    SYSTEM_ERROR = "system_error"
    VISITOR_DELAY = "visitor_delay"
    CONNECTION_LOST = "connection_lost"
    HIGH_TRAFFIC = "high_traffic"
    SUSPICIOUS_ACTIVITY = "suspicious_activity"


@dataclass
class RealTimeAlert:
    id: str
    type: AlertType
    severity: AlertSeverity
    title: str
    message: str
    timestamp: datetime
    data: Optional[Dict[str, Any]] = None
    acknowledged: bool = False


@dataclass
class LiveStats:
    active_visitors: int
    pending_verifications: int
    today_entries: int
    active_alerts: int
    system_health: str
    last_update: datetime


class ConnectionManager:
    """Manages WebSocket connections for real-time updates"""

    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
        self.guard_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, client_id: str, user_type: str = "guard"):
        await websocket.accept()
        if user_type not in self.active_connections:
            self.active_connections[user_type] = []
        self.active_connections[user_type].append(websocket)

        if user_type == "guard":
            self.guard_connections[client_id] = websocket

        logger.info(f"Client {client_id} connected as {user_type}")

    def disconnect(self, websocket: WebSocket, client_id: str, user_type: str = "guard"):
        if user_type in self.active_connections:
            self.active_connections[user_type].remove(websocket)

        if user_type == "guard" and client_id in self.guard_connections:
            del self.guard_connections[client_id]

        logger.info(f"Client {client_id} disconnected")

    async def broadcast_to_guards(self, message: Dict[str, Any]):
        """Broadcast message to all connected guards"""
        disconnected = []
        for client_id, websocket in self.guard_connections.items():
            try:
                await websocket.send_json(message)
            except WebSocketDisconnect:
                disconnected.append(client_id)

        # Clean up disconnected clients
        for client_id in disconnected:
            del self.guard_connections[client_id]

    async def send_to_guard(self, guard_id: str, message: Dict[str, Any]):
        """Send message to specific guard"""
        if guard_id in self.guard_connections:
            try:
                await self.guard_connections[guard_id].send_json(message)
            except WebSocketDisconnect:
                del self.guard_connections[guard_id]


class RealTimeMonitoringService:
    """Service for real-time monitoring and alerting"""

    def __init__(self):
        self.connection_manager = ConnectionManager()
        self.active_alerts: Dict[str, RealTimeAlert] = {}
        self.monitoring_task: Optional[asyncio.Task] = None
        self.alert_callbacks: List[callable] = []

    async def start_monitoring(self):
        """Start the real-time monitoring loop"""
        if self.monitoring_task and not self.monitoring_task.done():
            return

        self.monitoring_task = asyncio.create_task(self._monitoring_loop())
        logger.info("Real-time monitoring service started")

    async def stop_monitoring(self):
        """Stop the real-time monitoring loop"""
        if self.monitoring_task:
            self.monitoring_task.cancel()
            try:
                await self.monitoring_task
            except asyncio.CancelledError:
                pass
        logger.info("Real-time monitoring service stopped")

    async def _monitoring_loop(self):
        """Main monitoring loop that runs every 30 seconds"""
        while True:
            try:
                await self._check_system_health()
                await self._check_visitor_delays()
                await self._check_high_traffic()
                await self._check_suspicious_activity()
                await self._update_live_stats()

                await asyncio.sleep(30)  # Check every 30 seconds

            except Exception as e:
                logger.error(f"Error in monitoring loop: {e}")
                await asyncio.sleep(30)

    async def _check_system_health(self):
        """Check overall system health"""
        try:
            async with get_db() as db:
                # Check database connectivity
                result = await db.execute("SELECT 1")
                db_healthy = result.scalar() == 1

                # Check recent activity
                five_minutes_ago = datetime.utcnow() - timedelta(minutes=5)
                recent_activity = await db.execute(
                    func.count(AnalyticsEvent.id).filter(
                        AnalyticsEvent.created_at >= five_minutes_ago
                    )
                )
                activity_count = recent_activity.scalar()

                health_status = "healthy" if db_healthy and activity_count > 0 else "warning"
                if not db_healthy:
                    health_status = "critical"

                if health_status != "healthy":
                    await self._create_alert(
                        AlertType.SYSTEM_ERROR,
                        AlertSeverity.HIGH if health_status == "critical" else AlertSeverity.MEDIUM,
                        "System Health Alert",
                        f"System health status: {health_status}",
                        {"health_status": health_status, "db_healthy": db_healthy}
                    )

        except Exception as e:
            logger.error(f"Error checking system health: {e}")
            await self._create_alert(
                AlertType.SYSTEM_ERROR,
                AlertSeverity.CRITICAL,
                "System Health Check Failed",
                f"Unable to check system health: {str(e)}",
                {"error": str(e)}
            )

    async def _check_visitor_delays(self):
        """Check for visitors waiting too long"""
        try:
            async with get_db() as db:
                # Find visitors waiting more than 15 minutes
                fifteen_minutes_ago = datetime.utcnow() - timedelta(minutes=15)

                delayed_visitors = await db.execute(
                    func.count(VisitorLog.id).filter(
                        and_(
                            VisitorLog.check_in_time.is_(None),
                            VisitorLog.expected_arrival <= fifteen_minutes_ago,
                            VisitorLog.created_at >= fifteen_minutes_ago
                        )
                    )
                )
                delayed_count = delayed_visitors.scalar()

                if delayed_count > 0:
                    await self._create_alert(
                        AlertType.VISITOR_DELAY,
                        AlertSeverity.MEDIUM,
                        "Visitor Delay Alert",
                        f"{delayed_count} visitor(s) waiting more than 15 minutes",
                        {"delayed_visitors": delayed_count}
                    )

        except Exception as e:
            logger.error(f"Error checking visitor delays: {e}")

    async def _check_high_traffic(self):
        """Check for unusually high traffic"""
        try:
            async with get_db() as db:
                # Check visitors in the last hour
                one_hour_ago = datetime.utcnow() - timedelta(hours=1)

                recent_visitors = await db.execute(
                    func.count(VisitorLog.id).filter(
                        VisitorLog.created_at >= one_hour_ago
                    )
                )
                visitor_count = recent_visitors.scalar()

                # Alert if more than 50 visitors in an hour (adjust threshold as needed)
                if visitor_count > 50:
                    await self._create_alert(
                        AlertType.HIGH_TRAFFIC,
                        AlertSeverity.MEDIUM,
                        "High Traffic Alert",
                        f"High visitor traffic: {visitor_count} visitors in the last hour",
                        {"visitor_count": visitor_count, "timeframe": "1_hour"}
                    )

        except Exception as e:
            logger.error(f"Error checking high traffic: {e}")

    async def _check_suspicious_activity(self):
        """Check for suspicious activity patterns"""
        try:
            async with get_db() as db:
                # Check for multiple failed access attempts
                one_hour_ago = datetime.utcnow() - timedelta(hours=1)

                failed_attempts = await db.execute(
                    func.count(AnalyticsEvent.id).filter(
                        and_(
                            AnalyticsEvent.event_type == "access_denied",
                            AnalyticsEvent.created_at >= one_hour_ago
                        )
                    )
                )
                failed_count = failed_attempts.scalar()

                if failed_count > 10:  # More than 10 failed attempts per hour
                    await self._create_alert(
                        AlertType.SUSPICIOUS_ACTIVITY,
                        AlertSeverity.HIGH,
                        "Suspicious Activity Detected",
                        f"High number of failed access attempts: {failed_count} in the last hour",
                        {"failed_attempts": failed_count}
                    )

        except Exception as e:
            logger.error(f"Error checking suspicious activity: {e}")

    async def _update_live_stats(self):
        """Update and broadcast live statistics"""
        try:
            async with get_db() as db:
                # Get current live stats
                now = datetime.utcnow()
                today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

                # Active visitors (checked in but not checked out)
                active_visitors = await db.execute(
                    func.count(VisitorLog.id).filter(
                        and_(
                            VisitorLog.check_in_time.is_not(None),
                            VisitorLog.check_out_time.is_(None)
                        )
                    )
                )

                # Pending verifications (arrived but not checked in)
                pending_verifications = await db.execute(
                    func.count(VisitorLog.id).filter(
                        and_(
                            VisitorLog.check_in_time.is_(None),
                            VisitorLog.expected_arrival <= now
                        )
                    )
                )

                # Today's entries
                today_entries = await db.execute(
                    func.count(VisitorLog.id).filter(
                        VisitorLog.check_in_time >= today_start
                    )
                )

                # Active alerts count
                active_alerts_count = len([a for a in self.active_alerts.values() if not a.acknowledged])

                stats = LiveStats(
                    active_visitors=active_visitors.scalar(),
                    pending_verifications=pending_verifications.scalar(),
                    today_entries=today_entries.scalar(),
                    active_alerts=active_alerts_count,
                    system_health="healthy",  # This would be determined by health checks
                    last_update=now
                )

                # Broadcast to all guards
                await self.connection_manager.broadcast_to_guards({
                    "type": "live_stats_update",
                    "data": {
                        "active_visitors": stats.active_visitors,
                        "pending_verifications": stats.pending_verifications,
                        "today_entries": stats.today_entries,
                        "active_alerts": stats.active_alerts,
                        "system_health": stats.system_health,
                        "last_update": stats.last_update.isoformat()
                    }
                })

        except Exception as e:
            logger.error(f"Error updating live stats: {e}")

    async def _create_alert(self, alert_type: AlertType, severity: AlertSeverity,
                           title: str, message: str, data: Optional[Dict[str, Any]] = None):
        """Create and broadcast a new alert"""
        alert_id = f"{alert_type.value}_{datetime.utcnow().timestamp()}"

        alert = RealTimeAlert(
            id=alert_id,
            type=alert_type,
            severity=severity,
            title=title,
            message=message,
            timestamp=datetime.utcnow(),
            data=data or {}
        )

        self.active_alerts[alert_id] = alert

        # Broadcast alert to all guards
        await self.connection_manager.broadcast_to_guards({
            "type": "new_alert",
            "data": {
                "id": alert.id,
                "type": alert.type.value,
                "severity": alert.severity.value,
                "title": alert.title,
                "message": alert.message,
                "timestamp": alert.timestamp.isoformat(),
                "data": alert.data
            }
        })

        # Trigger callbacks
        for callback in self.alert_callbacks:
            try:
                await callback(alert)
            except Exception as e:
                logger.error(f"Error in alert callback: {e}")

        logger.warning(f"Alert created: {title} - {message}")

    async def acknowledge_alert(self, alert_id: str, guard_id: str):
        """Acknowledge an alert"""
        if alert_id in self.active_alerts:
            self.active_alerts[alert_id].acknowledged = True

            # Broadcast acknowledgment
            await self.connection_manager.broadcast_to_guards({
                "type": "alert_acknowledged",
                "data": {
                    "alert_id": alert_id,
                    "acknowledged_by": guard_id,
                    "timestamp": datetime.utcnow().isoformat()
                }
            })

    def add_alert_callback(self, callback: callable):
        """Add a callback function for new alerts"""
        self.alert_callbacks.append(callback)

    async def get_active_alerts(self) -> List[RealTimeAlert]:
        """Get all active (unacknowledged) alerts"""
        return [alert for alert in self.active_alerts.values() if not alert.acknowledged]

    async def get_live_stats(self) -> LiveStats:
        """Get current live statistics"""
        try:
            async with get_db() as db:
                now = datetime.utcnow()
                today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

                active_visitors = await db.execute(
                    func.count(VisitorLog.id).filter(
                        and_(
                            VisitorLog.check_in_time.is_not(None),
                            VisitorLog.check_out_time.is_(None)
                        )
                    )
                )

                pending_verifications = await db.execute(
                    func.count(VisitorLog.id).filter(
                        and_(
                            VisitorLog.check_in_time.is_(None),
                            VisitorLog.expected_arrival <= now
                        )
                    )
                )

                today_entries = await db.execute(
                    func.count(VisitorLog.id).filter(
                        VisitorLog.check_in_time >= today_start
                    )
                )

                active_alerts_count = len([a for a in self.active_alerts.values() if not a.acknowledged])

                return LiveStats(
                    active_visitors=active_visitors.scalar(),
                    pending_verifications=pending_verifications.scalar(),
                    today_entries=today_entries.scalar(),
                    active_alerts=active_alerts_count,
                    system_health="healthy",
                    last_update=now
                )
        except Exception as e:
            logger.error(f"Error getting live stats: {e}")
            return LiveStats(0, 0, 0, 0, "error", datetime.utcnow())


# Global service instance
realtime_monitoring = RealTimeMonitoringService()
