"""initial_schema

Revision ID: 04efae25dce5
Revises: 
Create Date: 2026-05-29 16:10:20.021172

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '04efae25dce5'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema — create all tables from models."""
    # Create enums
    user_role_enum = postgresql.ENUM('admin', 'owner', 'employee', name='user_role')
    user_role_enum.create(op.get_bind(), checkfirst=True)
    
    ai_provider_enum = postgresql.ENUM('openai', 'anthropic', name='ai_provider')
    ai_provider_enum.create(op.get_bind(), checkfirst=True)
    
    # Create outbound_events table
    op.create_table(
        'outbound_events',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('event_json', postgresql.JSONB(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('sent', sa.Boolean(), nullable=False),
        sa.Column('retry_count', sa.Integer(), nullable=False),
        sa.Column('last_error', sa.Text(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint('sent IN (true, false)')
    )
    op.create_index('idx_outbound_pending', 'outbound_events', ['sent', 'created_at'])
    
    # Create failed_events table
    op.create_table(
        'failed_events',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('event_json', postgresql.JSONB(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('failed_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('retry_count', sa.Integer(), nullable=False),
        sa.Column('last_error', sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create organizations table
    op.create_table(
        'organizations',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('org_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('role', user_role_enum, nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['org_id'], ['organizations.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )
    op.create_index('idx_users_org_id', 'users', ['org_id'])
    op.create_index('idx_users_email', 'users', ['email'])
    
    # Create conversations table
    op.create_table(
        'conversations',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('org_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['org_id'], ['organizations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_conversations_org_user', 'conversations', ['org_id', 'user_id'])
    
    # Create messages table
    op.create_table(
        'messages',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('conversation_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('role', sa.String(length=20), nullable=False),
        sa.Column('clean_text', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['conversation_id'], ['conversations.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_messages_conversation_id', 'messages', ['conversation_id'])
    
    # Create org_api_keys table
    op.create_table(
        'org_api_keys',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('org_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('provider', ai_provider_enum, nullable=False),
        sa.Column('encrypted_key', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['org_id'], ['organizations.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_org_api_keys_org_id', 'org_api_keys', ['org_id'])
    
    # Create policy_audit_log table
    op.create_table(
        'policy_audit_log',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('org_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('action', sa.String(length=50), nullable=False),
        sa.Column('block_reason', sa.String(length=255), nullable=True),
        sa.Column('pii_types_detected', postgresql.JSONB(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['org_id'], ['organizations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_policy_audit_log_org_id', 'policy_audit_log', ['org_id'])


def downgrade() -> None:
    """Downgrade schema — drop all tables."""
    # Drop tables in reverse order to respect foreign keys
    op.drop_index('idx_policy_audit_log_org_id', table_name='policy_audit_log')
    op.drop_table('policy_audit_log')
    op.drop_index('idx_org_api_keys_org_id', table_name='org_api_keys')
    op.drop_table('org_api_keys')
    op.drop_index('idx_messages_conversation_id', table_name='messages')
    op.drop_table('messages')
    op.drop_index('idx_conversations_org_user', table_name='conversations')
    op.drop_table('conversations')
    op.drop_index('idx_users_email', table_name='users')
    op.drop_index('idx_users_org_id', table_name='users')
    op.drop_table('users')
    op.drop_table('organizations')
    op.drop_table('failed_events')
    op.drop_index('idx_outbound_pending', table_name='outbound_events')
    op.drop_table('outbound_events')
    
    # Drop enums
    ai_provider_enum = postgresql.ENUM('openai', 'anthropic', name='ai_provider')
    ai_provider_enum.drop(op.get_bind(), checkfirst=True)
    
    user_role_enum = postgresql.ENUM('admin', 'owner', 'employee', name='user_role')
    user_role_enum.drop(op.get_bind(), checkfirst=True)
