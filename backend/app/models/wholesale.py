"""SQLAlchemy model for wholesale sales."""

from decimal import Decimal
from sqlalchemy import Integer, String, Date, Numeric, Text, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class WholesaleSale(Base):
    """Represents a wholesale sale transaction."""

    __tablename__ = "wholesale_sales"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    shop_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
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
        return f"<WholesaleSale(id={self.id}, shop={self.shop_name}, amount={self.selling_amount})>"
