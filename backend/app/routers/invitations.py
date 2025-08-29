from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_session
from ..models import Invitation, User
from ..schemas import (
    CreateInvitationRequest,
    InvitationResponse,
    ValidateInvitationTokenRequest,
    ValidateInvitationTokenResponse
)
from ..dependencies import UserWithProfile, require_resident_or_above
from datetime import datetime, UTC, timedelta
import secrets
import string

router = APIRouter(prefix="/invitations", tags=["invitations"])


def generate_invitation_token() -> str:
    """Generate a secure random token for invitations"""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(32))


@router.post("/", response_model=InvitationResponse)
def create_invitation(
    request: CreateInvitationRequest,
    current_user: UserWithProfile = Depends(require_resident_or_above),
    session: Session = Depends(get_session)
):
    """Create a new visitor invitation"""
    # Generate secure token and expiration (7 days from now)
    token = generate_invitation_token()
    expires_at = datetime.now(UTC) + timedelta(days=7)

    # Create invitation record
    invitation = Invitation(
        resident_id=current_user.user.id,
        visitor_full_name=request.visitor_full_name,
        visitor_email=request.visitor_email,
        visitor_phone_number=request.visitor_phone_number,
        visit_date=request.visit_date,
        visit_purpose=request.visit_purpose,
        visit_duration_hours=request.visit_duration_hours,
        invitation_token=token,
        token_expires_at=expires_at,
        status="pending"
    )

    session.add(invitation)
    session.commit()
    session.refresh(invitation)

    return InvitationResponse(
        id=str(invitation.id),
        resident_id=invitation.resident_id,
        visitor_full_name=invitation.visitor_full_name,
        visitor_email=invitation.visitor_email,
        visitor_phone_number=invitation.visitor_phone_number,
        visit_date=invitation.visit_date,
        visit_purpose=invitation.visit_purpose,
        visit_duration_hours=invitation.visit_duration_hours,
        invitation_token=invitation.invitation_token,
        token_expires_at=invitation.token_expires_at,
        status=invitation.status,
        created_at=invitation.created_at
    )


@router.get("/", response_model=list[InvitationResponse])
def list_invitations(
    current_user: UserWithProfile = Depends(require_resident_or_above),
    session: Session = Depends(get_session)
):
    """List all invitations for the current user"""
    invitations = session.query(Invitation).filter(
        Invitation.resident_id == current_user.user.id
    ).order_by(Invitation.created_at.desc()).all()

    return [
        InvitationResponse(
            id=str(inv.id),
            resident_id=inv.resident_id,
            visitor_full_name=inv.visitor_full_name,
            visitor_email=inv.visitor_email,
            visitor_phone_number=inv.visitor_phone_number,
            visit_date=inv.visit_date,
            visit_purpose=inv.visit_purpose,
            visit_duration_hours=inv.visit_duration_hours,
            invitation_token=inv.invitation_token,
            token_expires_at=inv.token_expires_at,
            status=inv.status,
            created_at=inv.created_at
        )
        for inv in invitations
    ]


@router.post("/validate-token", response_model=ValidateInvitationTokenResponse)
def validate_invitation_token(
    request: ValidateInvitationTokenRequest,
    session: Session = Depends(get_session)
):
    """Validate an invitation token"""
    invitation = session.query(Invitation).filter(
        Invitation.invitation_token == request.token
    ).first()

    if not invitation:
        return ValidateInvitationTokenResponse(
            valid=False,
            invitation=None,
            error="Invalid invitation token"
        )

    # Check if token has expired
    # Ensure both datetimes are timezone-aware for comparison
    token_expires_at = invitation.token_expires_at
    if token_expires_at.tzinfo is None:
        # If stored as naive, assume UTC
        from datetime import timezone
        token_expires_at = token_expires_at.replace(tzinfo=timezone.utc)
    if token_expires_at < datetime.now(UTC):
        return ValidateInvitationTokenResponse(
            valid=False,
            invitation=None,
            error="Invitation token has expired"
        )

    # Check if invitation is still pending
    if invitation.status != "pending":
        return ValidateInvitationTokenResponse(
            valid=False,
            invitation=None,
            error=f"Invitation is no longer valid (status: {invitation.status})"
        )

    return ValidateInvitationTokenResponse(
        valid=True,
        invitation=InvitationResponse(
            id=str(invitation.id),
            resident_id=invitation.resident_id,
            visitor_full_name=invitation.visitor_full_name,
            visitor_email=invitation.visitor_email,
            visitor_phone_number=invitation.visitor_phone_number,
            visit_date=invitation.visit_date,
            visit_purpose=invitation.visit_purpose,
            visit_duration_hours=invitation.visit_duration_hours,
            invitation_token=invitation.invitation_token,
            token_expires_at=invitation.token_expires_at,
            status=invitation.status,
            created_at=invitation.created_at
        ),
        error=None
    )


@router.put("/{invitation_id}/cancel")
def cancel_invitation(
    invitation_id: int,
    current_user: UserWithProfile = Depends(require_resident_or_above),
    session: Session = Depends(get_session)
):
    """Cancel an invitation"""
    invitation = session.query(Invitation).filter(
        Invitation.id == invitation_id,
        Invitation.resident_id == current_user.user.id
    ).first()

    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found")

    if invitation.status != "pending":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot cancel invitation with status: {invitation.status}"
        )

    invitation.status = "cancelled"
    invitation.updated_at = datetime.now(UTC)
    session.commit()

    return {"message": "Invitation cancelled successfully"}


@router.get("/{invitation_id}", response_model=InvitationResponse)
def get_invitation(
    invitation_id: int,
    current_user: UserWithProfile = Depends(require_resident_or_above),
    session: Session = Depends(get_session)
):
    """Get a specific invitation"""
    invitation = session.query(Invitation).filter(
        Invitation.id == invitation_id,
        Invitation.resident_id == current_user.user.id
    ).first()

    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found")

    return InvitationResponse(
        id=str(invitation.id),
        resident_id=invitation.resident_id,
        visitor_full_name=invitation.visitor_full_name,
        visitor_email=invitation.visitor_email,
        visitor_phone_number=invitation.visitor_phone_number,
        visit_date=invitation.visit_date,
        visit_purpose=invitation.visit_purpose,
        visit_duration_hours=invitation.visit_duration_hours,
        invitation_token=invitation.invitation_token,
        token_expires_at=invitation.token_expires_at,
        status=invitation.status,
        created_at=invitation.created_at
    )
