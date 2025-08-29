"""
Incident Management Service for Security Operations
Handles security incidents, evidence collection, and incident workflow management.
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum
import uuid

from sqlalchemy import func, and_, or_, desc
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models import (
    Profile, AccessCode, Invitation, AnalyticsEvent,
    SecurityIncident, VisitorLog, IncidentEvidence
)


logger = logging.getLogger(__name__)


class IncidentStatus(Enum):
    REPORTED = "reported"
    INVESTIGATING = "investigating"
    ESCALATED = "escalated"
    RESOLVED = "resolved"
    CLOSED = "closed"


class IncidentSeverity(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class IncidentCategory(Enum):
    SECURITY_BREACH = "security_breach"
    SUSPICIOUS_ACTIVITY = "suspicious_activity"
    UNAUTHORIZED_ACCESS = "unauthorized_access"
    SYSTEM_INTRUSION = "system_intrusion"
    PHYSICAL_SECURITY = "physical_security"
    DATA_BREACH = "data_breach"
    POLICY_VIOLATION = "policy_violation"
    OTHER = "other"


@dataclass
class IncidentReport:
    id: Optional[int]
    incident_type: IncidentCategory
    severity: IncidentSeverity
    title: str
    description: str
    location: Optional[str]
    reported_by: str
    reported_by_email: Optional[str]
    status: IncidentStatus
    assigned_to: Optional[str]
    priority: int
    details: Dict[str, Any]
    evidence_urls: List[str]
    resolution: Optional[str]
    resolved_by: Optional[str]
    resolved_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    estimated_resolution_time: Optional[datetime]


@dataclass
class EvidenceItem:
    id: Optional[int]
    incident_id: int
    evidence_type: str
    file_name: str
    file_url: str
    description: Optional[str]
    uploaded_by: str
    uploaded_at: datetime
    metadata: Dict[str, Any]


class IncidentManagementService:
    """Service for managing security incidents and evidence"""

    def __init__(self):
        self.logger = logging.getLogger(__name__)

    async def create_incident(self, incident_type: IncidentCategory,
                             severity: IncidentSeverity, title: str,
                             description: str, location: Optional[str],
                             reported_by: str, details: Optional[Dict[str, Any]] = None,
                             evidence_urls: Optional[List[str]] = None) -> Optional[int]:
        """Create a new security incident"""

        try:
            async with get_db() as db:
                # Get reporter's email
                reporter_result = await db.execute(
                    Profile.__table__.select().where(Profile.id == reported_by)
                )
                reporter = reporter_result.first()
                reported_by_email = reporter.email if reporter else None

                # Calculate priority based on severity
                priority = self._calculate_priority(severity, incident_type)

                # Estimate resolution time
                estimated_resolution = self._estimate_resolution_time(severity)

                incident = SecurityIncident(
                    incident_type=incident_type.value,
                    severity=severity.value,
                    title=title,
                    description=description,
                    location=location,
                    reported_by=reported_by,
                    reported_by_email=reported_by_email,
                    status=IncidentStatus.REPORTED.value,
                    priority=priority,
                    details=json.dumps(details or {}),
                    evidence_urls=json.dumps(evidence_urls or []),
                    estimated_resolution_time=estimated_resolution,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )

                db.add(incident)
                await db.commit()
                await db.refresh(incident)

                # Log the incident creation
                await self._log_incident_event(db, incident.id, "created",
                                             f"Incident created by {reported_by}",
                                             {"incident_data": {
                                                 "type": incident_type.value,
                                                 "severity": severity.value,
                                                 "title": title
                                             }})

                self.logger.info(f"Security incident created: {title} (ID: {incident.id})")
                return incident.id

        except Exception as e:
            self.logger.error(f"Failed to create incident: {e}")
            return None

    async def update_incident_status(self, incident_id: int, new_status: IncidentStatus,
                                    updated_by: str, notes: Optional[str] = None) -> bool:
        """Update incident status"""

        try:
            async with get_db() as db:
                incident = await db.get(SecurityIncident, incident_id)
                if not incident:
                    return False

                old_status = incident.status
                incident.status = new_status.value
                incident.updated_at = datetime.utcnow()

                if new_status == IncidentStatus.RESOLVED:
                    incident.resolved_at = datetime.utcnow()
                    incident.resolved_by = updated_by

                await db.commit()

                # Log status change
                await self._log_incident_event(db, incident_id, "status_changed",
                                             f"Status changed from {old_status} to {new_status.value}",
                                             {"old_status": old_status, "new_status": new_status.value,
                                              "updated_by": updated_by, "notes": notes})

                self.logger.info(f"Incident {incident_id} status updated to {new_status.value}")
                return True

        except Exception as e:
            self.logger.error(f"Failed to update incident status: {e}")
            return False

    async def assign_incident(self, incident_id: int, assigned_to: str,
                             assigned_by: str) -> bool:
        """Assign incident to a user"""

        try:
            async with get_db() as db:
                incident = await db.get(SecurityIncident, incident_id)
                if not incident:
                    return False

                incident.assigned_to = assigned_to
                incident.updated_at = datetime.utcnow()

                await db.commit()

                # Log assignment
                await self._log_incident_event(db, incident_id, "assigned",
                                             f"Incident assigned to {assigned_to}",
                                             {"assigned_to": assigned_to, "assigned_by": assigned_by})

                self.logger.info(f"Incident {incident_id} assigned to {assigned_to}")
                return True

        except Exception as e:
            self.logger.error(f"Failed to assign incident: {e}")
            return False

    async def add_evidence(self, incident_id: int, evidence_type: str,
                          file_name: str, file_url: str, uploaded_by: str,
                          description: Optional[str] = None,
                          metadata: Optional[Dict[str, Any]] = None) -> Optional[int]:
        """Add evidence to an incident"""

        try:
            async with get_db() as db:
                # Verify incident exists
                incident = await db.get(SecurityIncident, incident_id)
                if not incident:
                    return None

                evidence = IncidentEvidence(
                    incident_id=incident_id,
                    evidence_type=evidence_type,
                    file_name=file_name,
                    file_url=file_url,
                    description=description,
                    uploaded_by=uploaded_by,
                    metadata=json.dumps(metadata or {}),
                    uploaded_at=datetime.utcnow()
                )

                db.add(evidence)
                await db.commit()
                await db.refresh(evidence)

                # Update incident's evidence URLs
                current_urls = json.loads(incident.evidence_urls) if incident.evidence_urls else []
                current_urls.append(file_url)
                incident.evidence_urls = json.dumps(current_urls)
                incident.updated_at = datetime.utcnow()
                await db.commit()

                # Log evidence addition
                await self._log_incident_event(db, incident_id, "evidence_added",
                                             f"Evidence added: {file_name}",
                                             {"evidence_type": evidence_type,
                                              "file_name": file_name,
                                              "uploaded_by": uploaded_by})

                self.logger.info(f"Evidence added to incident {incident_id}: {file_name}")
                return evidence.id

        except Exception as e:
            self.logger.error(f"Failed to add evidence: {e}")
            return None

    async def resolve_incident(self, incident_id: int, resolution: str,
                              resolved_by: str) -> bool:
        """Resolve an incident with resolution details"""

        try:
            async with get_db() as db:
                incident = await db.get(SecurityIncident, incident_id)
                if not incident:
                    return False

                incident.status = IncidentStatus.RESOLVED.value
                incident.resolution = resolution
                incident.resolved_by = resolved_by
                incident.resolved_at = datetime.utcnow()
                incident.updated_at = datetime.utcnow()

                await db.commit()

                # Log resolution
                await self._log_incident_event(db, incident_id, "resolved",
                                             f"Incident resolved by {resolved_by}",
                                             {"resolution": resolution, "resolved_by": resolved_by})

                self.logger.info(f"Incident {incident_id} resolved: {resolution}")
                return True

        except Exception as e:
            self.logger.error(f"Failed to resolve incident: {e}")
            return False

    async def get_incident(self, incident_id: int) -> Optional[IncidentReport]:
        """Get detailed incident information"""

        try:
            async with get_db() as db:
                incident = await db.get(SecurityIncident, incident_id)
                if not incident:
                    return None

                # Get evidence
                evidence_query = IncidentEvidence.__table__.select().where(
                    IncidentEvidence.incident_id == incident_id
                ).order_by(desc(IncidentEvidence.uploaded_at))

                evidence_result = await db.execute(evidence_query)
                evidence_items = []

                for row in evidence_result.fetchall():
                    evidence_items.append(EvidenceItem(
                        id=row.id,
                        incident_id=row.incident_id,
                        evidence_type=row.evidence_type,
                        file_name=row.file_name,
                        file_url=row.file_url,
                        description=row.description,
                        uploaded_by=row.uploaded_by,
                        uploaded_at=row.uploaded_at,
                        metadata=json.loads(row.metadata) if row.metadata else {}
                    ))

                return IncidentReport(
                    id=incident.id,
                    incident_type=IncidentCategory(incident.incident_type),
                    severity=IncidentSeverity(incident.severity),
                    title=incident.title,
                    description=incident.description,
                    location=incident.location,
                    reported_by=incident.reported_by,
                    reported_by_email=incident.reported_by_email,
                    status=IncidentStatus(incident.status),
                    assigned_to=incident.assigned_to,
                    priority=incident.priority,
                    details=json.loads(incident.details) if incident.details else {},
                    evidence_urls=json.loads(incident.evidence_urls) if incident.evidence_urls else [],
                    resolution=incident.resolution,
                    resolved_by=incident.resolved_by,
                    resolved_at=incident.resolved_at,
                    created_at=incident.created_at,
                    updated_at=incident.updated_at,
                    estimated_resolution_time=incident.estimated_resolution_time
                )

        except Exception as e:
            self.logger.error(f"Failed to get incident: {e}")
            return None

    async def get_incidents(self, status: Optional[IncidentStatus] = None,
                           severity: Optional[IncidentSeverity] = None,
                           assigned_to: Optional[str] = None,
                           limit: int = 50, offset: int = 0) -> List[IncidentReport]:
        """Get list of incidents with filtering"""

        try:
            async with get_db() as db:
                query = SecurityIncident.__table__.select()

                # Apply filters
                if status:
                    query = query.where(SecurityIncident.status == status.value)
                if severity:
                    query = query.where(SecurityIncident.severity == severity.value)
                if assigned_to:
                    query = query.where(SecurityIncident.assigned_to == assigned_to)

                # Order by priority and creation date
                query = query.order_by(
                    desc(SecurityIncident.priority),
                    desc(SecurityIncident.created_at)
                ).limit(limit).offset(offset)

                result = await db.execute(query)
                incidents = []

                for row in result.fetchall():
                    incidents.append(IncidentReport(
                        id=row.id,
                        incident_type=IncidentCategory(row.incident_type),
                        severity=IncidentSeverity(row.severity),
                        title=row.title,
                        description=row.description,
                        location=row.location,
                        reported_by=row.reported_by,
                        reported_by_email=row.reported_by_email,
                        status=IncidentStatus(row.status),
                        assigned_to=row.assigned_to,
                        priority=row.priority,
                        details=json.loads(row.details) if row.details else {},
                        evidence_urls=json.loads(row.evidence_urls) if row.evidence_urls else [],
                        resolution=row.resolution,
                        resolved_by=row.resolved_by,
                        resolved_at=row.resolved_at,
                        created_at=row.created_at,
                        updated_at=row.updated_at,
                        estimated_resolution_time=row.estimated_resolution_time
                    ))

                return incidents

        except Exception as e:
            self.logger.error(f"Failed to get incidents: {e}")
            return []

    async def get_incident_statistics(self, days: int = 30) -> Dict[str, Any]:
        """Get incident statistics for dashboard"""

        try:
            start_date = datetime.utcnow() - timedelta(days=days)

            async with get_db() as db:
                # Total incidents
                total_incidents = await db.execute(
                    func.count(SecurityIncident.id).filter(
                        SecurityIncident.created_at >= start_date
                    )
                )

                # Incidents by status
                status_counts = await db.execute(
                    SecurityIncident.__table__.select()
                    .with_only_columns([
                        SecurityIncident.status,
                        func.count(SecurityIncident.id).label('count')
                    ])
                    .where(SecurityIncident.created_at >= start_date)
                    .group_by(SecurityIncident.status)
                )

                # Incidents by severity
                severity_counts = await db.execute(
                    SecurityIncident.__table__.select()
                    .with_only_columns([
                        SecurityIncident.severity,
                        func.count(SecurityIncident.id).label('count')
                    ])
                    .where(SecurityIncident.created_at >= start_date)
                    .group_by(SecurityIncident.severity)
                )

                # Incidents by type
                type_counts = await db.execute(
                    SecurityIncident.__table__.select()
                    .with_only_columns([
                        SecurityIncident.incident_type,
                        func.count(SecurityIncident.id).label('count')
                    ])
                    .where(SecurityIncident.created_at >= start_date)
                    .group_by(SecurityIncident.incident_type)
                )

                # Average resolution time for resolved incidents
                resolved_incidents = await db.execute(
                    SecurityIncident.__table__.select()
                    .with_only_columns([
                        func.avg(
                            func.extract('epoch', SecurityIncident.resolved_at) -
                            func.extract('epoch', SecurityIncident.created_at)
                        ).label('avg_resolution_time')
                    ])
                    .where(
                        and_(
                            SecurityIncident.created_at >= start_date,
                            SecurityIncident.status == IncidentStatus.RESOLVED.value
                        )
                    )
                )

                avg_resolution_result = resolved_incidents.first()
                avg_resolution_hours = None
                if avg_resolution_result and avg_resolution_result.avg_resolution_time:
                    avg_resolution_hours = avg_resolution_result.avg_resolution_time / 3600  # Convert to hours

                return {
                    "period_days": days,
                    "total_incidents": total_incidents.scalar(),
                    "by_status": {row.status: row.count for row in status_counts.fetchall()},
                    "by_severity": {row.severity: row.count for row in severity_counts.fetchall()},
                    "by_type": {row.incident_type: row.count for row in type_counts.fetchall()},
                    "average_resolution_time_hours": avg_resolution_hours,
                    "generated_at": datetime.utcnow().isoformat()
                }

        except Exception as e:
            self.logger.error(f"Failed to get incident statistics: {e}")
            return {
                "error": str(e),
                "generated_at": datetime.utcnow().isoformat()
            }

    def _calculate_priority(self, severity: IncidentSeverity,
                           incident_type: IncidentCategory) -> int:
        """Calculate incident priority based on severity and type"""

        # Base priority from severity
        severity_priority = {
            IncidentSeverity.LOW: 1,
            IncidentSeverity.MEDIUM: 2,
            IncidentSeverity.HIGH: 3,
            IncidentSeverity.CRITICAL: 4
        }

        base_priority = severity_priority.get(severity, 2)

        # Adjust for incident type
        type_multipliers = {
            IncidentCategory.SECURITY_BREACH: 1.5,
            IncidentCategory.DATA_BREACH: 1.5,
            IncidentCategory.SYSTEM_INTRUSION: 1.3,
            IncidentCategory.UNAUTHORIZED_ACCESS: 1.2,
            IncidentCategory.SUSPICIOUS_ACTIVITY: 1.1,
            IncidentCategory.PHYSICAL_SECURITY: 1.0,
            IncidentCategory.POLICY_VIOLATION: 0.8,
            IncidentCategory.OTHER: 0.7
        }

        multiplier = type_multipliers.get(incident_type, 1.0)
        return min(5, int(base_priority * multiplier))

    def _estimate_resolution_time(self, severity: IncidentSeverity) -> datetime:
        """Estimate resolution time based on severity"""

        hours_to_add = {
            IncidentSeverity.LOW: 24,      # 1 day
            IncidentSeverity.MEDIUM: 12,   # 12 hours
            IncidentSeverity.HIGH: 4,      # 4 hours
            IncidentSeverity.CRITICAL: 1   # 1 hour
        }

        hours = hours_to_add.get(severity, 12)
        return datetime.utcnow() + timedelta(hours=hours)

    async def _log_incident_event(self, db: AsyncSession, incident_id: int,
                                 event_type: str, description: str,
                                 details: Optional[Dict[str, Any]] = None):
        """Log an incident-related event"""

        try:
            # Create analytics event for incident tracking
            event = AnalyticsEvent(
                event_type=f"incident_{event_type}",
                details=json.dumps({
                    "incident_id": incident_id,
                    "description": description,
                    "additional_details": details or {}
                }),
                created_at=datetime.utcnow()
            )

            db.add(event)
            await db.commit()

        except Exception as e:
            self.logger.error(f"Failed to log incident event: {e}")


# Global service instance
incident_service = IncidentManagementService()
