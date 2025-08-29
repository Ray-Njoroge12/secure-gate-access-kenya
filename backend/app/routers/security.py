from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_
from datetime import datetime, timedelta, UTC
from typing import List, Optional
from pydantic import BaseModel
from ..database import get_session
from ..models import User, Profile, Visitor, AccessCode
from ..dependencies import UserWithProfile, get_current_user_with_profile, require_guard_minimum
from ..config import get_settings

router = APIRouter(prefix="/security", tags=["security"])
settings = get_settings()


class SecurityStats(BaseModel):
    todaysVisitors: int
    pendingVerifications: int
    usedCodes: int
    systemStatus: str


class RecentActivity(BaseModel):
    id: str
    type: str
    description: str
    timestamp: str
    status: str


class AccessVerificationRequest(BaseModel):
    code: str
    method: str  # 'pin' or 'qr'


class AccessVerificationResponse(BaseModel):
    success: bool
    valid: bool
    visitorName: Optional[str] = None
    accessCodeId: Optional[str] = None
    error: Optional[str] = None


@router.get("/stats", response_model=SecurityStats)
async def get_security_stats(
    current_user: UserWithProfile = Depends(require_guard_minimum),
    session: Session = Depends(get_session)
):
    """Get security dashboard statistics"""

    now = datetime.now(UTC)
    today_start = datetime.combine(now.date(), datetime.min.time(), tzinfo=UTC)
    today_end = datetime.combine(now.date(), datetime.max.time(), tzinfo=UTC)

    # Get today's visitors
    todays_visitors = session.query(func.count(Visitor.id)).filter(
        and_(Visitor.created_at >= today_start, Visitor.created_at <= today_end)
    ).scalar() or 0

    # Get pending verifications (active codes not yet used)
    pending_verifications = session.query(func.count(AccessCode.id)).filter(
        and_(
            AccessCode.created_at >= today_start,
            AccessCode.expires_at > now,
            AccessCode.used_at.is_(None)
        )
    ).scalar() or 0

    # Get used codes today
    used_codes = session.query(func.count(AccessCode.id)).filter(
        and_(
            AccessCode.used_at.isnot(None),
            AccessCode.used_at >= today_start,
            AccessCode.used_at <= today_end
        )
    ).scalar() or 0

    return SecurityStats(
        todaysVisitors=todays_visitors,
        pendingVerifications=pending_verifications,
        usedCodes=used_codes,
        systemStatus="online"
    )


@router.get("/recent-activity", response_model=List[RecentActivity])
async def get_recent_activity(
    limit: int = Query(10, description="Number of recent activities to return"),
    current_user: UserWithProfile = Depends(require_guard_minimum),
    session: Session = Depends(get_session)
):
    """Get recent security activities"""

    # Get recent access codes with visitor information
    recent_codes = session.query(AccessCode, Visitor).join(
        Visitor, AccessCode.visitor_id == Visitor.id
    ).order_by(desc(AccessCode.created_at)).limit(limit).all()

    activities = []
    for code, visitor in recent_codes:
        activity_type = "access_granted" if code.used_at else "access_pending"
        timestamp = code.used_at.isoformat() if code.used_at else code.created_at.isoformat()
        status = "completed" if code.used_at else "pending"

        activities.append(RecentActivity(
            id=str(code.id),
            type=activity_type,
            description=f"Visitor Access - {visitor.full_name_ct}",  # This would be decrypted in real implementation
            timestamp=timestamp,
            status=status
        ))

    return activities


@router.post("/verify-access", response_model=AccessVerificationResponse)
async def verify_access_code(
    request: AccessVerificationRequest,
    current_user: UserWithProfile = Depends(require_guard_minimum),
    session: Session = Depends(get_session)
):
    """Verify access code for security guard"""

    try:
        if request.method == 'pin':
            # Verify by PIN
            code = session.query(AccessCode).filter(
                AccessCode.pin_hash == request.code  # In real implementation, this would be hashed
            ).first()

            if not code:
                return AccessVerificationResponse(
                    success=True,
                    valid=False,
                    error="Invalid PIN code"
                )

        elif request.method == 'qr':
            # Verify by QR token
            code = session.query(AccessCode).filter(
                AccessCode.qr_token == request.code
            ).first()

            if not code:
                return AccessVerificationResponse(
                    success=True,
                    valid=False,
                    error="Invalid QR code"
                )
        else:
            return AccessVerificationResponse(
                success=False,
                valid=False,
                error="Invalid verification method"
            )

        # Check if code is expired
        # Ensure both datetimes are timezone-aware for comparison
        expires_at = code.expires_at
        if expires_at.tzinfo is None:
            # If stored as naive, assume UTC
            from datetime import timezone
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(UTC):
            return AccessVerificationResponse(
                success=True,
                valid=False,
                error="Access code expired"
            )

        # Check if code was already used
        if code.used_at:
            return AccessVerificationResponse(
                success=True,
                valid=False,
                error="Access code already used"
            )

        # Get visitor information
        visitor = session.query(Visitor).filter(Visitor.id == code.visitor_id).first()
        visitor_name = "Unknown Visitor"  # In real implementation, decrypt visitor.full_name_ct

        # Mark code as used
        code.used_at = datetime.now(UTC)
        session.commit()

        return AccessVerificationResponse(
            success=True,
            valid=True,
            visitorName=visitor_name,
            accessCodeId=str(code.id)
        )

    except Exception as e:
        return AccessVerificationResponse(
            success=False,
            valid=False,
            error=f"Verification failed: {str(e)}"
        )
