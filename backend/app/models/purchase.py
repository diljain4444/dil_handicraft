"""SQLAlchemy model for purchases."""

from decimal import Decimal
from sqlalchemy import Integer, String, Date, Numeric, Text, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class Purchase(Base):
    """Represents a purchase/procurement transaction."""

    __tablename__ = "purchases"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    supplier_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    product_category: Mapped[str | None] = mapped_column(String(255), nullable=True)
    purchase_date: Mapped[Date] = mapped_column(Date, nullable=False, index=True)
    purchase_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    packing_cost: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, server_default="0")
    parcel_cost: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, server_default="0")
    other_expenses: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, server_default="0")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    def __repr__(self) -> str:
        return f"<Purchase(id={self.id}, supplier={self.supplier_name}, amount={self.purchase_amount})>"
