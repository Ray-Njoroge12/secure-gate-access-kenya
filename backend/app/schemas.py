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
