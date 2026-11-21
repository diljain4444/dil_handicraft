"""SQLAlchemy model for Udhar (credit/khata) entries."""

from decimal import Decimal
from sqlalchemy import Integer, String, Date, Numeric, Text, Boolean, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class Udhar(Base):
    """Represents a credit (udhar) entry — money owed by a customer."""

    __tablename__ = "udhar"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    customer_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    original_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    remaining_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    udhar_date: Mapped[Date] = mapped_column(Date, nullable=False, index=True)
    due_date: Mapped[Date | None] = mapped_column(Date, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_paid: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false", default=False)
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    def __repr__(self) -> str:
        return f"<Udhar(id={self.id}, customer={self.customer_name}, remaining={self.remaining_amount})>"
