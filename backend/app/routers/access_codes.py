from fastapi import APIRouter, Depends, HTTPException, Header
from ..schemas import GenerateAccessCodeRequest, VerifyAccessCodeRequest, VerifyAccessCodeResponse
from ..db import inmem_db
from ..crypto import generate_pin, hash_pin, sign_qr_token, verify_qr_token, verify_pin
from ..config import get_settings
from datetime import datetime

router = APIRouter(prefix="/access-codes", tags=["access-codes"])
settings = get_settings()


def require_api_key(x_api_key: str | None = Header(default=None)):
    if settings.INTERNAL_API_KEY and x_api_key == settings.INTERNAL_API_KEY:
        return True
    if settings.INTERNAL_API_KEY:
        raise HTTPException(status_code=403, detail="invalid_api_key")
    return True


@router.post("/generate")
def generate_access_code(req: GenerateAccessCodeRequest, _: bool = Depends(require_api_key)):
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
            ac = inmem_db.find_access_code_by_jti(jti)
            if not ac:
                return VerifyAccessCodeResponse(ok=False, reason="not_found")
            if ac.used_at:
                return VerifyAccessCodeResponse(ok=False, reason="already_used")
            if ac.expires_at < datetime.utcnow():
                return VerifyAccessCodeResponse(ok=False, reason="expired")
            inmem_db.mark_used(ac)
            return VerifyAccessCodeResponse(ok=True, visitorId=ac.visitor_id)
        except Exception:
            return VerifyAccessCodeResponse(ok=False, reason="invalid_token")
    if req.pin:
        for ac in inmem_db.access_codes.values():
            if verify_pin(ac.pin_hash, req.pin):
                if ac.used_at:
                    return VerifyAccessCodeResponse(ok=False, reason="already_used")
                if ac.expires_at < datetime.utcnow():
                    return VerifyAccessCodeResponse(ok=False, reason="expired")
                inmem_db.mark_used(ac)
                return VerifyAccessCodeResponse(ok=True, visitorId=ac.visitor_id)
        return VerifyAccessCodeResponse(ok=False, reason="invalid_pin")
    return VerifyAccessCodeResponse(ok=False, reason="missing_credentials")
