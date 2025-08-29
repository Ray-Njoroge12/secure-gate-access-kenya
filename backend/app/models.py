from __future__ import annotations
from datetime import datetime, UTC, timedelta
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import String, DateTime, ForeignKey, JSON, Float, Integer, Boolean, Index
from typing import Optional
import uuid


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))


class Profile(Base):
    __tablename__ = "profiles"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"))
    email: Mapped[str] = mapped_column(String(255))
    full_name: Mapped[str] = mapped_column(String(255))
    unit_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    role: Mapped[str] = mapped_column(String(50), default="resident")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))

    __table_args__ = (
        Index('ix_profiles_user_id', 'user_id'),
        Index('ix_profiles_email', 'email'),
        Index('ix_profiles_role', 'role'),
        Index('ix_profiles_unit_number', 'unit_number'),
    )


class Visitor(Base):
    __tablename__ = "visitors"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    full_name_ct: Mapped[str] = mapped_column(String(512))
    id_number_ct: Mapped[str] = mapped_column(String(256))
    phone_ct: Mapped[str] = mapped_column(String(256))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))


class AccessCode(Base):
    __tablename__ = "access_codes"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    visitor_id: Mapped[int] = mapped_column(ForeignKey("visitors.id", ondelete="CASCADE"), index=True)
    pin_hash: Mapped[str] = mapped_column(String(255))
    qr_token: Mapped[Optional[str]] = mapped_column(String(2048), nullable=True)
    jti: Mapped[Optional[str]] = mapped_column(String(64), index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    used_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))

    __table_args__ = (
        Index('ix_access_codes_expires_at', 'expires_at'),
        Index('ix_access_codes_used_at', 'used_at'),
        Index('ix_access_codes_visitor_expires', 'visitor_id', 'expires_at'),
        Index('ix_access_codes_jti_expires', 'jti', 'expires_at'),
    )

    @staticmethod
    def ttl_expiry(hours: int) -> datetime:
        return datetime.now(UTC) + timedelta(hours=hours)


class Invitation(Base):
    __tablename__ = "invitations"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    resident_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    visitor_full_name: Mapped[str] = mapped_column(String(255))
    visitor_email: Mapped[str] = mapped_column(String(255))
    visitor_phone_number: Mapped[str] = mapped_column(String(50))
    visit_date: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    visit_purpose: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    visit_duration_hours: Mapped[Optional[int]] = mapped_column(nullable=True)
    invitation_token: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    token_expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    status: Mapped[str] = mapped_column(String(50), default="pending")  # pending, used, expired, cancelled
    used_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))

    __table_args__ = (
        Index('ix_invitations_resident_id', 'resident_id'),
        Index('ix_invitations_visit_date', 'visit_date'),
        Index('ix_invitations_status', 'status'),
        Index('ix_invitations_token_expires', 'token_expires_at'),
        Index('ix_invitations_visitor_email', 'visitor_email'),
        Index('ix_invitations_status_date', 'status', 'visit_date'),
    )


# Analytics and Business Intelligence Models

class AnalyticsEvent(Base):
    """Tracks various analytics events throughout the system"""
    __tablename__ = "analytics_events"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    event_type: Mapped[str] = mapped_column(String(50), index=True)
    event_data: Mapped[dict] = mapped_column(JSON, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC), index=True)
    user_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    session_id: Mapped[Optional[str]] = mapped_column(String(255), index=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45))
    user_agent: Mapped[Optional[str]] = mapped_column(String(500))
    event_metadata: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    __table_args__ = (
        Index('ix_analytics_events_type_timestamp', 'event_type', 'timestamp'),
        Index('ix_analytics_events_user_timestamp', 'user_id', 'timestamp'),
        Index('ix_analytics_events_session_timestamp', 'session_id', 'timestamp'),
    )


class PerformanceMetric(Base):
    """Stores performance metrics for monitoring and optimization"""
    __tablename__ = "performance_metrics"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    metric_type: Mapped[str] = mapped_column(String(50), index=True)
    metric_value: Mapped[float] = mapped_column(Float, nullable=False)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC), index=True)
    metric_metadata: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    tags: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    __table_args__ = (
        Index('ix_performance_metrics_type_recorded', 'metric_type', 'recorded_at'),
        Index('ix_performance_metrics_recorded', 'recorded_at'),
    )


class MLPrediction(Base):
    """Stores machine learning predictions and insights"""
    __tablename__ = "ml_predictions"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    prediction_type: Mapped[str] = mapped_column(String(50), index=True)
    prediction_data: Mapped[dict] = mapped_column(JSON, nullable=False)
    confidence_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    valid_until: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    model_version: Mapped[Optional[str]] = mapped_column(String(50))
    input_features: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)


class Report(Base):
    """Stores generated reports and their metadata"""
    __tablename__ = "reports"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    report_type: Mapped[str] = mapped_column(String(50), index=True)
    report_name: Mapped[str] = mapped_column(String(255))
    parameters: Mapped[dict] = mapped_column(JSON, nullable=False)
    generated_by: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"))
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    file_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    file_size: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="generating")  # generating, completed, failed
    download_count: Mapped[int] = mapped_column(Integer, default=0)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)


class DashboardConfig(Base):
    """Stores user dashboard configurations and preferences"""
    __tablename__ = "dashboard_configs"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    dashboard_name: Mapped[str] = mapped_column(String(100))
    config: Mapped[dict] = mapped_column(JSON, nullable=False)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))


# Phase 3: Security Guard Enhancement Models

