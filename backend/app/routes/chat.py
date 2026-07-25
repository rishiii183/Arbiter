"""
chat.py (route)
===============
POST /v1/chat - Authenticated, PII-mediated chat endpoint.
"""

from typing import Optional
from uuid import UUID

import httpx
import structlog
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy import select

from app.auth.dependencies import assert_same_org, get_current_user
from app.db.models import AIProvider, Conversation, Message, OrgApiKey, PolicyAuditLog
from app.db.session import AsyncSessionLocal
from app.services.key_vault import decrypt_api_key

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/v1", tags=["chat"])


class ChatRequest(BaseModel):
    """POST /v1/chat request."""

    session_id: Optional[UUID] = Field(None, description="Conversation/session UUID")
    message: str = Field(..., description="The user's new message")
    model_requested: str = Field("claude-sonnet-4-5")
    org_id: str = "org_default"
    user_id: str = "user_anonymous"
    system_prompt: Optional[str] = None


class ChatResponse(BaseModel):
    """Response from /v1/chat."""

    blocked: bool
    response: Optional[str] = None
    reason: Optional[str] = None
    conversation_id: Optional[str] = None
    session_id: Optional[str] = None


def _select_preferred_key(rows: list[OrgApiKey]) -> OrgApiKey:
    for row in rows:
        if row.provider == AIProvider.ANTHROPIC:
            return row
    return rows[0]


def _extract_assistant_text(provider: AIProvider, payload: dict) -> str:
    if provider == AIProvider.ANTHROPIC:
        content = payload.get("content", [])
        if content and isinstance(content, list):
            first = content[0]
            if isinstance(first, dict):
                return str(first.get("text", ""))
        return ""

    choices = payload.get("choices", [])
    if choices and isinstance(choices, list):
        first = choices[0]
        if isinstance(first, dict):
            message = first.get("message", {})
            if isinstance(message, dict):
                return str(message.get("content", ""))
    return ""


