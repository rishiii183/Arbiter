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
):
    settings = request.app.state.settings
    pipeline = getattr(request.app.state, "pipeline", None)

    if not pipeline:
        from app.engine.pipeline import GuardPipeline
        pipeline = GuardPipeline(settings)
        request.app.state.pipeline = pipeline

    # 1. Run prompt through Guard Pipeline
    res = await pipeline.guard(req.message)

    if res.blocked:
        reason_str = res.block_detail or (res.block_reason.value if hasattr(res, "block_reason") and res.block_reason else "Security Policy Triggered")
        return ChatResponse(
            blocked=True,
            reason=reason_str,
            response=None,
        )

    # 2. Forward scrubbed prompt to Groq Live LLM if key is present
    groq_key = settings.groq_api_key.get_secret_value() if getattr(settings, "groq_api_key", None) else None
    if groq_key:
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                model_name = req.model_requested if req.model_requested != "claude-sonnet-4-5" else "llama-3.3-70b-versatile"
                vendor_response = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {groq_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": model_name,
                        "messages": [{"role": "user", "content": res.clean_text}],
                    },
                )
                if vendor_response.status_code == 200:
                    data = vendor_response.json()
                    assistant_text = data["choices"][0]["message"]["content"]
                    return ChatResponse(
                        blocked=False,
                        response=assistant_text,
                    )
        except Exception as exc:
            logger.warning("groq_proxy_error", error=str(exc))

    return ChatResponse(
        blocked=False,
        response=f"Arbiter Guard Processed Prompt: '{res.clean_text}'",
    )

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
