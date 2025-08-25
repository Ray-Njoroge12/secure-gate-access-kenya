from __future__ import annotations
import base64
from datetime import datetime, timedelta, timezone
from typing import Any, Dict
import secrets
import hashlib

from jose import jwt
from argon2 import PasswordHasher
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from .config import get_settings

settings = get_settings()
ph = PasswordHasher()


def _normalize_key(raw: str) -> bytes:
    b = raw.encode()
    if len(b) < 32:
        return b.ljust(32, b"0")[:32]
    return b[:32]


def encrypt_field(value: str) -> str:
    key = _normalize_key(settings.APP_ENCRYPTION_KEY)
    aes = AESGCM(key)
    iv = secrets.token_bytes(12)
    ct = aes.encrypt(iv, value.encode(), None)
    blob = iv + ct
    return base64.b64encode(blob).decode()


def decrypt_field(blob_b64: str) -> str:
    key = _normalize_key(settings.APP_ENCRYPTION_KEY)
    aes = AESGCM(key)
    blob = base64.b64decode(blob_b64)
    iv, ct = blob[:12], blob[12:]
    pt = aes.decrypt(iv, ct, None)
    return pt.decode()


def hash_pin(pin: str) -> str:
    return ph.hash(pin)


def verify_pin(pin_hash: str, pin: str) -> bool:
    try:
        return ph.verify(pin_hash, pin)
    except Exception:
        return False


def generate_pin() -> str:
    return f"{secrets.randbelow(10**6):06d}"


def sign_qr_token(payload: Dict[str, Any]) -> tuple[str, str]:
    if not settings.RS256_PRIVATE_KEY or not settings.RS256_PUBLIC_KEY:
        secret = _normalize_key(settings.APP_ENCRYPTION_KEY)
        jti = secrets.token_hex(8)
        full_payload = {**payload, "jti": jti, "exp": datetime.now(timezone.utc) + timedelta(hours=settings.ACCESS_CODE_TTL_HOURS)}
        token = jwt.encode(full_payload, secret, algorithm="HS256")
        return token, jti
    jti = secrets.token_hex(16)
    full_payload = {**payload, "jti": jti, "exp": datetime.now(timezone.utc) + timedelta(hours=settings.ACCESS_CODE_TTL_HOURS)}
    token = jwt.encode(full_payload, settings.RS256_PRIVATE_KEY, algorithm="RS256")
    return token, jti


def verify_qr_token(token: str) -> Dict[str, Any]:
    if not settings.RS256_PUBLIC_KEY or not settings.RS256_PRIVATE_KEY:
        secret = _normalize_key(settings.APP_ENCRYPTION_KEY)
        return jwt.decode(token, secret, algorithms=["HS256"])
    return jwt.decode(token, settings.RS256_PUBLIC_KEY, algorithms=["RS256"])


def hash_identifier(id_number: str) -> str:
    return hashlib.sha256(id_number.encode()).hexdigest()
