from fastapi import APIRouter, Depends, HTTPException, Header
from ..schemas import GenerateAccessCodeRequest, VerifyAccessCodeRequest, VerifyAccessCodeResponse
from ..db import inmem_db
from ..crypto import generate_pin, hash_pin, sign_qr_token, verify_qr_token, verify_pin
from ..config import get_settings
from datetime import datetime, UTC, timedelta
from ..database import get_session
from .. import models
from ..metrics import ACCESS_CODE_VERIFICATIONS
import logging

router = APIRouter(prefix="/access-codes", tags=["access-codes"])
settings = get_settings()

# Prometheus metrics imported from main


def require_api_key(x_api_key: str | None = Header(default=None)):
    if settings.INTERNAL_API_KEY and x_api_key == settings.INTERNAL_API_KEY:
        return True
    if settings.INTERNAL_API_KEY:
        raise HTTPException(status_code=403, detail="invalid_api_key")
    return True


@router.post("/generate")
def generate_access_code(req: GenerateAccessCodeRequest, _: bool = Depends(require_api_key)):
    # Try DB first
    with get_session() as session:
        if session is not None:
            visitor = session.get(models.Visitor, req.visitorId)
            if not visitor:
                raise HTTPException(status_code=404, detail="visitor_not_found")
            pin = generate_pin()
            pin_hash = hash_pin(pin)
            qr_token, jti = (None, None)
            if settings.ACCESS_CODE_MODE != "dev":
                qr_token, jti = sign_qr_token({"sub": "access_code", "visitor_id": str(visitor.id)})
            expires_at = datetime.now(UTC) + timedelta(hours=settings.ACCESS_CODE_TTL_HOURS)
            ac = models.AccessCode(visitor_id=visitor.id, pin_hash=pin_hash, qr_token=qr_token, jti=jti, expires_at=expires_at)
            session.add(ac)
            session.flush()
            return {"id": str(ac.id), "pin": pin, "qr_token": ac.qr_token, "expires_at": ac.expires_at}
    visitor = inmem_db.get_visitor(req.visitorId)
    if not visitor:
        raise HTTPException(status_code=404, detail="visitor_not_found")
    pin = generate_pin()
    pin_hash = hash_pin(pin)
    qr_token, jti = (None, None)
    if settings.ACCESS_CODE_MODE != "dev":
        qr_token, jti = sign_qr_token({"sub": "access_code", "visitor_id": visitor.id})
    ac = inmem_db.create_access_code(visitor_id=visitor.id, pin_hash=pin_hash, qr_token=qr_token, jti=jti)
    return {"id": ac.id, "pin": pin, "qr_token": ac.qr_token, "expires_at": ac.expires_at}


