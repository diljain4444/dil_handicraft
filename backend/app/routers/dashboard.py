"""Dashboard router: summary statistics and trend data."""

from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.auth import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.dashboard import (
    DashboardSummary, SalesTrendPoint, PurchaseTrendPoint, ProfitTrendPoint, SalesDistribution
)
from app.services.analytics import (
    get_date_range, get_dashboard_summary, get_sales_trend,
    get_purchase_trend, get_profit_trend, get_sales_distribution,
)

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def _parse_period(
    period: str = Query("month"),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
):
    return get_date_range(period, start_date, end_date)


@router.get("/summary", response_model=DashboardSummary, summary="Dashboard summary statistics")
async def dashboard_summary(
    period: str = Query("month", description="Period: today|yesterday|week|month|financial_year|calendar_year|overall|custom"),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DashboardSummary:
    """Return aggregated KPI summary for the selected period."""
    sd, ed, label = get_date_range(period, start_date, end_date)
    return await get_dashboard_summary(db, sd, ed, label)


@router.get("/sales-trend", response_model=list[SalesTrendPoint], summary="Daily sales trend")
async def sales_trend(
    period: str = Query("month"),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[SalesTrendPoint]:
    """Return daily wholesale and retail sales over the selected period."""
    sd, ed, _ = get_date_range(period, start_date, end_date)
    return await get_sales_trend(db, sd, ed)


@router.get("/purchase-trend", response_model=list[PurchaseTrendPoint], summary="Daily purchase trend")
async def purchase_trend(
    period: str = Query("month"),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[PurchaseTrendPoint]:
    """Return daily purchase amounts over the selected period."""
    sd, ed, _ = get_date_range(period, start_date, end_date)
    return await get_purchase_trend(db, sd, ed)


@router.get("/profit-trend", response_model=list[ProfitTrendPoint], summary="Daily profit trend")
async def profit_trend(
    period: str = Query("month"),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ProfitTrendPoint]:
    """Return daily estimated profit over the selected period."""
    sd, ed, _ = get_date_range(period, start_date, end_date)
    return await get_profit_trend(db, sd, ed)


@router.get("/sales-distribution", response_model=SalesDistribution,
            summary="Wholesale vs retail distribution")
async def sales_distribution(
    period: str = Query("month"),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SalesDistribution:
    """Return the split between wholesale and retail sales."""
    sd, ed, _ = get_date_range(period, start_date, end_date)
    return await get_sales_distribution(db, sd, ed)
