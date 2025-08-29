"""
Audit Logging Service for Security Compliance and Event Tracking
Provides comprehensive audit trails for all security-related operations.
"""

import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum

from sqlalchemy import func, and_, or_, desc
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models import (
    Profile, AccessCode, Invitation, AnalyticsEvent,
    SecurityIncident, VisitorLog, AuditLog
)


logger = logging.getLogger(__name__)


class AuditEventType(Enum):
    # Authentication & Authorization
    LOGIN = "login"
    LOGOUT = "logout"
    ACCESS_GRANTED = "access_granted"
    ACCESS_DENIED = "access_denied"
    PERMISSION_CHANGE = "permission_change"

    # Data Operations
    DATA_ACCESS = "data_access"
    DATA_MODIFICATION = "data_modification"
    DATA_DELETION = "data_deletion"

    # Security Events
    SECURITY_INCIDENT = "security_incident"
    SUSPICIOUS_ACTIVITY = "suspicious_activity"
    POLICY_VIOLATION = "policy_violation"

    # System Events
    SYSTEM_ACCESS = "system_access"
    CONFIGURATION_CHANGE = "configuration_change"
    BACKUP_OPERATION = "backup_operation"


class AuditSeverity(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class AuditEntry:
    id: Optional[int]
    event_type: AuditEventType
    severity: AuditSeverity
    user_id: Optional[str]
    user_email: Optional[str]
    action: str
    resource_type: str
    resource_id: Optional[str]
    details: Dict[str, Any]
    ip_address: Optional[str]
    user_agent: Optional[str]
    timestamp: datetime
    success: bool
    error_message: Optional[str]


class AuditLoggingService:
    """Service for comprehensive audit logging and compliance reporting"""

    def __init__(self):
        self.logger = logging.getLogger(__name__)

    async def log_event(self, event_type: AuditEventType, severity: AuditSeverity,
                       user_id: Optional[str], action: str, resource_type: str,
                       resource_id: Optional[str] = None, details: Optional[Dict[str, Any]] = None,
                       ip_address: Optional[str] = None, user_agent: Optional[str] = None,
                       success: bool = True, error_message: Optional[str] = None) -> int:
        """Log an audit event to the database"""

        try:
            async with get_db() as db:
                # Get user email if user_id is provided
                user_email = None
                if user_id:
                    user_result = await db.execute(
                        Profile.__table__.select().where(Profile.id == user_id)
                    )
                    user = user_result.first()
                    if user:
                        user_email = user.email

                audit_entry = AuditLog(
                    event_type=event_type.value,
                    severity=severity.value,
                    user_id=user_id,
                    user_email=user_email,
                    action=action,
                    resource_type=resource_type,
                    resource_id=resource_id,
                    details=json.dumps(details or {}),
                    ip_address=ip_address,
                    user_agent=user_agent,
                    success=success,
                    error_message=error_message,
                    created_at=datetime.utcnow()
                )

                db.add(audit_entry)
                await db.commit()
                await db.refresh(audit_entry)

                self.logger.info(f"Audit event logged: {event_type.value} - {action} - Success: {success}")

                return audit_entry.id

        except Exception as e:
            self.logger.error(f"Failed to log audit event: {e}")
            # Don't raise exception to avoid breaking the main flow
            return -1

    async def log_access_attempt(self, user_id: Optional[str], access_code: str,
                                success: bool, ip_address: Optional[str] = None,
                                user_agent: Optional[str] = None, details: Optional[Dict[str, Any]] = None):
        """Log an access attempt (successful or failed)"""
        event_type = AuditEventType.ACCESS_GRANTED if success else AuditEventType.ACCESS_DENIED
        severity = AuditSeverity.LOW if success else AuditSeverity.MEDIUM

        await self.log_event(
            event_type=event_type,
            severity=severity,
            user_id=user_id,
            action=f"Access attempt with code: {access_code[:8]}...",
            resource_type="access_code",
            resource_id=access_code,
            details={
                "access_code_preview": access_code[:8] + "...",
                "full_details": details or {}
            },
            ip_address=ip_address,
            user_agent=user_agent,
            success=success,
            error_message="Invalid access code" if not success else None
        )

    async def log_security_incident(self, incident_type: str, description: str,
                                   severity: AuditSeverity, user_id: Optional[str] = None,
                                   details: Optional[Dict[str, Any]] = None):
        """Log a security incident"""
        await self.log_event(
            event_type=AuditEventType.SECURITY_INCIDENT,
            severity=severity,
            user_id=user_id,
            action=f"Security incident: {incident_type}",
            resource_type="security",
            details={
                "incident_type": incident_type,
                "description": description,
                "additional_details": details or {}
            },
            success=False
        )

    async def log_data_access(self, user_id: str, resource_type: str, resource_id: str,
                             action: str, details: Optional[Dict[str, Any]] = None):
        """Log data access operations"""
        await self.log_event(
            event_type=AuditEventType.DATA_ACCESS,
            severity=AuditSeverity.LOW,
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details or {},
            success=True
        )

    async def log_system_event(self, event_type: str, description: str,
                              severity: AuditSeverity = AuditSeverity.LOW,
                              details: Optional[Dict[str, Any]] = None):
        """Log system-level events"""
        await self.log_event(
            event_type=AuditEventType.SYSTEM_ACCESS,
            severity=severity,
            user_id=None,
            action=f"System event: {event_type}",
            resource_type="system",
            details={
                "event_type": event_type,
                "description": description,
                "system_details": details or {}
            },
            success=True
        )

    async def get_audit_trail(self, user_id: Optional[str] = None,
                             event_type: Optional[AuditEventType] = None,
                             resource_type: Optional[str] = None,
                             start_date: Optional[datetime] = None,
                             end_date: Optional[datetime] = None,
                             limit: int = 100,
                             offset: int = 0) -> List[AuditEntry]:
        """Retrieve audit trail with filtering options"""

        try:
            async with get_db() as db:
                query = AuditLog.__table__.select()

                # Apply filters
                if user_id:
                    query = query.where(AuditLog.user_id == user_id)
                if event_type:
                    query = query.where(AuditLog.event_type == event_type.value)
                if resource_type:
                    query = query.where(AuditLog.resource_type == resource_type)
                if start_date:
                    query = query.where(AuditLog.created_at >= start_date)
                if end_date:
                    query = query.where(AuditLog.created_at <= end_date)

                # Order by most recent first
                query = query.order_by(desc(AuditLog.created_at)).limit(limit).offset(offset)

                result = await db.execute(query)
                rows = result.fetchall()

                audit_entries = []
                for row in rows:
                    audit_entries.append(AuditEntry(
                        id=row.id,
                        event_type=AuditEventType(row.event_type),
                        severity=AuditSeverity(row.severity),
                        user_id=row.user_id,
                        user_email=row.user_email,
                        action=row.action,
                        resource_type=row.resource_type,
                        resource_id=row.resource_id,
                        details=json.loads(row.details) if row.details else {},
                        ip_address=row.ip_address,
                        user_agent=row.user_agent,
                        timestamp=row.created_at,
                        success=row.success,
                        error_message=row.error_message
                    ))

                return audit_entries

        except Exception as e:
            self.logger.error(f"Failed to retrieve audit trail: {e}")
            return []

    async def get_compliance_report(self, start_date: datetime,
                                   end_date: datetime) -> Dict[str, Any]:
        """Generate a compliance report for the specified period"""

        try:
            async with get_db() as db:
                # Get total events
                total_events = await db.execute(
                    func.count(AuditLog.id).filter(
                        and_(
                            AuditLog.created_at >= start_date,
                            AuditLog.created_at <= end_date
                        )
                    )
                )

                # Get events by type
                events_by_type = await db.execute(
                    AuditLog.__table__.select()
                    .with_only_columns([
                        AuditLog.event_type,
                        func.count(AuditLog.id).label('count')
                    ])
                    .where(and_(
                        AuditLog.created_at >= start_date,
                        AuditLog.created_at <= end_date
                    ))
                    .group_by(AuditLog.event_type)
                )

                # Get events by severity
                events_by_severity = await db.execute(
                    AuditLog.__table__.select()
                    .with_only_columns([
                        AuditLog.severity,
                        func.count(AuditLog.id).label('count')
                    ])
                    .where(and_(
                        AuditLog.created_at >= start_date,
                        AuditLog.created_at <= end_date
                    ))
                    .group_by(AuditLog.severity)
                )

                # Get failed operations
                failed_operations = await db.execute(
                    func.count(AuditLog.id).filter(
                        and_(
                            AuditLog.created_at >= start_date,
                            AuditLog.created_at <= end_date,
                            AuditLog.success == False
                        )
                    )
                )

                # Get security incidents
                security_incidents = await db.execute(
                    func.count(AuditLog.id).filter(
                        and_(
                            AuditLog.created_at >= start_date,
                            AuditLog.created_at <= end_date,
                            AuditLog.event_type == AuditEventType.SECURITY_INCIDENT.value
                        )
                    )
                )

                return {
                    "report_period": {
                        "start_date": start_date.isoformat(),
                        "end_date": end_date.isoformat()
                    },
                    "summary": {
                        "total_events": total_events.scalar(),
                        "failed_operations": failed_operations.scalar(),
                        "security_incidents": security_incidents.scalar(),
                        "success_rate": ((total_events.scalar() - failed_operations.scalar()) / total_events.scalar() * 100) if total_events.scalar() > 0 else 100
                    },
                    "events_by_type": [
                        {"type": row.event_type, "count": row.count}
                        for row in events_by_type.fetchall()
                    ],
                    "events_by_severity": [
                        {"severity": row.severity, "count": row.count}
                        for row in events_by_severity.fetchall()
                    ],
                    "generated_at": datetime.utcnow().isoformat()
                }

        except Exception as e:
            self.logger.error(f"Failed to generate compliance report: {e}")
            return {
                "error": f"Failed to generate report: {str(e)}",
                "generated_at": datetime.utcnow().isoformat()
            }

    async def get_user_activity_summary(self, user_id: str,
                                       days: int = 30) -> Dict[str, Any]:
        """Get activity summary for a specific user"""

        try:
            start_date = datetime.utcnow() - timedelta(days=days)

            async with get_db() as db:
                # Total activity
                total_activity = await db.execute(
                    func.count(AuditLog.id).filter(
                        and_(
                            AuditLog.user_id == user_id,
                            AuditLog.created_at >= start_date
                        )
                    )
                )

                # Successful operations
                successful_ops = await db.execute(
                    func.count(AuditLog.id).filter(
                        and_(
                            AuditLog.user_id == user_id,
                            AuditLog.created_at >= start_date,
                            AuditLog.success == True
                        )
                    )
                )

                # Failed operations
                failed_ops = await db.execute(
                    func.count(AuditLog.id).filter(
                        and_(
                            AuditLog.user_id == user_id,
                            AuditLog.created_at >= start_date,
                            AuditLog.success == False
                        )
                    )
                )

                # Recent activity (last 7 days)
                recent_activity = await db.execute(
                    func.count(AuditLog.id).filter(
                        and_(
                            AuditLog.user_id == user_id,
                            AuditLog.created_at >= datetime.utcnow() - timedelta(days=7)
                        )
                    )
                )

                return {
                    "user_id": user_id,
                    "period_days": days,
                    "summary": {
                        "total_activity": total_activity.scalar(),
                        "successful_operations": successful_ops.scalar(),
                        "failed_operations": failed_ops.scalar(),
                        "success_rate": (successful_ops.scalar() / total_activity.scalar() * 100) if total_activity.scalar() > 0 else 100,
                        "recent_activity": recent_activity.scalar()
                    },
                    "generated_at": datetime.utcnow().isoformat()
                }

        except Exception as e:
            self.logger.error(f"Failed to get user activity summary: {e}")
            return {
                "error": f"Failed to get summary: {str(e)}",
                "generated_at": datetime.utcnow().isoformat()
            }

    async def cleanup_old_logs(self, days_to_keep: int = 365):
        """Clean up old audit logs beyond retention period"""

        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days_to_keep)

            async with get_db() as db:
                # Count logs to be deleted
                count_to_delete = await db.execute(
                    func.count(AuditLog.id).filter(
                        AuditLog.created_at < cutoff_date
                    )
                )

                # Delete old logs
                await db.execute(
                    AuditLog.__table__.delete().where(
                        AuditLog.created_at < cutoff_date
                    )
                )

                await db.commit()

                deleted_count = count_to_delete.scalar()
                self.logger.info(f"Cleaned up {deleted_count} old audit logs")

                # Log the cleanup operation
                await self.log_system_event(
                    "audit_log_cleanup",
                    f"Cleaned up {deleted_count} audit logs older than {days_to_keep} days",
                    AuditSeverity.LOW,
                    {"deleted_count": deleted_count, "retention_days": days_to_keep}
                )

                return deleted_count

        except Exception as e:
            self.logger.error(f"Failed to cleanup old logs: {e}")
            return 0


# Global service instance
audit_service = AuditLoggingService()