@router.post("/verify", response_model=VerifyAccessCodeResponse)
def verify_access_code(req: VerifyAccessCodeRequest, _: bool = Depends(require_api_key)):
    # In-memory only
    if req.token:
        try:
            decoded = verify_qr_token(req.token)
            jti = decoded.get("jti")
            if not jti:
                return VerifyAccessCodeResponse(ok=False, reason="missing_jti")
            # DB lookup
            with get_session() as session:
                if session is not None:
                    ac = session.query(models.AccessCode).filter(models.AccessCode.jti == jti).one_or_none()
                    if ac:
                        if ac.used_at:
                            if ACCESS_CODE_VERIFICATIONS:
                                if ACCESS_CODE_VERIFICATIONS:

                                    ACCESS_CODE_VERIFICATIONS.labels(result='already_used').inc()
                            return VerifyAccessCodeResponse(ok=False, reason="already_used")
                        # Ensure both datetimes are timezone-aware for comparison
                        expires_at = ac.expires_at
                        if expires_at.tzinfo is None:
                            # If stored as naive, assume UTC
                            from datetime import timezone
                            expires_at = expires_at.replace(tzinfo=timezone.utc)
                        if expires_at < datetime.now(UTC):
                            if ACCESS_CODE_VERIFICATIONS:

                                ACCESS_CODE_VERIFICATIONS.labels(result='expired').inc()
                            return VerifyAccessCodeResponse(ok=False, reason="expired")
                        ac.used_at = datetime.now(UTC)
                        session.add(ac)
                        if ACCESS_CODE_VERIFICATIONS:

                            ACCESS_CODE_VERIFICATIONS.labels(result='success').inc()

                        # Log successful access code verification
                        logging.info(
                            f"Access code verified successfully",
                            extra={
                                'extra_fields': {
                                    'visitor_id': str(ac.visitor_id),
                                    'verification_method': 'database_qr',
                                    'result': 'success',
                                }
                            }
                        )

                        return VerifyAccessCodeResponse(ok=True, visitorId=str(ac.visitor_id))
            ac = inmem_db.find_access_code_by_jti(jti)
            if not ac:
                if ACCESS_CODE_VERIFICATIONS:

                    ACCESS_CODE_VERIFICATIONS.labels(result='not_found').inc()
                return VerifyAccessCodeResponse(ok=False, reason="not_found")
            if ac.used_at:
                if ACCESS_CODE_VERIFICATIONS:

                    ACCESS_CODE_VERIFICATIONS.labels(result='already_used').inc()
                return VerifyAccessCodeResponse(ok=False, reason="already_used")
            # Ensure both datetimes are timezone-aware for comparison
            expires_at = ac.expires_at
            if expires_at.tzinfo is None:
                # If stored as naive, assume UTC
                from datetime import timezone
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if expires_at < datetime.now(UTC):
                if ACCESS_CODE_VERIFICATIONS:

                    ACCESS_CODE_VERIFICATIONS.labels(result='expired').inc()
                return VerifyAccessCodeResponse(ok=False, reason="expired")
            inmem_db.mark_used(ac)
            if ACCESS_CODE_VERIFICATIONS:

                ACCESS_CODE_VERIFICATIONS.labels(result='success').inc()

            # Log successful access code verification
            logging.info(
                f"Access code verified successfully",
                extra={
                    'extra_fields': {
                        'visitor_id': ac.visitor_id,
                        'verification_method': 'in_memory_qr',
                        'result': 'success',
                    }
                }
            )

            return VerifyAccessCodeResponse(ok=True, visitorId=ac.visitor_id)
        except Exception:
            if ACCESS_CODE_VERIFICATIONS:

                ACCESS_CODE_VERIFICATIONS.labels(result='invalid_token').inc()
            return VerifyAccessCodeResponse(ok=False, reason="invalid_token")
    if req.pin:
        # DB scan
        with get_session() as session:
            if session is not None:
                for ac in session.query(models.AccessCode).all():
                    if verify_pin(ac.pin_hash, req.pin):
                        if ac.used_at:
                            if ACCESS_CODE_VERIFICATIONS:

                                ACCESS_CODE_VERIFICATIONS.labels(result='already_used').inc()
                            return VerifyAccessCodeResponse(ok=False, reason="already_used")
                        # Ensure both datetimes are timezone-aware for comparison
                        expires_at = ac.expires_at
                        if expires_at.tzinfo is None:
                            # If stored as naive, assume UTC
                            from datetime import timezone
                            expires_at = expires_at.replace(tzinfo=timezone.utc)
                        if expires_at < datetime.now(UTC):
                            if ACCESS_CODE_VERIFICATIONS:

                                ACCESS_CODE_VERIFICATIONS.labels(result='expired').inc()
                            return VerifyAccessCodeResponse(ok=False, reason="expired")
                        ac.used_at = datetime.now(UTC)
                        session.add(ac)
                        if ACCESS_CODE_VERIFICATIONS:

                            ACCESS_CODE_VERIFICATIONS.labels(result='success').inc()

                        # Log successful access code verification
                        logging.info(
                            f"Access code verified successfully",
                            extra={
                                'extra_fields': {
                                    'visitor_id': str(ac.visitor_id),
                                    'verification_method': 'database_pin',
                                    'result': 'success',
                                }
                            }
                        )

                        return VerifyAccessCodeResponse(ok=True, visitorId=str(ac.visitor_id))
        for ac in inmem_db.access_codes.values():
            if verify_pin(ac.pin_hash, req.pin):
                if ac.used_at:
                    if ACCESS_CODE_VERIFICATIONS:

                        ACCESS_CODE_VERIFICATIONS.labels(result='already_used').inc()
                    return VerifyAccessCodeResponse(ok=False, reason="already_used")
                # Ensure both datetimes are timezone-aware for comparison
                expires_at = ac.expires_at
                if expires_at.tzinfo is None:
                    # If stored as naive, assume UTC
                    from datetime import timezone
                    expires_at = expires_at.replace(tzinfo=timezone.utc)
                if expires_at < datetime.now(UTC):
                    if ACCESS_CODE_VERIFICATIONS:

                        ACCESS_CODE_VERIFICATIONS.labels(result='expired').inc()
                    return VerifyAccessCodeResponse(ok=False, reason="expired")
                inmem_db.mark_used(ac)
                if ACCESS_CODE_VERIFICATIONS:

                    ACCESS_CODE_VERIFICATIONS.labels(result='success').inc()

                # Log successful access code verification
                logging.info(
                    f"Access code verified successfully",
                    extra={
                        'extra_fields': {
                            'visitor_id': ac.visitor_id,
                            'verification_method': 'in_memory_pin',
                            'result': 'success',
                        }
                    }
                )

                return VerifyAccessCodeResponse(ok=True, visitorId=ac.visitor_id)
        if ACCESS_CODE_VERIFICATIONS:

            ACCESS_CODE_VERIFICATIONS.labels(result='invalid_pin').inc()
        return VerifyAccessCodeResponse(ok=False, reason="invalid_pin")
    if ACCESS_CODE_VERIFICATIONS:

        ACCESS_CODE_VERIFICATIONS.labels(result='missing_credentials').inc()
    return VerifyAccessCodeResponse(ok=False, reason="missing_credentials")
