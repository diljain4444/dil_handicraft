"""Add udhar (credit/khata) table.

Revision ID: 002
Revises: 001
Create Date: 2024-11-21

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create the udhar table."""
    op.create_table(
        "udhar",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("customer_name", sa.String(255), nullable=False),
        sa.Column("original_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("remaining_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("udhar_date", sa.Date(), nullable=False),
        sa.Column("due_date", sa.Date(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("is_paid", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_udhar_customer_name", "udhar", ["customer_name"])
    op.create_index("ix_udhar_udhar_date", "udhar", ["udhar_date"])
    op.create_index("ix_udhar_is_paid", "udhar", ["is_paid"])


def downgrade() -> None:
    """Drop the udhar table."""
    op.drop_index("ix_udhar_is_paid", "udhar")
    op.drop_index("ix_udhar_udhar_date", "udhar")
    op.drop_index("ix_udhar_customer_name", "udhar")
    op.drop_table("udhar")
