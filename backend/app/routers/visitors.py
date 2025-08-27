from fastapi import APIRouter, Depends, HTTPException, Header
from ..schemas import (
    RegisterVisitorRequest,
    RegisterVisitorResponse,
    VisitorResponse,
    AccessCodeResponse,
    RegisterVisitorWithInvitationRequest
)
from ..db import inmem_db
from ..crypto import encrypt_field, hash_pin, sign_qr_token, generate_pin
from ..config import get_settings
from ..database import get_session
from .. import models
from datetime import UTC, datetime, timedelta
from sqlalchemy.orm import Session

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


@router.post("/register-with-invitation")
def register_visitor_with_invitation(
    request: RegisterVisitorWithInvitationRequest,
    session: Session = Depends(get_session)
):
    """Register a visitor using an invitation token"""
    # Find and validate invitation
    invitation = session.query(models.Invitation).filter(
        models.Invitation.invitation_token == request.invitation_token
    ).first()

    if not invitation:
        raise HTTPException(status_code=404, detail="Invalid invitation token")

    # Check if token has expired
    if invitation.token_expires_at < datetime.now(UTC):
        raise HTTPException(status_code=400, detail="Invitation token has expired")

    # Check if invitation is still pending
    if invitation.status != "pending":
        raise HTTPException(
            status_code=400,
            detail=f"Invitation is no longer valid (status: {invitation.status})"
        )

    # Encrypt PII data
    full_name_ct = encrypt_field(request.full_name)
    id_number_ct = encrypt_field(request.id_number)
    phone_ct = encrypt_field(request.phone_number)
    email_ct = encrypt_field(request.visitor_email) if request.visitor_email else None

    # Generate PIN and QR token
    pin = generate_pin()
    pin_hash = hash_pin(pin)
    qr_token, jti = sign_qr_token({"sub": "access_code", "visitor_id": "pending"})

    # Create visitor record
    visitor = models.Visitor(
        full_name_ct=full_name_ct,
        id_number_ct=id_number_ct,
        phone_ct=phone_ct
    )
    session.add(visitor)
    session.flush()

    # Update QR token with actual visitor ID
    qr_token, jti = sign_qr_token({"sub": "access_code", "visitor_id": str(visitor.id)})
    expires_at = datetime.now(UTC) + timedelta(hours=settings.ACCESS_CODE_TTL_HOURS)

    # Create access code
    access_code = models.AccessCode(
        visitor_id=visitor.id,
        pin_hash=pin_hash,
        qr_token=qr_token,
        jti=jti,
        expires_at=expires_at
    )
    session.add(access_code)

    # Update invitation status
    invitation.status = "used"
    invitation.used_at = datetime.now(UTC)

    session.commit()
    session.refresh(access_code)

    return {
        "visitor": {
            "id": str(visitor.id),
            "created_at": visitor.created_at
        },
        "access_code": {
            "id": str(access_code.id),
            "qr_token": access_code.qr_token,
            "pin": pin,
            "expires_at": access_code.expires_at
        },
        "invitation": {
            "id": str(invitation.id),
            "visitor_full_name": invitation.visitor_full_name,
            "visit_date": invitation.visit_date,
            "visit_purpose": invitation.visit_purpose
        }
    }
