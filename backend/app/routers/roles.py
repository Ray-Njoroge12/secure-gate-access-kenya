from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, EmailStr
from ..database import get_session
from ..models import Profile
from .dependencies import UserWithProfile, require_admin_only

router = APIRouter()

class RoleUpdateRequest(BaseModel):
    user_email: EmailStr
    new_role: str

class RoleResponse(BaseModel):
    user_id: str
    email: str
    current_role: str
    updated: bool

class RolePermissions(BaseModel):
    role: str
    permissions: List[str]
    description: str

# Role definitions and permissions
ROLE_PERMISSIONS = {
    "resident": [
        "view_own_invitations",
        "create_invitations",
        "view_own_analytics",
        "update_own_profile"
    ],
    "guard": [
        "view_all_invitations",
        "verify_access_codes",
        "view_security_analytics",
        "report_incidents",
        "view_visitor_logs",
        "manage_access_codes"
    ],
    "admin": [
        "manage_users",
        "manage_roles",
        "view_all_analytics",
        "manage_system_settings",
        "view_audit_logs",
        "manage_security_policies"
    ]
}

VALID_ROLES = ["resident", "guard", "admin"]

@router.get("/permissions", response_model=List[RolePermissions])
async def get_role_permissions():
    """Get all available roles and their permissions"""
    return [
        RolePermissions(
            role=role,
            permissions=permissions,
            description=get_role_description(role)
        )
        for role, permissions in ROLE_PERMISSIONS.items()
    ]

@router.put("/assign", response_model=RoleResponse)
async def assign_user_role(
    request: RoleUpdateRequest,
    current_user: UserWithProfile = Depends(require_admin_only),
    session: Session = Depends(get_session)
):
    """Assign a role to a user (Admin only)"""
    if request.new_role not in VALID_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Valid roles are: {', '.join(VALID_ROLES)}"
        )

    # Find user profile by email
    profile = session.query(Profile).filter(Profile.email == request.user_email).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    old_role = profile.role
    profile.role = request.new_role
    session.commit()

    return RoleResponse(
        user_id=profile.user_id,
        email=profile.email,
        current_role=profile.role,
        updated=True
    )

@router.get("/user/{user_id}")
async def get_user_role(
    user_id: str,
    current_user: UserWithProfile = Depends(require_admin_only),
    session: Session = Depends(get_session)
):
    """Get a user's role information (Admin only)"""
    profile = session.query(Profile).filter(Profile.user_id == user_id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return {
        "user_id": profile.user_id,
        "email": profile.email,
        "role": profile.role,
        "permissions": ROLE_PERMISSIONS.get(profile.role, []),
        "full_name": profile.full_name,
        "unit_number": profile.unit_number
    }

@router.get("/users")
async def list_users_with_roles(
    current_user: UserWithProfile = Depends(require_admin_only),
    session: Session = Depends(get_session)
):
    """List all users with their roles (Admin only)"""
    profiles = session.query(Profile).all()

    return [
        {
            "user_id": profile.user_id,
            "email": profile.email,
            "role": profile.role,
            "permissions": ROLE_PERMISSIONS.get(profile.role, []),
            "full_name": profile.full_name,
            "unit_number": profile.unit_number,
            "created_at": profile.created_at.isoformat() if profile.created_at else None
        }
        for profile in profiles
    ]

@router.get("/my-role")
async def get_my_role(current_user: UserWithProfile = Depends()):
    """Get current user's role and permissions"""
    return {
        "user_id": current_user.id,
        "email": current_user.email,
        "role": current_user.role,
        "permissions": ROLE_PERMISSIONS.get(current_user.role, []),
        "full_name": current_user.full_name
    }

def get_role_description(role: str) -> str:
    """Get human-readable description for a role"""
    descriptions = {
        "resident": "Basic resident access - manage own invitations and view personal analytics",
        "guard": "Security guard access - verify access codes and monitor security",
        "admin": "Administrator access - full system management and user administration"
    }
    return descriptions.get(role, "Unknown role")</content>
<parameter name="filePath">c:\Users\rayng\Desktop\secure-gate-access-kenya\backend\app\routers\roles.py
