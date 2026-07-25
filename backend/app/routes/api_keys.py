from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, UUID4
from typing import Literal
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import AsyncSessionLocal
from app.db.models import OrgApiKey, AIProvider
from app.services.key_vault import encrypt_api_key
from app.dependencies import get_settings
from app.auth.dependencies import get_current_user, assert_same_org

router = APIRouter()


class StoreKeyRequest(BaseModel):
    org_id: UUID4
    provider: Literal["openai", "anthropic"]
    api_key: str


def _require_admin_or_owner(current_user: dict) -> None:
    if current_user["role"] not in ("admin", "owner"):
        raise HTTPException(
            status_code=403,
            detail="Insufficient permissions",
        )


@router.post("/admin/api-keys")
async def store_api_key(
    req: StoreKeyRequest,
    current_user: dict = Depends(get_current_user),
):
    assert_same_org(current_user, req.org_id)
    _require_admin_or_owner(current_user)

    settings = get_settings()
    encrypted = encrypt_api_key(
        req.api_key,
        settings.arbiter_master_key.get_secret_value()
    )
    del req.api_key

    async with AsyncSessionLocal() as session:
        row = OrgApiKey(
            org_id=req.org_id,
            provider=AIProvider(req.provider),
            encrypted_key=encrypted,
        )
        session.add(row)
        await session.commit()

    return {"status": "stored", "provider": req.provider, "org_id": str(req.org_id)}


@router.get("/admin/api-keys")
async def list_api_keys(
    current_user: dict = Depends(get_current_user),
):
    _require_admin_or_owner(current_user)

    jwt_org_id = UUID(current_user["org_id"])

    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(OrgApiKey).where(OrgApiKey.org_id == jwt_org_id)
        )
        rows = list(result.scalars().all())

    keys = []
    for row in rows:
        masked_key = f"{row.provider.value}-key-...{str(row.id)[-4:]}"
        keys.append({
            "id": str(row.id),
            "provider": row.provider.value,
            "masked_key": masked_key,
            "created_at": row.created_at.isoformat(),
        })

    return {"keys": keys}