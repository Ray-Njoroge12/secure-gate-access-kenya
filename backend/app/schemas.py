from __future__ import annotations
from pydantic import BaseModel, Field, EmailStr, validator
from datetime import datetime
from typing import Optional
import re


class VisitorInput(BaseModel):
    fullName: str = Field(
        min_length=2,
        max_length=100,
        description="Visitor's full name"
    )
    idNumber: str = Field(
        min_length=5,
        max_length=20,
        description="National ID or passport number"
    )
    phone: str = Field(
        min_length=10,
        max_length=15,
        description="Phone number with country code"
    )
    email: Optional[EmailStr] = Field(
        None,
        description="Visitor's email address"
    )
    communityId: Optional[str] = Field(
        None,
        min_length=1,
        max_length=50,
        description="Community identifier"
    )

    @validator('fullName')
    def validate_full_name(cls, v):
        if not re.match(r'^[a-zA-Z\s\-\.\']+$', v):
            raise ValueError('Full name can only contain letters, spaces, hyphens, dots, and apostrophes')
        return v.strip()

    @validator('idNumber')
    def validate_id_number(cls, v):
        # Allow alphanumeric characters, hyphens, and spaces
        if not re.match(r'^[a-zA-Z0-9\-\s]+$', v):
            raise ValueError('ID number can only contain letters, numbers, hyphens, and spaces')
        return v.strip()

    @validator('phone')
    def validate_phone(cls, v):
        # Basic phone number validation - allow +, spaces, hyphens, parentheses
        if not re.match(r'^\+?[\d\s\-\(\)]+$', v):
            raise ValueError('Phone number can only contain digits, spaces, hyphens, parentheses, and +')
        return v.strip()


class RegisterVisitorRequest(BaseModel):
    invitationToken: Optional[str] = Field(
        None,
        min_length=10,
        max_length=200,
        description="Invitation token for pre-approved visitors"
    )
    visitor: VisitorInput

    @validator('invitationToken')
    def validate_invitation_token(cls, v):
        if v and not re.match(r'^[a-zA-Z0-9\-_\.]+$', v):
            raise ValueError('Invitation token contains invalid characters')
        return v


class RegisterVisitorRequest(BaseModel):
    invitationToken: str | None = None
    visitor: VisitorInput


class AccessCodeResponse(BaseModel):
    id: str
    qr_token: str | None
    expires_at: datetime


class VisitorResponse(BaseModel):
    id: str
    created_at: datetime


class RegisterVisitorResponse(BaseModel):
    visitor: VisitorResponse
    access_code: AccessCodeResponse


class GenerateAccessCodeRequest(BaseModel):
    visitorId: str
    mode: str | None = None


class VerifyAccessCodeRequest(BaseModel):
    token: Optional[str] = Field(
        None,
        min_length=10,
        max_length=500,
        description="QR token or access code"
    )
    pin: Optional[str] = Field(
        None,
        min_length=4,
        max_length=8,
        description="PIN code for verification"
    )

    @validator('token')
    def validate_token(cls, v):
        if v and not re.match(r'^[a-zA-Z0-9\-_\.]+$', v):
            raise ValueError('Token contains invalid characters')
        return v

    @validator('pin')
    def validate_pin(cls, v):
        if v and not re.match(r'^\d{4,8}$', v):
            raise ValueError('PIN must be 4-8 digits only')
        return v


class VerifyAccessCodeResponse(BaseModel):
    ok: bool
    visitorId: str | None = None
    reason: str | None = None


class CreateInvitationRequest(BaseModel):
    visitor_full_name: str = Field(
        min_length=2,
        max_length=100,
        description="Visitor's full name"
    )
    visitor_email: EmailStr = Field(
        description="Visitor's email address"
    )
    visitor_phone_number: str = Field(
        min_length=10,
        max_length=15,
        description="Visitor's phone number"
    )
    visit_date: datetime = Field(
        description="Date and time of the visit"
    )
    visit_purpose: Optional[str] = Field(
        None,
        min_length=1,
        max_length=200,
        description="Purpose of the visit"
    )
    visit_duration_hours: Optional[int] = Field(
        None,
        ge=1,
        le=24,
        description="Duration of visit in hours (1-24)"
    )

    @validator('visitor_full_name')
    def validate_visitor_full_name(cls, v):
        if not re.match(r'^[a-zA-Z\s\-\.\']+$', v):
            raise ValueError('Visitor full name can only contain letters, spaces, hyphens, dots, and apostrophes')
        return v.strip()

    @validator('visitor_phone_number')
    def validate_visitor_phone_number(cls, v):
        if not re.match(r'^\+?[\d\s\-\(\)]+$', v):
            raise ValueError('Phone number can only contain digits, spaces, hyphens, parentheses, and +')
        return v.strip()

    @validator('visit_purpose')
    def validate_visit_purpose(cls, v):
        if v and not re.match(r'^[a-zA-Z0-9\s\-\.,]+$', v):
            raise ValueError('Visit purpose can only contain letters, numbers, spaces, hyphens, dots, and commas')
        return v.strip() if v else v


class InvitationResponse(BaseModel):
    id: str
    resident_id: str
    visitor_full_name: str
    visitor_email: str
    visitor_phone_number: str
    visit_date: datetime
    visit_purpose: str | None
    visit_duration_hours: int | None
    invitation_token: str
    token_expires_at: datetime
    status: str
    created_at: datetime


class ValidateInvitationTokenRequest(BaseModel):
    token: str


class ValidateInvitationTokenResponse(BaseModel):
    valid: bool
    invitation: InvitationResponse | None = None
    error: str | None = None


class RegisterVisitorWithInvitationRequest(BaseModel):
    invitation_token: str = Field(
        min_length=10,
        max_length=200,
        description="Invitation token"
    )
    full_name: str = Field(
        min_length=2,
        max_length=100,
        description="Visitor's full name"
    )
    id_number: str = Field(
        min_length=5,
        max_length=20,
        description="National ID or passport number"
    )
    phone_number: str = Field(
        min_length=10,
        max_length=15,
        description="Phone number"
    )
    visitor_email: EmailStr = Field(
        description="Visitor's email address"
    )
    consent: bool = Field(
        description="Data processing consent"
    )
    photo_url: Optional[str] = Field(
        None,
        max_length=500,
        description="Profile photo URL"
    )

    @validator('invitation_token')
    def validate_invitation_token(cls, v):
        if not re.match(r'^[a-zA-Z0-9\-_\.]+$', v):
            raise ValueError('Invitation token contains invalid characters')
        return v

    @validator('full_name')
    def validate_full_name(cls, v):
        if not re.match(r'^[a-zA-Z\s\-\.\']+$', v):
            raise ValueError('Full name can only contain letters, spaces, hyphens, dots, and apostrophes')
        return v.strip()

    @validator('id_number')
    def validate_id_number(cls, v):
        if not re.match(r'^[a-zA-Z0-9\-\s]+$', v):
            raise ValueError('ID number can only contain letters, numbers, hyphens, and spaces')
        return v.strip()

    @validator('phone_number')
    def validate_phone_number(cls, v):
        if not re.match(r'^\+?[\d\s\-\(\)]+$', v):
            raise ValueError('Phone number can only contain digits, spaces, hyphens, parentheses, and +')
        return v.strip()

    @validator('photo_url')
    def validate_photo_url(cls, v):
        if v and not re.match(r'^https?://[^\s/$.?#].[^\s]*$', v):
            raise ValueError('Photo URL must be a valid HTTP/HTTPS URL')
        return v