class AuditLog(Base):
    """Comprehensive audit logging for security compliance"""
    __tablename__ = "audit_logs"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    event_type: Mapped[str] = mapped_column(String(50), index=True)
    severity: Mapped[str] = mapped_column(String(20), index=True)
    user_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    user_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    action: Mapped[str] = mapped_column(String(500))
    resource_type: Mapped[str] = mapped_column(String(50), index=True)
    resource_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    details: Mapped[Optional[str]] = mapped_column(String(2000), nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    success: Mapped[bool] = mapped_column(Boolean, default=True)
    error_message: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC), index=True)

    __table_args__ = (
        Index('ix_audit_logs_event_created', 'event_type', 'created_at'),
        Index('ix_audit_logs_user_created', 'user_id', 'created_at'),
        Index('ix_audit_logs_resource_created', 'resource_type', 'resource_id', 'created_at'),
        Index('ix_audit_logs_created_at', 'created_at'),
    )


class OfflineSync(Base):
    """Tracks offline data synchronization"""
    __tablename__ = "offline_sync"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    device_id: Mapped[str] = mapped_column(String(255), index=True)
    table_name: Mapped[str] = mapped_column(String(50), index=True)
    operation: Mapped[str] = mapped_column(String(20))  # create, update, delete
    data: Mapped[str] = mapped_column(String(5000))  # JSON data
    checksum: Mapped[str] = mapped_column(String(64))  # Data integrity check
    status: Mapped[str] = mapped_column(String(20), default="pending", index=True)  # pending, syncing, completed, failed
    retry_count: Mapped[int] = mapped_column(Integer, default=0)
    error_message: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        Index('ix_offline_sync_device_status', 'device_id', 'status'),
        Index('ix_offline_sync_table_status', 'table_name', 'status'),
        Index('ix_offline_sync_status_created', 'status', 'created_at'),
    )


class SecurityIncident(Base):
    """Security incident tracking and management"""
    __tablename__ = "security_incidents"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    incident_type: Mapped[str] = mapped_column(String(50), index=True)
    severity: Mapped[str] = mapped_column(String(20), index=True)
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(String(1000))
    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    reported_by: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), index=True)
    reported_by_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="reported", index=True)  # reported, investigating, escalated, resolved, closed
    assigned_to: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    priority: Mapped[int] = mapped_column(Integer, default=1)  # 1-5, higher is more urgent
    details: Mapped[Optional[str]] = mapped_column(String(2000), nullable=True)  # JSON details
    evidence_urls: Mapped[Optional[str]] = mapped_column(String(2000), nullable=True)  # JSON array of URLs
    resolution: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    resolved_by: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    estimated_resolution_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC), index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))

    __table_args__ = (
        Index('ix_security_incidents_status_created', 'status', 'created_at'),
        Index('ix_security_incidents_type_severity', 'incident_type', 'severity'),
        Index('ix_security_incidents_assigned_priority', 'assigned_to', 'priority'),
        Index('ix_security_incidents_reported_created', 'reported_by', 'created_at'),
    )


class IncidentEvidence(Base):
    """Evidence files attached to security incidents"""
    __tablename__ = "incident_evidence"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    incident_id: Mapped[int] = mapped_column(ForeignKey("security_incidents.id", ondelete="CASCADE"), index=True)
    evidence_type: Mapped[str] = mapped_column(String(50))  # photo, video, document, audio
    file_name: Mapped[str] = mapped_column(String(255))
    file_url: Mapped[str] = mapped_column(String(500))
    description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    uploaded_by: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), index=True)
    metadata: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)  # JSON metadata
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC), index=True)

    __table_args__ = (
        Index('ix_incident_evidence_incident_uploaded', 'incident_id', 'uploaded_at'),
        Index('ix_incident_evidence_type_uploaded', 'evidence_type', 'uploaded_at'),
    )


class NotificationLog(Base):
    """Notification delivery tracking"""
    __tablename__ = "notification_logs"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    type: Mapped[str] = mapped_column(String(20), index=True)  # alert, incident, system, security
    priority: Mapped[str] = mapped_column(String(10), index=True)  # low, medium, high, urgent
    title: Mapped[str] = mapped_column(String(255))
    message: Mapped[str] = mapped_column(String(1000))
    recipient_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    recipient_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    channels: Mapped[str] = mapped_column(String(200))  # JSON array of channels
    data: Mapped[Optional[str]] = mapped_column(String(2000), nullable=True)  # JSON additional data
    scheduled_for: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pending", index=True)  # pending, sent, failed, read
    sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    read_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC), index=True)

    __table_args__ = (
        Index('ix_notification_logs_recipient_status', 'recipient_id', 'status'),
        Index('ix_notification_logs_type_created', 'type', 'created_at'),
        Index('ix_notification_logs_status_created', 'status', 'created_at'),
        Index('ix_notification_logs_scheduled', 'scheduled_for'),
    )


class VisitorLog(Base):
    """Enhanced visitor tracking with check-in/check-out"""
    __tablename__ = "visitor_logs"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    visitor_name: Mapped[str] = mapped_column(String(255), index=True)
    visitor_phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, index=True)
    visitor_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    expected_arrival: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    purpose: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    host_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    host_phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    invitation_id: Mapped[Optional[int]] = mapped_column(ForeignKey("invitations.id", ondelete="SET NULL"), nullable=True, index=True)
    access_code: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    check_in_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    check_out_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    status: Mapped[str] = mapped_column(String(20), default="pending", index=True)  # pending, arrived, checked_in, checked_out, denied
    notes: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC), index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))

    __table_args__ = (
        Index('ix_visitor_logs_status_arrival', 'status', 'expected_arrival'),
        Index('ix_visitor_logs_phone_status', 'visitor_phone', 'status'),
        Index('ix_visitor_logs_checkin_status', 'check_in_time', 'status'),
        Index('ix_visitor_logs_invitation_status', 'invitation_id', 'status'),
    )
