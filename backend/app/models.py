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