@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(
    req: ChatRequest,
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    jwt_org_id = UUID(current_user["org_id"])
    jwt_user_id = UUID(current_user["user_id"])
    assert_same_org(current_user, UUID(req.org_id))

    settings = request.app.state.settings

    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(OrgApiKey).where(OrgApiKey.org_id == jwt_org_id)
        )
        key_rows = list(result.scalars().all())

    if not key_rows:
        raise HTTPException(
            status_code=400,
            detail="No API key configured for this organization",
        )

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            pii_response = await client.post(
                f"{settings.pii_service_url}/process",
                headers={
                    "X-Service-Key": settings.pii_service_key.get_secret_value()
                },
                json={"prompt": req.message},
            )
            pii_response.raise_for_status()
    except httpx.HTTPError as exc:
        logger.warning("pii_service_unavailable", error=type(exc).__name__)
        raise HTTPException(status_code=503, detail="PII service unavailable") from exc

    pii_result = pii_response.json()
    clean_text = pii_result["clean_text"]

    if pii_result["blocked"] is True:
        async with AsyncSessionLocal() as session:
            session.add(
                PolicyAuditLog(
                    org_id=jwt_org_id,
                    user_id=jwt_user_id,
                    action="blocked",
                    block_reason=pii_result["block_reason"],
                    pii_types_detected=pii_result.get("pii_types_detected", []),
                )
            )
            await session.commit()
        return {
            "blocked": True,
            "reason": pii_result["block_reason"],
            "response": None,
        }

    key_row = _select_preferred_key(key_rows)
    try:
        plaintext_key = decrypt_api_key(
            key_row.encrypted_key,
            settings.arbiter_master_key.get_secret_value(),
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Key decryption error") from exc

    try:
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                if key_row.provider == AIProvider.ANTHROPIC:
                    vendor_response = await client.post(
                        "https://api.anthropic.com/v1/messages",
                        headers={
                            "x-api-key": plaintext_key,
                            "anthropic-version": "2023-06-01",
                            "content-type": "application/json",
                        },
                        json={
                            "model": "claude-sonnet-4-5",
                            "max_tokens": 1024,
                            "messages": [{"role": "user", "content": clean_text}],
                        },
                    )
                else:
                    vendor_response = await client.post(
                        "https://api.openai.com/v1/chat/completions",
                        headers={
                            "Authorization": (
                                "Bearer " + plaintext_key
                            ),
                            "content-type": "application/json",
                        },
                        json={
                            "model": "gpt-4o",
                            "messages": [{"role": "user", "content": clean_text}],
                        },
                    )
        finally:
            del plaintext_key
    except httpx.HTTPError as exc:
        logger.warning("ai_vendor_error", error=type(exc).__name__)
        raise HTTPException(status_code=502, detail="AI vendor error") from exc

    if vendor_response.status_code != 200:
        raise HTTPException(status_code=502, detail="AI vendor error")

    assistant_text = _extract_assistant_text(key_row.provider, vendor_response.json())
    final_response = assistant_text
    for placeholder, value in pii_result["placeholder_map"].items():
        final_response = final_response.replace(placeholder, value)

    async with AsyncSessionLocal() as session:
        async with session.begin():
            conversation = None
            if req.session_id:
                result = await session.execute(
                    select(Conversation).where(
                        Conversation.id == req.session_id,
                        Conversation.org_id == jwt_org_id,
                        Conversation.user_id == jwt_user_id,
                    )
                )
                conversation = result.scalar_one_or_none()

            if conversation is None:
                conversation = Conversation(org_id=jwt_org_id, user_id=jwt_user_id)
                session.add(conversation)
                await session.flush()

            session.add(
                Message(
                    conversation_id=conversation.id,
                    role="user",
                    clean_text=clean_text,
                )
            )
            session.add(
                Message(
                    conversation_id=conversation.id,
                    role="assistant",
                    clean_text=final_response,
                )
            )
            session.add(
                PolicyAuditLog(
                    org_id=jwt_org_id,
                    user_id=jwt_user_id,
                    action="passed",
                )
            )

    return {
        "blocked": False,
        "response": final_response,
        "conversation_id": str(conversation.id),
        "session_id": str(conversation.id),
    }


@router.get("/conversations")
async def list_conversations(
    current_user: dict = Depends(get_current_user),
):
    """GET /v1/conversations — list user's conversation history."""
    jwt_org_id = UUID(current_user["org_id"])
    jwt_user_id = UUID(current_user["user_id"])

    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Conversation)
            .where(
                Conversation.org_id == jwt_org_id,
                Conversation.user_id == jwt_user_id,
            )
            .order_by(Conversation.created_at.desc())
        )
        conversations = list(result.scalars().all())

    items = []
    for conv in conversations:
        # Fetch first user message as preview snippet
        async with AsyncSessionLocal() as session:
            msg_result = await session.execute(
                select(Message)
                .where(
                    Message.conversation_id == conv.id,
                    Message.role == "user",
                )
                .order_by(Message.created_at.asc())
                .limit(1)
            )
            first_msg = msg_result.scalar_one_or_none()

        preview = first_msg.clean_text[:80] if first_msg else ""
        items.append({
            "id": str(conv.id),
            "created_at": conv.created_at.isoformat(),
            "preview": preview,
        })

    return {"conversations": items}


@router.get("/conversations/{conversation_id}/messages")
async def get_conversation_messages(
    conversation_id: UUID,
    current_user: dict = Depends(get_current_user),
):
    """GET /v1/conversations/{id}/messages — fetch full message history."""
    jwt_org_id = UUID(current_user["org_id"])

    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Conversation).where(Conversation.id == conversation_id)
        )
        conv = result.scalar_one_or_none()

    if conv is None:
        raise HTTPException(status_code=404, detail="Conversation not found")

    assert_same_org(current_user, conv.org_id)

    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.asc())
        )
        messages = list(result.scalars().all())

    return {
        "conversation_id": str(conversation_id),
        "messages": [
            {
                "id": str(msg.id),
                "role": msg.role,
                "content": msg.clean_text,
                "created_at": msg.created_at.isoformat(),
            }
            for msg in messages
        ],
    }
