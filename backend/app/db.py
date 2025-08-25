from __future__ import annotations
from dataclasses import dataclass, field
from datetime import datetime, timedelta, UTC
from typing import Dict, Optional
import uuid

from .config import get_settings

settings = get_settings()


@dataclass
class AccessCode:
    id: str
    visitor_id: str
    pin_hash: str
    qr_token: str | None
    expires_at: datetime
    used_at: Optional[datetime] = None
    created_at: datetime = field(default_factory=lambda: datetime.now(UTC))
    jti: Optional[str] = None


@dataclass
class Visitor:
    id: str
    full_name_ct: str
    id_number_ct: str
    phone_ct: str
    created_at: datetime = field(default_factory=lambda: datetime.now(UTC))


class InMemoryDB:
    def __init__(self):
        self.visitors: Dict[str, Visitor] = {}
        self.access_codes: Dict[str, AccessCode] = {}

    def create_visitor(self, *, full_name_ct: str, id_number_ct: str, phone_ct: str) -> Visitor:
        vid = str(uuid.uuid4())
        v = Visitor(id=vid, full_name_ct=full_name_ct, id_number_ct=id_number_ct, phone_ct=phone_ct)
        self.visitors[vid] = v
        return v

    def get_visitor(self, visitor_id: str) -> Optional[Visitor]:
        return self.visitors.get(visitor_id)

    def create_access_code(self, *, visitor_id: str, pin_hash: str, qr_token: str | None, jti: str | None) -> AccessCode:
        ac_id = str(uuid.uuid4())
        ttl = settings.ACCESS_CODE_TTL_HOURS
        ac = AccessCode(
            id=ac_id,
            visitor_id=visitor_id,
            pin_hash=pin_hash,
            qr_token=qr_token,
            expires_at=datetime.now(UTC) + timedelta(hours=ttl),
            jti=jti
        )
        self.access_codes[ac_id] = ac
        return ac

    def find_access_code_by_jti(self, jti: str) -> Optional[AccessCode]:
        return next((c for c in self.access_codes.values() if c.jti == jti), None)

    def mark_used(self, ac: AccessCode):
    ac.used_at = datetime.now(UTC)


inmem_db = InMemoryDB()
