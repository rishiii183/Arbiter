"""FastAPI dependencies for JWT-authenticated Arbiter routes."""

from typing import Optional
from uuid import UUID

from fastapi import Header, HTTPException

from app.auth.jwt import decode_access_token


async def get_current_user(
    authorization: Optional[str] = Header(None),
) -> dict:
    if not authorization:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    claims = decode_access_token(token)
    try:
        return {
            "user_id": claims["sub"],
            "org_id": claims["org_id"],
            "role": claims["role"],
        }
    except KeyError as exc:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
        ) from exc


def assert_same_org(claims: dict, request_org_id: UUID) -> None:
    if str(request_org_id) != claims["org_id"]:
        raise HTTPException(status_code=403, detail="Org mismatch")
