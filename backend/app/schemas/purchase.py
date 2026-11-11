"""Pydantic schemas for purchases."""

from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, field_validator, ConfigDict


class PurchaseBase(BaseModel):
    """Base schema with common purchase fields."""
    supplier_name: str
    product_category: Optional[str] = None
    purchase_date: date
    purchase_amount: Decimal
    packing_cost: Decimal = Decimal("0")
    parcel_cost: Decimal = Decimal("0")
    other_expenses: Decimal = Decimal("0")
    notes: Optional[str] = None

    @field_validator("purchase_amount")
    @classmethod
    def purchase_amount_must_be_positive(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("purchase_amount must be greater than 0")
        return v

    @field_validator("packing_cost", "parcel_cost", "other_expenses")
    @classmethod
    def costs_must_be_non_negative(cls, v: Decimal) -> Decimal:
        if v < 0:
            raise ValueError("Cost fields must be >= 0")
        return v

    @field_validator("supplier_name")
    @classmethod
    def supplier_name_must_not_be_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("supplier_name must not be empty")
        return v.strip()


class PurchaseCreate(PurchaseBase):
    """Schema for creating a purchase."""
    pass


class PurchaseUpdate(BaseModel):
    """Schema for updating a purchase (all fields optional)."""
    supplier_name: Optional[str] = None
    product_category: Optional[str] = None
    purchase_date: Optional[date] = None
    purchase_amount: Optional[Decimal] = None
    packing_cost: Optional[Decimal] = None
    parcel_cost: Optional[Decimal] = None
    other_expenses: Optional[Decimal] = None
    notes: Optional[str] = None

    @field_validator("purchase_amount")
    @classmethod
    def purchase_amount_must_be_positive(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        if v is not None and v <= 0:
            raise ValueError("purchase_amount must be greater than 0")
        return v

    @field_validator("packing_cost", "parcel_cost", "other_expenses")
    @classmethod
    def costs_must_be_non_negative(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        if v is not None and v < 0:
            raise ValueError("Cost fields must be >= 0")
        return v


class PurchaseResponse(PurchaseBase):
    """Schema for purchase API responses."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    purchase_amount: float
    packing_cost: float
    parcel_cost: float
    other_expenses: float
    total_expenditure: Optional[float] = None
    created_at: datetime
    updated_at: datetime

    @field_validator("purchase_amount", "packing_cost", "parcel_cost", "other_expenses", mode="before")
    @classmethod
    def convert_decimal_to_float(cls, v):
        if isinstance(v, Decimal):
            return float(v)
        return v

    def model_post_init(self, __context) -> None:
        """Calculate total_expenditure after model initialization."""
        self.total_expenditure = (
            self.purchase_amount + self.packing_cost + self.parcel_cost + self.other_expenses
        )


class PurchaseListResponse(BaseModel):
    """Paginated list response for purchases."""
    items: list[PurchaseResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
