from fastapi import APIRouter, Depends, HTTPException, Header
from ..schemas import RegisterVisitorRequest, RegisterVisitorResponse, VisitorResponse, AccessCodeResponse
from ..db import inmem_db
from ..crypto import encrypt_field, hash_pin, sign_qr_token, generate_pin
from ..config import get_settings
from ..database import get_session
from .. import models
from datetime import UTC, datetime, timedelta

router = APIRouter(prefix="/visitors", tags=["visitors"])
settings = get_settings()


def require_api_key(x_api_key: str | None = Header(default=None)):
    if settings.INTERNAL_API_KEY and x_api_key == settings.INTERNAL_API_KEY:
        return True
    if settings.INTERNAL_API_KEY:
        raise HTTPException(status_code=403, detail="invalid_api_key")
    return True


@router.post("/register", response_model=RegisterVisitorResponse)
def register_visitor(payload: RegisterVisitorRequest, _: bool = Depends(require_api_key)):
    full_name_ct = encrypt_field(payload.visitor.fullName)
    id_number_ct = encrypt_field(payload.visitor.idNumber)
    phone_ct = encrypt_field(payload.visitor.phone)
    pin = generate_pin()
    pin_hash = hash_pin(pin)
    qr_token, jti = sign_qr_token({"sub": "access_code", "visitor_id": "pending"})

    with get_session() as session:
        if session is not None:
            visitor = models.Visitor(full_name_ct=full_name_ct, id_number_ct=id_number_ct, phone_ct=phone_ct)
            session.add(visitor)
            session.flush()
            qr_token, jti = sign_qr_token({"sub": "access_code", "visitor_id": str(visitor.id)})
            expires_at = datetime.now(UTC) + timedelta(hours=settings.ACCESS_CODE_TTL_HOURS)
            ac = models.AccessCode(visitor_id=visitor.id, pin_hash=pin_hash, qr_token=qr_token, jti=jti, expires_at=expires_at)
            session.add(ac)
            session.flush()
            return RegisterVisitorResponse(
                visitor=VisitorResponse(id=str(visitor.id), created_at=visitor.created_at),
                access_code=AccessCodeResponse(id=str(ac.id), qr_token=ac.qr_token, expires_at=ac.expires_at),
            )
    # Fallback in-memory
    v = inmem_db.create_visitor(full_name_ct=full_name_ct, id_number_ct=id_number_ct, phone_ct=phone_ct)
    qr_token, jti = sign_qr_token({"sub": "access_code", "visitor_id": v.id})
    ac = inmem_db.create_access_code(visitor_id=v.id, pin_hash=pin_hash, qr_token=qr_token, jti=jti)
    return RegisterVisitorResponse(visitor=VisitorResponse(id=v.id, created_at=v.created_at), access_code=AccessCodeResponse(id=ac.id, qr_token=ac.qr_token, expires_at=ac.expires_at))
