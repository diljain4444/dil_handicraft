"""Wholesale sales router."""

import math
from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.auth import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.wholesale import (
    WholesaleCreate, WholesaleUpdate, WholesaleResponse, WholesaleListResponse
)
from app.services import wholesale as svc

router = APIRouter(prefix="/wholesale", tags=["wholesale"])


@router.post("", response_model=WholesaleResponse, status_code=status.HTTP_201_CREATED,
             summary="Create a wholesale sale")
async def create_wholesale(
    body: WholesaleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> WholesaleResponse:
    """Create a new wholesale sale record."""
    sale = await svc.create_wholesale(db, body)
    return WholesaleResponse.model_validate(sale)


@router.get("/autocomplete/shops", response_model=list[str],
            summary="Autocomplete shop names")
async def autocomplete_shops(
    q: str = Query("", description="Search string"),
    db: AsyncSession = Depends(get_db),
) -> list[str]:
    """Return shop names matching the query (no auth required)."""
    return await svc.autocomplete_shops(db, q)


@router.get("", response_model=WholesaleListResponse, summary="List wholesale sales")
async def list_wholesale(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    shop_name: Optional[str] = Query(None, description="Partial match filter"),
    sort: str = Query("newest", description="newest or oldest"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> WholesaleListResponse:
    """List wholesale sales with optional date range, name filter, and pagination."""
    items, total = await svc.list_wholesale(
        db, start_date=start_date, end_date=end_date,
        shop_name=shop_name, sort=sort, page=page, page_size=page_size,
    )
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    return WholesaleListResponse(
        items=[WholesaleResponse.model_validate(i) for i in items],
        total=total, page=page, page_size=page_size, total_pages=total_pages,
    )


@router.get("/{sale_id}", response_model=WholesaleResponse, summary="Get a wholesale sale")
async def get_wholesale(
    sale_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> WholesaleResponse:
    """Get a single wholesale sale by ID."""
    sale = await svc.get_wholesale_by_id(db, sale_id)
    if not sale:
        raise HTTPException(status_code=404, detail="Wholesale sale not found")
    return WholesaleResponse.model_validate(sale)


@router.put("/{sale_id}", response_model=WholesaleResponse, summary="Update a wholesale sale")
async def update_wholesale(
    sale_id: int,
    body: WholesaleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> WholesaleResponse:
    """Update an existing wholesale sale record."""
    sale = await svc.get_wholesale_by_id(db, sale_id)
    if not sale:
        raise HTTPException(status_code=404, detail="Wholesale sale not found")
    updated = await svc.update_wholesale(db, sale, body)
    return WholesaleResponse.model_validate(updated)


@router.delete("/{sale_id}", status_code=status.HTTP_204_NO_CONTENT,
               summary="Delete a wholesale sale")
async def delete_wholesale(
    sale_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """Delete a wholesale sale record."""
    sale = await svc.get_wholesale_by_id(db, sale_id)
    if not sale:
        raise HTTPException(status_code=404, detail="Wholesale sale not found")
    await svc.delete_wholesale(db, sale)
