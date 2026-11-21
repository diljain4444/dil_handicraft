"""Udhar (credit/khata) router — CRUD endpoints."""

import math
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.auth import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.udhar import (
    UdharCreate, UdharUpdate, UdharResponse, UdharListResponse, UdharSummary
)
from app.services import udhar as svc

router = APIRouter(prefix="/udhar", tags=["udhar"])


@router.post("", response_model=UdharResponse, status_code=status.HTTP_201_CREATED,
             summary="Create an udhar entry")
async def create_udhar(
    body: UdharCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UdharResponse:
    """Create a new udhar (credit) entry for a customer."""
    entry = await svc.create_udhar(db, body)
    return UdharResponse.model_validate(entry)


@router.get("/summary", response_model=UdharSummary, summary="Udhar summary stats")
async def udhar_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UdharSummary:
    """Return total pending udhar amount and stats."""
    return await svc.get_udhar_summary(db)


@router.get("/autocomplete/customers", response_model=list[str],
            summary="Autocomplete customer names")
async def autocomplete_customers(
    q: str = Query("", description="Search string"),
    db: AsyncSession = Depends(get_db),
) -> list[str]:
    """Return customer names matching the query (no auth required)."""
    return await svc.autocomplete_customers(db, q)


@router.get("", response_model=UdharListResponse, summary="List udhar entries")
async def list_udhar(
    show_paid: bool = Query(False, description="Include paid/cleared entries"),
    customer_name: Optional[str] = Query(None, description="Partial name filter"),
    sort: str = Query("newest", description="newest | oldest | due_soon | highest"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UdharListResponse:
    """List udhar entries with optional filters and pagination."""
    items, total = await svc.list_udhar(
        db, show_paid=show_paid, customer_name=customer_name,
        sort=sort, page=page, page_size=page_size,
    )
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    return UdharListResponse(
        items=[UdharResponse.model_validate(i) for i in items],
        total=total, page=page, page_size=page_size, total_pages=total_pages,
    )


@router.get("/{udhar_id}", response_model=UdharResponse, summary="Get an udhar entry")
async def get_udhar(
    udhar_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UdharResponse:
    """Get a single udhar entry by ID."""
    entry = await svc.get_udhar_by_id(db, udhar_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Udhar entry not found")
    return UdharResponse.model_validate(entry)


@router.put("/{udhar_id}", response_model=UdharResponse, summary="Update an udhar entry")
async def update_udhar(
    udhar_id: int,
    body: UdharUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UdharResponse:
    """Update remaining amount, notes, due date, or mark as paid."""
    entry = await svc.get_udhar_by_id(db, udhar_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Udhar entry not found")
    updated = await svc.update_udhar(db, entry, body)
    return UdharResponse.model_validate(updated)


@router.delete("/{udhar_id}", status_code=status.HTTP_204_NO_CONTENT,
               summary="Delete an udhar entry")
async def delete_udhar(
    udhar_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """Delete an udhar entry completely."""
    entry = await svc.get_udhar_by_id(db, udhar_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Udhar entry not found")
    await svc.delete_udhar(db, entry)
