"""Pydantic schemas for retail sales."""

from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, field_validator, ConfigDict


class RetailBase(BaseModel):
    """Base schema with common retail fields."""
    customer_label: Optional[str] = None
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


class RetailCreate(RetailBase):
    """Schema for creating a retail sale."""
    pass


class RetailUpdate(BaseModel):
    """Schema for updating a retail sale (all fields optional)."""
    customer_label: Optional[str] = None
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


class RetailResponse(RetailBase):
    """Schema for retail sale API responses."""
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


class RetailListResponse(BaseModel):
    """Paginated list response for retail sales."""
    items: list[RetailResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
