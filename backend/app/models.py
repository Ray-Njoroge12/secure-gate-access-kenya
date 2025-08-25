from __future__ import annotations
from datetime import datetime, UTC, timedelta
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import String, DateTime, ForeignKey
from typing import Optional


class Base(DeclarativeBase):
    pass


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
