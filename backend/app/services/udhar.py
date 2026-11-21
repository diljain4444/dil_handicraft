"""Service layer for Udhar (credit/khata) CRUD and business logic."""

import math
from datetime import date
from typing import Optional
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.udhar import Udhar
from app.schemas.udhar import UdharCreate, UdharUpdate, UdharSummary


async def create_udhar(db: AsyncSession, data: UdharCreate) -> Udhar:
    """Create a new udhar entry. remaining_amount starts equal to original_amount."""
    entry = Udhar(
        customer_name=data.customer_name,
        original_amount=data.original_amount,
        remaining_amount=data.original_amount,  # starts at full amount
        udhar_date=data.udhar_date,
        due_date=data.due_date,
        notes=data.notes,
        is_paid=False,
    )
    db.add(entry)
    await db.flush()
    await db.refresh(entry)
    return entry


async def get_udhar_by_id(db: AsyncSession, udhar_id: int) -> Optional[Udhar]:
    """Fetch a single udhar entry by primary key."""
    result = await db.execute(select(Udhar).where(Udhar.id == udhar_id))
    return result.scalar_one_or_none()


async def list_udhar(
    db: AsyncSession,
    show_paid: bool = False,
    customer_name: Optional[str] = None,
    sort: str = "newest",
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Udhar], int]:
    """List udhar entries with optional filters and pagination."""
    query = select(Udhar)

    if not show_paid:
        query = query.where(Udhar.is_paid == False)  # noqa: E712
    if customer_name:
        query = query.where(Udhar.customer_name.ilike(f"%{customer_name}%"))

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar_one()

    # Sorting
    if sort == "oldest":
        query = query.order_by(Udhar.udhar_date.asc(), Udhar.id.asc())
    elif sort == "due_soon":
        # Entries with due_date first (soonest first), then those without
        query = query.order_by(Udhar.due_date.asc().nulls_last(), Udhar.udhar_date.desc())
    elif sort == "highest":
        query = query.order_by(Udhar.remaining_amount.desc(), Udhar.id.desc())
    else:
        query = query.order_by(Udhar.udhar_date.desc(), Udhar.id.desc())

    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    result = await db.execute(query)
    return list(result.scalars().all()), total


async def update_udhar(db: AsyncSession, entry: Udhar, data: UdharUpdate) -> Udhar:
    """Update an existing udhar entry with partial data."""
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(entry, field, value)
    # Auto-mark as paid if remaining_amount reaches 0
    if entry.remaining_amount is not None and float(entry.remaining_amount) <= 0:
        entry.is_paid = True
        entry.remaining_amount = type(entry.remaining_amount)(0)
    await db.flush()
    await db.refresh(entry)
    return entry


async def delete_udhar(db: AsyncSession, entry: Udhar) -> None:
    """Delete an udhar entry."""
    await db.delete(entry)
    await db.flush()


async def get_udhar_summary(db: AsyncSession) -> UdharSummary:
    """Return summary stats for all pending udhar entries."""
    today = date.today()

    q = select(
        func.coalesce(func.sum(Udhar.remaining_amount), 0).label("total_pending"),
        func.count(Udhar.id).label("total_customers"),
    ).where(Udhar.is_paid == False)  # noqa: E712
    row = (await db.execute(q)).one()

    # Overdue: due_date is set and is before today
    oq = select(
        func.count(Udhar.id).label("cnt"),
        func.coalesce(func.sum(Udhar.remaining_amount), 0).label("amt"),
    ).where(
        Udhar.is_paid == False,  # noqa: E712
        Udhar.due_date != None,  # noqa: E711
        Udhar.due_date < today,
    )
    orow = (await db.execute(oq)).one()

    return UdharSummary(
        total_pending=float(row.total_pending),
        total_customers=row.total_customers,
        overdue_count=orow.cnt,
        overdue_amount=float(orow.amt),
    )


async def autocomplete_customers(db: AsyncSession, q: str, limit: int = 10) -> list[str]:
    """Return distinct customer names matching the query string."""
    query = (
        select(Udhar.customer_name)
        .distinct()
        .where(Udhar.customer_name.ilike(f"%{q}%"))
        .order_by(Udhar.customer_name)
        .limit(limit)
    )
    result = await db.execute(query)
    return [row[0] for row in result.fetchall()]
