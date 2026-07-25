"""JWT helpers for Arbiter API authentication."""

from datetime import datetime, timedelta
from uuid import UUID

from fastapi import HTTPException
from jose import JWTError, jwt

from app.dependencies import get_settings

ALGORITHM = "HS256"
ACCESS_TOKEN_HOURS = 8


def create_access_token(org_id: UUID, user_id: UUID, role: str) -> str:
    payload = {
        "sub": str(user_id),
        "org_id": str(org_id),
        "role": role,
        "exp": datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_HOURS),
    }
    secret_key = get_settings().arbiter_secret_key.get_secret_value()
    return jwt.encode(payload, secret_key, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    secret_key = get_settings().arbiter_secret_key.get_secret_value()
    try:
        return jwt.decode(token, secret_key, algorithms=[ALGORITHM])
    except JWTError as exc:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
        ) from exc
