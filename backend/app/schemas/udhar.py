"""Pydantic schemas for Udhar (credit/khata) entries."""

from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, field_validator, ConfigDict


class UdharCreate(BaseModel):
    """Schema for creating a new udhar entry."""
    customer_name: str
    original_amount: Decimal
    udhar_date: date
    due_date: Optional[date] = None
    notes: Optional[str] = None

    @field_validator("original_amount")
    @classmethod
    def amount_must_be_positive(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("original_amount must be greater than 0")
        return v

    @field_validator("customer_name")
    @classmethod
    def name_must_not_be_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("customer_name must not be empty")
        return v.strip()


class UdharUpdate(BaseModel):
    """Schema for updating an udhar entry (all fields optional)."""
    customer_name: Optional[str] = None
    remaining_amount: Optional[Decimal] = None
    due_date: Optional[date] = None
    notes: Optional[str] = None
    is_paid: Optional[bool] = None

    @field_validator("remaining_amount")
    @classmethod
    def remaining_must_be_non_negative(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        if v is not None and v < 0:
            raise ValueError("remaining_amount must be >= 0")
        return v


class UdharResponse(BaseModel):
    """Schema for udhar API responses."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    customer_name: str
    original_amount: float
    remaining_amount: float
    udhar_date: date
    due_date: Optional[date]
    notes: Optional[str]
    is_paid: bool
    created_at: datetime
    updated_at: datetime

    @field_validator("original_amount", "remaining_amount", mode="before")
    @classmethod
    def convert_decimal_to_float(cls, v):
        if isinstance(v, Decimal):
            return float(v)
        return v


class UdharListResponse(BaseModel):
    """Paginated list response for udhar entries."""
    items: list[UdharResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class UdharSummary(BaseModel):
    """Summary statistics for the udhar section."""
    total_pending: float
    total_customers: int
    overdue_count: int
    overdue_amount: float
