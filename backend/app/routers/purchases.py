"""Purchases router."""

import math
from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.auth import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.purchase import (
    PurchaseCreate, PurchaseUpdate, PurchaseResponse, PurchaseListResponse
)
from app.services import purchases as svc

router = APIRouter(prefix="/purchases", tags=["purchases"])


@router.post("", response_model=PurchaseResponse, status_code=status.HTTP_201_CREATED,
             summary="Create a purchase")
async def create_purchase(
    body: PurchaseCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PurchaseResponse:
    """Create a new purchase record."""
    purchase = await svc.create_purchase(db, body)
    return PurchaseResponse.model_validate(purchase)


@router.get("/autocomplete/suppliers", response_model=list[str],
            summary="Autocomplete supplier names")
async def autocomplete_suppliers(
    q: str = Query("", description="Search string"),
    db: AsyncSession = Depends(get_db),
) -> list[str]:
    """Return supplier names matching the query (no auth required)."""
    return await svc.autocomplete_suppliers(db, q)


@router.get("", response_model=PurchaseListResponse, summary="List purchases")
async def list_purchases(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    supplier_name: Optional[str] = Query(None),
    sort: str = Query("newest"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PurchaseListResponse:
    """List purchases with optional filters and pagination."""
    items, total = await svc.list_purchases(
        db, start_date=start_date, end_date=end_date,
        supplier_name=supplier_name, sort=sort, page=page, page_size=page_size,
    )
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    return PurchaseListResponse(
        items=[PurchaseResponse.model_validate(i) for i in items],
        total=total, page=page, page_size=page_size, total_pages=total_pages,
    )


@router.get("/{purchase_id}", response_model=PurchaseResponse, summary="Get a purchase")
async def get_purchase(
    purchase_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PurchaseResponse:
    """Get a single purchase by ID."""
    purchase = await svc.get_purchase_by_id(db, purchase_id)
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")
    return PurchaseResponse.model_validate(purchase)


@router.put("/{purchase_id}", response_model=PurchaseResponse, summary="Update a purchase")
async def update_purchase(
    purchase_id: int,
    body: PurchaseUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PurchaseResponse:
    """Update an existing purchase record."""
    purchase = await svc.get_purchase_by_id(db, purchase_id)
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")
    updated = await svc.update_purchase(db, purchase, body)
    return PurchaseResponse.model_validate(updated)


@router.delete("/{purchase_id}", status_code=status.HTTP_204_NO_CONTENT,
               summary="Delete a purchase")
async def delete_purchase(
    purchase_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """Delete a purchase record."""
    purchase = await svc.get_purchase_by_id(db, purchase_id)
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")
    await svc.delete_purchase(db, purchase)
