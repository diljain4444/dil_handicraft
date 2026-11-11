"""Retail sales router."""

import math
from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.auth import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.retail import (
    RetailCreate, RetailUpdate, RetailResponse, RetailListResponse
)
from app.services import retail as svc

router = APIRouter(prefix="/retail", tags=["retail"])


@router.post("", response_model=RetailResponse, status_code=status.HTTP_201_CREATED,
             summary="Create a retail sale")
async def create_retail(
    body: RetailCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RetailResponse:
    """Create a new retail sale record."""
    sale = await svc.create_retail(db, body)
    return RetailResponse.model_validate(sale)


@router.get("/autocomplete/customers", response_model=list[str],
            summary="Autocomplete customer labels")
async def autocomplete_customers(
    q: str = Query("", description="Search string"),
    db: AsyncSession = Depends(get_db),
) -> list[str]:
    """Return customer labels matching the query (no auth required)."""
    return await svc.autocomplete_customers(db, q)


@router.get("", response_model=RetailListResponse, summary="List retail sales")
async def list_retail(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    customer_label: Optional[str] = Query(None),
    sort: str = Query("newest"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RetailListResponse:
    """List retail sales with optional filters and pagination."""
    items, total = await svc.list_retail(
        db, start_date=start_date, end_date=end_date,
        customer_label=customer_label, sort=sort, page=page, page_size=page_size,
    )
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    return RetailListResponse(
        items=[RetailResponse.model_validate(i) for i in items],
        total=total, page=page, page_size=page_size, total_pages=total_pages,
    )


@router.get("/{sale_id}", response_model=RetailResponse, summary="Get a retail sale")
async def get_retail(
    sale_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RetailResponse:
    """Get a single retail sale by ID."""
    sale = await svc.get_retail_by_id(db, sale_id)
    if not sale:
        raise HTTPException(status_code=404, detail="Retail sale not found")
    return RetailResponse.model_validate(sale)


@router.put("/{sale_id}", response_model=RetailResponse, summary="Update a retail sale")
async def update_retail(
    sale_id: int,
    body: RetailUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RetailResponse:
    """Update an existing retail sale record."""
    sale = await svc.get_retail_by_id(db, sale_id)
    if not sale:
        raise HTTPException(status_code=404, detail="Retail sale not found")
    updated = await svc.update_retail(db, sale, body)
    return RetailResponse.model_validate(updated)


@router.delete("/{sale_id}", status_code=status.HTTP_204_NO_CONTENT,
               summary="Delete a retail sale")
async def delete_retail(
    sale_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """Delete a retail sale record."""
    sale = await svc.get_retail_by_id(db, sale_id)
    if not sale:
        raise HTTPException(status_code=404, detail="Retail sale not found")
    await svc.delete_retail(db, sale)
