from __future__ import annotations

from datetime import datetime
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import String, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
import uuid


class Base(DeclarativeBase):
    pass


class Visitor(Base):
    __tablename__ = "visitors"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name_ct: Mapped[str] = mapped_column(Text, nullable=False)
    id_number_ct: Mapped[str] = mapped_column(Text, nullable=False)
    phone_ct: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), default=datetime.utcnow, nullable=False)


class AccessCode(Base):
    __tablename__ = "access_codes"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    visitor_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("visitors.id", ondelete="CASCADE"), nullable=False, index=True)
    pin_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    qr_token: Mapped[str | None] = mapped_column(Text, nullable=True)
    jti: Mapped[str | None] = mapped_column(String(64), index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False)
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=False), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), default=datetime.utcnow, nullable=False)
