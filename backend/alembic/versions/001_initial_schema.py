"""Initial schema migration.

Revision ID: 001
Revises: 
Create Date: 2024-01-01

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create all initial tables."""
    # users table
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("username", sa.String(100), nullable=False),
        sa.Column("hashed_password", sa.String(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("username"),
    )
    op.create_index("ix_users_username", "users", ["username"])

    # wholesale_sales table
    op.create_table(
        "wholesale_sales",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("shop_name", sa.String(255), nullable=False),
        sa.Column("transaction_date", sa.Date(), nullable=False),
        sa.Column("selling_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("estimated_profit", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_wholesale_sales_shop_name", "wholesale_sales", ["shop_name"])
    op.create_index("ix_wholesale_sales_transaction_date", "wholesale_sales", ["transaction_date"])

    # retail_sales table
    op.create_table(
        "retail_sales",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("customer_label", sa.String(255), nullable=True),
        sa.Column("transaction_date", sa.Date(), nullable=False),
        sa.Column("selling_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("estimated_profit", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_retail_sales_transaction_date", "retail_sales", ["transaction_date"])

    # purchases table
    op.create_table(
        "purchases",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("supplier_name", sa.String(255), nullable=False),
        sa.Column("product_category", sa.String(255), nullable=True),
        sa.Column("purchase_date", sa.Date(), nullable=False),
        sa.Column("purchase_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("packing_cost", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("parcel_cost", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("other_expenses", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_purchases_supplier_name", "purchases", ["supplier_name"])
    op.create_index("ix_purchases_purchase_date", "purchases", ["purchase_date"])


def downgrade() -> None:
    """Drop all tables."""
    op.drop_table("purchases")
    op.drop_table("retail_sales")
    op.drop_table("wholesale_sales")
    op.drop_table("users")
