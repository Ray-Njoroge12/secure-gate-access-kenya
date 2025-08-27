from datetime import datetime, timedelta, UTC
from typing import Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from ..database import get_session
from ..models import User, Profile
from ..config import get_settings
from ..dependencies import UserWithProfile, get_current_user_with_profile, require_admin_only
from ..middleware import limiter

router = APIRouter()
settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer(auto_error=False)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    fullName: str
    unitNumber: Optional[str] = None
    phone: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    email: str
    profile: dict

class AuthResponse(BaseModel):
    token: str
    user: UserResponse

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(UTC) + expires_delta
    else:
        expire = datetime.now(UTC) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm="HS256")
    return encoded_jwt

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), session: Session = Depends(get_session)) -> User:
    """Legacy function for backward compatibility"""
    user_with_profile = get_current_user_with_profile(credentials, session)
    return user_with_profile.user

@router.post("/login", response_model=AuthResponse)
@limiter.limit("5/minute")  # 5 login attempts per minute per IP
async def login(request: LoginRequest, session: Session = Depends(get_session)):
    user = session.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    if not verify_password(request.password, user.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    access_token_expires = timedelta(hours=24)
    access_token = create_access_token(
        data={"userId": user.id, "email": user.email}, expires_delta=access_token_expires
    )

    profile = session.query(Profile).filter(Profile.user_id == user.id).first()

    return AuthResponse(
        token=access_token,
        user=UserResponse(
            id=user.id,
            email=user.email,
            profile={
                "id": profile.id if profile else None,
                "fullName": profile.full_name if profile else None,
                "unitNumber": profile.unit_number if profile else None,
                "phone": profile.phone if profile else None,
                "role": profile.role if profile else None,
            } if profile else {}
        )
    )

@router.post("/signup", response_model=AuthResponse)
@limiter.limit("3/minute")  # 3 signup attempts per minute per IP
async def signup(request: SignupRequest, session: Session = Depends(get_session)):
    # Check if user already exists
    existing_user = session.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User already exists")

    # Create user
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(request.password)

    user = User(
        id=user_id,
        email=request.email,
        password=hashed_password
    )
    session.add(user)

    # Create profile
    profile = Profile(
        id=str(uuid.uuid4()),
        user_id=user_id,
        email=request.email,
        full_name=request.fullName,
        unit_number=request.unitNumber,
        phone=request.phone,
        role="resident"
    )
    session.add(profile)
    session.commit()

    access_token_expires = timedelta(hours=24)
    access_token = create_access_token(
        data={"userId": user.id, "email": user.email}, expires_delta=access_token_expires
    )

    return AuthResponse(
        token=access_token,
        user=UserResponse(
            id=user.id,
            email=user.email,
            profile={
                "id": profile.id,
                "fullName": profile.full_name,
                "unitNumber": profile.unit_number,
                "phone": profile.phone,
                "role": profile.role,
            }
        )
    )

@router.get("/profile", response_model=UserResponse)
async def get_profile(current_user: UserWithProfile = Depends(get_current_user_with_profile)):
    """Get current user's profile with role information"""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        profile={
            "id": current_user.profile.id if current_user.profile else None,
            "fullName": current_user.full_name,
            "unitNumber": current_user.unit_number,
            "phone": current_user.phone,
            "role": current_user.role,
        } if current_user.profile else {}
    )

# Additional models for resident dashboard
class InvitationStats(BaseModel):
    activeInvitations: int
    totalInvitations: int
    pendingInvitations: int
    completedVisits: int
    recentVisitors: int

class InvitationResponse(BaseModel):
    id: str
    visitor_email: str
    status: str
    created_at: str
    visitor_name: Optional[str] = None

@router.get("/resident/stats", response_model=InvitationStats)
async def get_resident_stats(current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    """Get dashboard statistics for resident users"""
    # For now, return placeholder data until we implement the full invitation system
    # This would typically query the invitations table
    return InvitationStats(
        activeInvitations=0,
        totalInvitations=0,
        pendingInvitations=0,
        completedVisits=0,
        recentVisitors=0
    )

@router.get("/resident/invitations", response_model=list[InvitationResponse])
async def get_resident_invitations(current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    """Get invitations for the current resident user"""
    # For now, return empty list until we implement the full invitation system
    # This would typically query the invitations table filtered by resident
    return []

# Analytics Endpoints
class AnalyticsResponse(BaseModel):
    visitors: list[dict] = []
    invitations: list[dict] = []
    incidents: list[dict] = []
    accessCodes: list[dict] = []
    securityIncidents: list[dict] = []
    accessLogs: list[dict] = []

@router.get("/analytics/visitors", response_model=list[dict])
async def get_visitors_analytics(
    start_date: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get visitor analytics data"""
    # TODO: Implement actual visitor analytics query
    # This would typically query the visitors table with date filtering
    return []

@router.get("/analytics/invitations", response_model=list[dict])
async def get_invitations_analytics(
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get invitations analytics data"""
    # TODO: Implement actual invitations analytics query
    return []

@router.get("/analytics/incidents", response_model=list[dict])
async def get_incidents_analytics(
    status_filter: Optional[list[str]] = None,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get incidents analytics data"""
    # TODO: Implement actual incidents analytics query
    return []

@router.get("/analytics/access-codes", response_model=list[dict])
async def get_access_codes_analytics(
    start_date: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get access codes analytics data"""
    # TODO: Implement actual access codes analytics query
    return []

@router.get("/analytics/security-incidents", response_model=list[dict])
async def get_security_incidents_analytics(
    start_date: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get security incidents analytics data"""
    # TODO: Implement actual security incidents analytics query
    return []

@router.get("/analytics/access-logs", response_model=list[dict])
async def get_access_logs_analytics(
    start_date: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get access logs analytics data"""
    # TODO: Implement actual access logs analytics query
    return []

@router.get("/analytics/dashboard", response_model=AnalyticsResponse)
async def get_dashboard_analytics(
    period: str = "today",
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get comprehensive dashboard analytics data"""
    # TODO: Implement actual dashboard analytics aggregation
    return AnalyticsResponse()
