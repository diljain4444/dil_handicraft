"""Analytics router: deep-dive analytics and CSV export."""

from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
import io

from app.auth.auth import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.dashboard import (
    DashboardSummary, TopShopItem, TopSupplierItem, MonthlyBreakdown, DailyBreakdown
)
from app.services.analytics import (
    get_date_range, get_dashboard_summary, get_top_shops, get_top_suppliers,
    get_monthly_breakdown, get_daily_breakdown, generate_export_csv,
)

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/overview", response_model=DashboardSummary, summary="Analytics overview")
async def analytics_overview(
    period: str = Query("month"),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DashboardSummary:
    """Return detailed summary statistics for the selected period."""
    sd, ed, label = get_date_range(period, start_date, end_date)
    return await get_dashboard_summary(db, sd, ed, label)


@router.get("/top-shops", response_model=list[TopShopItem], summary="Top shops by sales")
async def top_shops(
    period: str = Query("month"),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[TopShopItem]:
    """Return top 10 shops by total wholesale sales."""
    sd, ed, _ = get_date_range(period, start_date, end_date)
    return await get_top_shops(db, sd, ed)


@router.get("/top-suppliers", response_model=list[TopSupplierItem], summary="Top suppliers by purchase")
async def top_suppliers(
    period: str = Query("month"),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[TopSupplierItem]:
    """Return top 10 suppliers by total purchase amount."""
    sd, ed, _ = get_date_range(period, start_date, end_date)
    return await get_top_suppliers(db, sd, ed)


@router.get("/monthly-breakdown", response_model=list[MonthlyBreakdown],
            summary="Monthly breakdown")
async def monthly_breakdown(
    period: str = Query("calendar_year"),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[MonthlyBreakdown]:
    """Return month-by-month breakdown of sales, purchases, and profit."""
    sd, ed, _ = get_date_range(period, start_date, end_date)
    return await get_monthly_breakdown(db, sd, ed, period=period)


@router.get("/daily-breakdown", response_model=list[DailyBreakdown],
            summary="Daily breakdown")
async def daily_breakdown(
    period: str = Query("month"),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[DailyBreakdown]:
    """Return day-by-day breakdown of sales, purchases, and profit."""
    sd, ed, _ = get_date_range(period, start_date, end_date)
    return await get_daily_breakdown(db, sd, ed)


@router.get("/export-csv", summary="Export transactions as CSV")
async def export_csv(
    period: str = Query("month"),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StreamingResponse:
    """Download all transactions for the period as a CSV file."""
    sd, ed, label = get_date_range(period, start_date, end_date)
    csv_content = await generate_export_csv(db, sd, ed)
    filename = f"dil_handicraft_{label.replace(' ', '_')}.csv"
    return StreamingResponse(
        io.StringIO(csv_content),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
