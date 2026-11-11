"""Service layer for retail sales CRUD and business logic."""

from datetime import date
from typing import Optional
from sqlalchemy import select, func, distinct
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.retail import RetailSale
from app.schemas.retail import RetailCreate, RetailUpdate


async def create_retail(db: AsyncSession, data: RetailCreate) -> RetailSale:
    """Create a new retail sale record."""
    sale = RetailSale(
        customer_label=data.customer_label,
        transaction_date=data.transaction_date,
        selling_amount=data.selling_amount,
        estimated_profit=data.estimated_profit,
        notes=data.notes,
    )
    db.add(sale)
    await db.flush()
    await db.refresh(sale)
    return sale


async def get_retail_by_id(db: AsyncSession, sale_id: int) -> Optional[RetailSale]:
    """Fetch a single retail sale by primary key."""
    result = await db.execute(select(RetailSale).where(RetailSale.id == sale_id))
    return result.scalar_one_or_none()


async def list_retail(
    db: AsyncSession,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    customer_label: Optional[str] = None,
    sort: str = "newest",
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[RetailSale], int]:
    """List retail sales with optional filters and pagination."""
    query = select(RetailSale)

    if start_date:
        query = query.where(RetailSale.transaction_date >= start_date)
    if end_date:
        query = query.where(RetailSale.transaction_date <= end_date)
    if customer_label:
        query = query.where(RetailSale.customer_label.ilike(f"%{customer_label}%"))

    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    if sort == "oldest":
        query = query.order_by(RetailSale.transaction_date.asc(), RetailSale.id.asc())
    else:
        query = query.order_by(RetailSale.transaction_date.desc(), RetailSale.id.desc())

    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    result = await db.execute(query)
    items = list(result.scalars().all())
    return items, total


async def update_retail(
    db: AsyncSession, sale: RetailSale, data: RetailUpdate
) -> RetailSale:
    """Update an existing retail sale with partial data."""
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(sale, field, value)
    await db.flush()
    await db.refresh(sale)
    return sale


async def delete_retail(db: AsyncSession, sale: RetailSale) -> None:
    """Delete a retail sale record."""
    await db.delete(sale)
    await db.flush()


async def autocomplete_customers(db: AsyncSession, q: str, limit: int = 10) -> list[str]:
    """Return distinct customer labels matching the query string."""
    query = (
        select(RetailSale.customer_label)
        .distinct()
        .where(
            RetailSale.customer_label.isnot(None),
            RetailSale.customer_label.ilike(f"%{q}%"),
        )
        .order_by(RetailSale.customer_label)
        .limit(limit)
    )
    result = await db.execute(query)
    return [row[0] for row in result.fetchall() if row[0]]
