"""Database models for telemetry events."""

import enum
from datetime import datetime, timezone
from typing import Any
from uuid import UUID as PyUUID, uuid4

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    event,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class UserRole(enum.Enum):
    ADMIN = "admin"
    OWNER = "owner"
    EMPLOYEE = "employee"


class AIProvider(enum.Enum):
    OPENAI = "openai"
    ANTHROPIC = "anthropic"


def utc_now() -> datetime:
    return datetime.now(timezone.utc)



class Organization(Base):
    __tablename__ = "organizations"

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    users: Mapped[list["User"]] = relationship(
        "User",
        back_populates="organization",
    )
    conversations: Mapped[list["Conversation"]] = relationship(
        "Conversation",
        back_populates="organization",
    )
    api_keys: Mapped[list["OrgApiKey"]] = relationship(
        "OrgApiKey",
        back_populates="organization",
    )
    policy_audit_logs: Mapped[list["PolicyAuditLog"]] = relationship(
        "PolicyAuditLog",
        back_populates="organization",
    )


class User(Base):
    __tablename__ = "users"

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    org_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        SAEnum(
            UserRole,
            name="user_role",
            values_callable=lambda values: [item.value for item in values],
        ),
        default=UserRole.EMPLOYEE,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    organization: Mapped[Organization] = relationship(
        "Organization",
        back_populates="users",
    )
    conversations: Mapped[list["Conversation"]] = relationship(
        "Conversation",
        back_populates="user",
    )
    policy_audit_logs: Mapped[list["PolicyAuditLog"]] = relationship(
        "PolicyAuditLog",
        back_populates="user",
    )

    __table_args__ = (
        Index("idx_users_org_id", "org_id"),
        Index("idx_users_email", "email"),
    )


class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    org_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    organization: Mapped[Organization] = relationship(
        "Organization",
        back_populates="conversations",
    )
    user: Mapped[User] = relationship(
        "User",
        back_populates="conversations",
    )
    messages: Mapped[list["Message"]] = relationship(
        "Message",
        back_populates="conversation",
    )

    __table_args__ = (
        Index("idx_conversations_org_user", "org_id", "user_id"),
    )


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    conversation_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("conversations.id", ondelete="CASCADE"),
        nullable=False,
    )
    role: Mapped[str] = mapped_column(String(20), nullable=False)
    clean_text: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    conversation: Mapped[Conversation] = relationship(
        "Conversation",
        back_populates="messages",
    )

    __table_args__ = (
        Index("idx_messages_conversation_id", "conversation_id"),
    )


class OrgApiKey(Base):
    __tablename__ = "org_api_keys"

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    org_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    provider: Mapped[AIProvider] = mapped_column(
        SAEnum(
            AIProvider,
            name="ai_provider",
            values_callable=lambda values: [item.value for item in values],
        ),
        nullable=False,
    )
    encrypted_key: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    organization: Mapped[Organization] = relationship(
        "Organization",
        back_populates="api_keys",
    )

    __table_args__ = (
        Index("idx_org_api_keys_org_id", "org_id"),
    )


class PolicyAuditLog(Base):
    __tablename__ = "policy_audit_log"

    id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    org_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[PyUUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    action: Mapped[str] = mapped_column(String(50), nullable=False)
    block_reason: Mapped[str | None] = mapped_column(String(255), nullable=True)
    pii_types_detected: Mapped[list[str] | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    organization: Mapped[Organization] = relationship(
        "Organization",
        back_populates="policy_audit_logs",
    )
    user: Mapped[User] = relationship(
        "User",
        back_populates="policy_audit_logs",
    )

    __table_args__ = (
        Index("idx_policy_audit_log_org_id", "org_id"),
    )


@event.listens_for(PolicyAuditLog, "before_update")
@event.listens_for(PolicyAuditLog, "before_delete")
def _prevent_policy_audit_log_mutation(*_: Any) -> None:
    raise RuntimeError("policy_audit_log is insert-only")
