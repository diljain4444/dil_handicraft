"""Service layer for wholesale sales CRUD and business logic."""

import math
from datetime import date
from typing import Optional
from sqlalchemy import select, func, or_, distinct
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.wholesale import WholesaleSale
from app.schemas.wholesale import WholesaleCreate, WholesaleUpdate


async def create_wholesale(db: AsyncSession, data: WholesaleCreate) -> WholesaleSale:
    """Create a new wholesale sale record."""
    sale = WholesaleSale(
        shop_name=data.shop_name,
        transaction_date=data.transaction_date,
        selling_amount=data.selling_amount,
        estimated_profit=data.estimated_profit,
        notes=data.notes,
    )
    db.add(sale)
    await db.flush()
    await db.refresh(sale)
    return sale


async def get_wholesale_by_id(db: AsyncSession, sale_id: int) -> Optional[WholesaleSale]:
    """Fetch a single wholesale sale by primary key."""
    result = await db.execute(select(WholesaleSale).where(WholesaleSale.id == sale_id))
    return result.scalar_one_or_none()


async def list_wholesale(
    db: AsyncSession,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    shop_name: Optional[str] = None,
    sort: str = "newest",
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[WholesaleSale], int]:
    """List wholesale sales with optional filters and pagination.

    Returns:
        Tuple of (items list, total count).
    """
    query = select(WholesaleSale)

    if start_date:
        query = query.where(WholesaleSale.transaction_date >= start_date)
    if end_date:
        query = query.where(WholesaleSale.transaction_date <= end_date)
    if shop_name:
        query = query.where(WholesaleSale.shop_name.ilike(f"%{shop_name}%"))

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    # Apply sorting
    if sort == "oldest":
        query = query.order_by(WholesaleSale.transaction_date.asc(), WholesaleSale.id.asc())
    else:
        query = query.order_by(WholesaleSale.transaction_date.desc(), WholesaleSale.id.desc())

    # Pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    result = await db.execute(query)
    items = list(result.scalars().all())
    return items, total


async def update_wholesale(
    db: AsyncSession, sale: WholesaleSale, data: WholesaleUpdate
) -> WholesaleSale:
    """Update an existing wholesale sale with partial data."""
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(sale, field, value)
    await db.flush()
    await db.refresh(sale)
    return sale


async def delete_wholesale(db: AsyncSession, sale: WholesaleSale) -> None:
    """Delete a wholesale sale record."""
    await db.delete(sale)
    await db.flush()


async def autocomplete_shops(db: AsyncSession, q: str, limit: int = 10) -> list[str]:
    """Return distinct shop names matching the query string."""
    query = (
        select(WholesaleSale.shop_name)
        .distinct()
        .where(WholesaleSale.shop_name.ilike(f"%{q}%"))
        .order_by(WholesaleSale.shop_name)
        .limit(limit)
    )
    result = await db.execute(query)
    return [row[0] for row in result.fetchall()]
