"""Service layer for purchases CRUD and business logic."""

from datetime import date
from typing import Optional
from sqlalchemy import select, func, distinct
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.purchase import Purchase
from app.schemas.purchase import PurchaseCreate, PurchaseUpdate


async def create_purchase(db: AsyncSession, data: PurchaseCreate) -> Purchase:
    """Create a new purchase record."""
    purchase = Purchase(
        supplier_name=data.supplier_name,
        product_category=data.product_category,
        purchase_date=data.purchase_date,
        purchase_amount=data.purchase_amount,
        packing_cost=data.packing_cost,
        parcel_cost=data.parcel_cost,
        other_expenses=data.other_expenses,
        notes=data.notes,
    )
    db.add(purchase)
    await db.flush()
    await db.refresh(purchase)
    return purchase


async def get_purchase_by_id(db: AsyncSession, purchase_id: int) -> Optional[Purchase]:
    """Fetch a single purchase by primary key."""
    result = await db.execute(select(Purchase).where(Purchase.id == purchase_id))
    return result.scalar_one_or_none()


async def list_purchases(
    db: AsyncSession,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    supplier_name: Optional[str] = None,
    sort: str = "newest",
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Purchase], int]:
    """List purchases with optional filters and pagination."""
    query = select(Purchase)

    if start_date:
        query = query.where(Purchase.purchase_date >= start_date)
    if end_date:
        query = query.where(Purchase.purchase_date <= end_date)
    if supplier_name:
        query = query.where(Purchase.supplier_name.ilike(f"%{supplier_name}%"))

    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    if sort == "oldest":
        query = query.order_by(Purchase.purchase_date.asc(), Purchase.id.asc())
    else:
        query = query.order_by(Purchase.purchase_date.desc(), Purchase.id.desc())

    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    result = await db.execute(query)
    items = list(result.scalars().all())
    return items, total


async def update_purchase(
    db: AsyncSession, purchase: Purchase, data: PurchaseUpdate
) -> Purchase:
    """Update an existing purchase with partial data."""
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(purchase, field, value)
    await db.flush()
    await db.refresh(purchase)
    return purchase


async def delete_purchase(db: AsyncSession, purchase: Purchase) -> None:
    """Delete a purchase record."""
    await db.delete(purchase)
    await db.flush()


async def autocomplete_suppliers(db: AsyncSession, q: str, limit: int = 10) -> list[str]:
    """Return distinct supplier names matching the query string."""
    query = (
        select(Purchase.supplier_name)
        .distinct()
        .where(Purchase.supplier_name.ilike(f"%{q}%"))
        .order_by(Purchase.supplier_name)
        .limit(limit)
    )
    result = await db.execute(query)
    return [row[0] for row in result.fetchall()]
