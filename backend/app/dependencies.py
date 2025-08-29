from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from typing import List, Optional
from .database import get_session
from .models import User, Profile
from .config import get_settings

settings = get_settings()
security = HTTPBearer(auto_error=False)

# Role hierarchy definition
ROLE_HIERARCHY = {
    "resident": 1,
    "guard": 2,
    "admin": 3
}

from pydantic import BaseModel

class UserWithProfile(BaseModel):
    """Enhanced user object that includes profile information"""
    id: str
    email: str
    role: str
    full_name: Optional[str] = None
    unit_number: Optional[str] = None
    phone: Optional[str] = None

def get_current_user_with_profile(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: Session = Depends(get_session)
) -> UserWithProfile:
    """Get current user with profile information"""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )

    try:
        payload = jwt.decode(credentials.credentials, settings.JWT_SECRET, algorithms=["HS256"])
        user_id: str = payload.get("userId")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

    user = session.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    profile = session.query(Profile).filter(Profile.user_id == user.id).first()

    return UserWithProfile(
        id=user.id,
        email=user.email,
        role=profile.role if profile else "resident",
        full_name=profile.full_name if profile else None,
        unit_number=profile.unit_number if profile else None,
        phone=profile.phone if profile else None
    )

def require_role(required_roles: List[str]):
    """Dependency factory for role-based access control"""
    def role_checker(current_user: UserWithProfile = Depends(get_current_user_with_profile)) -> UserWithProfile:
        if current_user.role not in required_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {', '.join(required_roles)}. Current role: {current_user.role}"
            )
        return current_user
    return role_checker

def require_minimum_role(minimum_role: str):
    """Dependency factory for hierarchical role-based access control"""
    def role_checker(current_user: UserWithProfile = Depends(get_current_user_with_profile)) -> UserWithProfile:
        user_level = ROLE_HIERARCHY.get(current_user.role, 0)
        required_level = ROLE_HIERARCHY.get(minimum_role, 999)

        if user_level < required_level:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Minimum role required: {minimum_role}. Current role: {current_user.role}"
            )
        return current_user
    return role_checker

# Convenience dependencies for common role requirements
require_guard_or_admin = require_role(["guard", "admin"])
require_admin_only = require_role(["admin"])
require_guard_minimum = require_minimum_role("guard")
require_admin_minimum = require_minimum_role("admin")
require_resident_or_above = require_minimum_role("resident")

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), session: Session = Depends(get_session)) -> User:
    """Legacy function for backward compatibility"""
    user_with_profile = get_current_user_with_profile(credentials, session)
    return user_with_profile.user
