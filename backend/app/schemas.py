from __future__ import annotations
from pydantic import BaseModel
from datetime import datetime


class VisitorInput(BaseModel):
    fullName: str
    idNumber: str
    phone: str
    email: str | None = None
    communityId: str | None = None


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
    token: str | None = None
    pin: str | None = None


class VerifyAccessCodeResponse(BaseModel):
    ok: bool
    visitorId: str | None = None
    reason: str | None = None


class CreateInvitationRequest(BaseModel):
    visitor_full_name: str
    visitor_email: str
    visitor_phone_number: str
    visit_date: datetime
    visit_purpose: str | None = None
    visit_duration_hours: int | None = None


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
    invitation_token: str
    full_name: str
    id_number: str
    phone_number: str
    visitor_email: str
    consent: bool
    photo_url: str | None = None
