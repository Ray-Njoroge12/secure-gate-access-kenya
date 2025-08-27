from __future__ import annotations
from datetime import datetime, UTC, timedelta
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import String, DateTime, ForeignKey
from typing import Optional


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
