"""Pydantic schemas for wholesale sales."""

from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, field_validator, ConfigDict


class WholesaleBase(BaseModel):
    """Base schema with common wholesale fields."""
    shop_name: str
    transaction_date: date
    selling_amount: Decimal
    estimated_profit: Decimal = Decimal("0")
    notes: Optional[str] = None

    @field_validator("selling_amount")
    @classmethod
    def selling_amount_must_be_positive(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("selling_amount must be greater than 0")
        return v

    @field_validator("estimated_profit")
    @classmethod
    def estimated_profit_must_be_non_negative(cls, v: Decimal) -> Decimal:
        if v < 0:
            raise ValueError("estimated_profit must be >= 0")
        return v

    @field_validator("shop_name")
    @classmethod
    def shop_name_must_not_be_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("shop_name must not be empty")
        return v.strip()


class WholesaleCreate(WholesaleBase):
    """Schema for creating a wholesale sale."""
    pass


class WholesaleUpdate(BaseModel):
    """Schema for updating a wholesale sale (all fields optional)."""
    shop_name: Optional[str] = None
    transaction_date: Optional[date] = None
    selling_amount: Optional[Decimal] = None
    estimated_profit: Optional[Decimal] = None
    notes: Optional[str] = None

    @field_validator("selling_amount")
    @classmethod
    def selling_amount_must_be_positive(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        if v is not None and v <= 0:
            raise ValueError("selling_amount must be greater than 0")
        return v

    @field_validator("estimated_profit")
    @classmethod
    def estimated_profit_must_be_non_negative(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        if v is not None and v < 0:
            raise ValueError("estimated_profit must be >= 0")
        return v


class WholesaleResponse(WholesaleBase):
    """Schema for wholesale sale API responses."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    selling_amount: float
    estimated_profit: float
    created_at: datetime
    updated_at: datetime

    @field_validator("selling_amount", "estimated_profit", mode="before")
    @classmethod
    def convert_decimal_to_float(cls, v):
        if isinstance(v, Decimal):
            return float(v)
        return v


class WholesaleListResponse(BaseModel):
    """Paginated list response for wholesale sales."""
    items: list[WholesaleResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
