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
from ..metrics import VISITOR_REGISTRATIONS
from ..services.cache_service import get_cache_service
from ..services.query_service import get_query_service
from ..services.performance_service import record_database_metric
import logging
import time

router = APIRouter(prefix="/visitors", tags=["visitors"])
settings = get_settings()

# Prometheus metrics imported from main


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
            # Track visitor registration metric
            if VISITOR_REGISTRATIONS:
                VISITOR_REGISTRATIONS.inc()

            # Log successful visitor registration
            logging.info(
                f"Visitor registered successfully",
                extra={
                    'extra_fields': {
                        'visitor_id': str(visitor.id),
                        'access_code_id': str(ac.id),
                        'registration_method': 'database',
                    }
                }
            )

            return RegisterVisitorResponse(
                visitor=VisitorResponse(id=str(visitor.id), created_at=visitor.created_at),
                access_code=AccessCodeResponse(id=str(ac.id), qr_token=ac.qr_token, expires_at=ac.expires_at),
            )
    # Fallback in-memory
    v = inmem_db.create_visitor(full_name_ct=full_name_ct, id_number_ct=id_number_ct, phone_ct=phone_ct)
    qr_token, jti = sign_qr_token({"sub": "access_code", "visitor_id": v.id})
    ac = inmem_db.create_access_code(visitor_id=v.id, pin_hash=pin_hash, qr_token=qr_token, jti=jti)
    # Track visitor registration metric
    if VISITOR_REGISTRATIONS:
        VISITOR_REGISTRATIONS.inc()

    # Log successful visitor registration
    logging.info(
        f"Visitor registered successfully",
        extra={
            'extra_fields': {
                'visitor_id': v.id,
                'access_code_id': ac.id,
                'registration_method': 'in_memory',
            }
        }
    )

    return RegisterVisitorResponse(visitor=VisitorResponse(id=v.id, created_at=v.created_at), access_code=AccessCodeResponse(id=ac.id, qr_token=ac.qr_token, expires_at=ac.expires_at))


@router.get("/{visitor_id}", response_model=VisitorResponse)
async def get_visitor(visitor_id: str, session: Session = Depends(get_session)):
    """Get visitor information with caching"""
    cache_service = get_cache_service()
    query_service = get_query_service()

    # Try cache first
    cache_key = f"visitor:{visitor_id}"
    cached_visitor = await cache_service.get_async(cache_key)

    if cached_visitor:
        logging.info(f"Cache hit for visitor: {visitor_id}")
        return VisitorResponse(**cached_visitor)

    # Cache miss - query database
    start_time = time.time()

    visitor = session.query(models.Visitor).filter(models.Visitor.id == visitor_id).first()

    query_time = time.time() - start_time
    record_database_metric("SELECT", "visitors", query_time)

    if not visitor:
        raise HTTPException(status_code=404, detail="Visitor not found")

    # Cache the result
    visitor_data = {
        "id": str(visitor.id),
        "created_at": visitor.created_at
    }

    await cache_service.set_async(cache_key, visitor_data, ttl=300)  # Cache for 5 minutes

    logging.info(f"Visitor retrieved from database: {visitor_id}")
    return VisitorResponse(**visitor_data)


@router.post("/register-with-invitation")
async def register_visitor_with_invitation(
    request: RegisterVisitorWithInvitationRequest,
    session: Session = Depends(get_session)
):
    """Register a visitor using an invitation token"""
    cache_service = get_cache_service()

    # Check invitation cache first
    cache_key = f"invitation:{request.invitation_token}"
    cached_invitation = await cache_service.get_async(cache_key)

    if cached_invitation:
        invitation_data = cached_invitation
        logging.info(f"Cache hit for invitation: {request.invitation_token}")
    else:
        # Cache miss - query database
        start_time = time.time()

        invitation = session.query(models.Invitation).filter(
            models.Invitation.invitation_token == request.invitation_token
        ).first()

        query_time = time.time() - start_time
        record_database_metric("SELECT", "invitations", query_time)

        if not invitation:
            raise HTTPException(status_code=404, detail="Invalid invitation token")

        # Cache the invitation for future use
        invitation_data = {
            "id": str(invitation.id),
            "invitation_token": invitation.invitation_token,
            "visitor_full_name": invitation.visitor_full_name,
            "visit_date": invitation.visit_date.isoformat() if invitation.visit_date else None,
            "visit_purpose": invitation.visit_purpose,
            "token_expires_at": invitation.token_expires_at.isoformat() if invitation.token_expires_at else None,
            "status": invitation.status,
            "used_at": invitation.used_at.isoformat() if invitation.used_at else None
        }

        await cache_service.set_async(cache_key, invitation_data, ttl=600)  # Cache for 10 minutes
        logging.info(f"Invitation cached: {request.invitation_token}")

    # Validate invitation from cached data
    if invitation_data["status"] != "pending":
        raise HTTPException(
            status_code=400,
            detail=f"Invitation is no longer valid (status: {invitation_data['status']})"
        )

    # Check expiration
    if invitation_data["token_expires_at"]:
        token_expires_at = datetime.fromisoformat(invitation_data["token_expires_at"])
        if token_expires_at.tzinfo is None:
            from datetime import timezone
            token_expires_at = token_expires_at.replace(tzinfo=timezone.utc)
        if token_expires_at < datetime.now(UTC):
            raise HTTPException(status_code=400, detail="Invitation token has expired")

    # If we used cached data, we need to get the actual invitation object for updates
    if cached_invitation:
        invitation = session.query(models.Invitation).filter(
            models.Invitation.invitation_token == request.invitation_token
        ).first()
        if not invitation:
            raise HTTPException(status_code=404, detail="Invalid invitation token")

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

    # Invalidate invitation cache since it was used
    await cache_service.delete_async(cache_key)
    logging.info(f"Invitation cache invalidated: {request.invitation_token}")

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
            "id": invitation_data["id"],
            "visitor_full_name": invitation_data["visitor_full_name"],
            "visit_date": invitation_data["visit_date"],
            "visit_purpose": invitation_data["visit_purpose"]
        }
    }
