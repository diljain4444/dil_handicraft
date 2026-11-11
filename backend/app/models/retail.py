"""SQLAlchemy model for retail sales."""

from decimal import Decimal
from sqlalchemy import Integer, String, Date, Numeric, Text, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class RetailSale(Base):
    """Represents a retail sale transaction."""

    __tablename__ = "retail_sales"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    customer_label: Mapped[str | None] = mapped_column(String(255), nullable=True)
    transaction_date: Mapped[Date] = mapped_column(Date, nullable=False, index=True)
    selling_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    estimated_profit: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, server_default="0")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    def __repr__(self) -> str:
        return f"<RetailSale(id={self.id}, customer={self.customer_label}, amount={self.selling_amount})>"
