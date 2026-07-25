"""drop_telemetry_tables

Revision ID: b668283dd672
Revises: 04efae25dce5
Create Date: 2026-05-29 16:51:37.958515

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b668283dd672'
down_revision: Union[str, Sequence[str], None] = '04efae25dce5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.drop_table("outbound_events")
    op.drop_table("failed_events")


def downgrade() -> None:
    """Downgrade schema."""
    pass
