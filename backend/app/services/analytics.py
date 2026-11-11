"""Analytics service: date range helpers, aggregation queries for dashboard and analytics."""

import calendar
import csv
import io
from datetime import datetime, date, timedelta
from decimal import Decimal
from typing import Optional
import pytz
from sqlalchemy import select, func, text, case
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.wholesale import WholesaleSale
from app.models.retail import RetailSale
from app.models.purchase import Purchase
from app.schemas.dashboard import (
    DashboardSummary, SalesTrendPoint, PurchaseTrendPoint, ProfitTrendPoint,
    SalesDistribution, TopShopItem, TopSupplierItem, MonthlyBreakdown, DailyBreakdown,
)

IST = pytz.timezone("Asia/Kolkata")


def get_ist_today() -> date:
    """Return today's date in IST timezone."""
    return datetime.now(IST).date()


def get_date_range(
    period: str,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> tuple[Optional[date], Optional[date], str]:
    """Compute start/end dates and a human-readable label for a named period.

    Args:
        period: One of today|yesterday|week|month|financial_year|calendar_year|overall|custom
        start_date: Used when period='custom'
        end_date: Used when period='custom'

    Returns:
        (start_date, end_date, label)
    """
    today = get_ist_today()

    if period == "today":
        return today, today, "Today"

    elif period == "yesterday":
        yesterday = today - timedelta(days=1)
        return yesterday, yesterday, "Yesterday"

    elif period == "week":
        # Monday of current week
        monday = today - timedelta(days=today.weekday())
        return monday, today, "This Week"

    elif period == "month":
        month_start = today.replace(day=1)
        return month_start, today, "This Month"

    elif period == "financial_year":
        if today.month >= 4:
            fy_start = date(today.year, 4, 1)
        else:
            fy_start = date(today.year - 1, 4, 1)
        label = f"FY {fy_start.year}-{str(fy_start.year + 1)[-2:]}"
        return fy_start, today, label

    elif period == "calendar_year":
        year_start = date(today.year, 1, 1)
        return year_start, today, f"Year {today.year}"

    elif period == "overall":
        return None, None, "All Time"

    elif period == "custom":
        label = "Custom Period"
        if start_date and end_date:
            label = f"{start_date} to {end_date}"
        return start_date, end_date, label

    else:
        # Default to month
        month_start = today.replace(day=1)
        return month_start, today, "This Month"


def _apply_wholesale_date_filter(query, start_date, end_date):
    if start_date:
        query = query.where(WholesaleSale.transaction_date >= start_date)
    if end_date:
        query = query.where(WholesaleSale.transaction_date <= end_date)
    return query


def _apply_retail_date_filter(query, start_date, end_date):
    if start_date:
        query = query.where(RetailSale.transaction_date >= start_date)
    if end_date:
        query = query.where(RetailSale.transaction_date <= end_date)
    return query


def _apply_purchase_date_filter(query, start_date, end_date):
    if start_date:
        query = query.where(Purchase.purchase_date >= start_date)
    if end_date:
        query = query.where(Purchase.purchase_date <= end_date)
    return query


def _d(val) -> float:
    """Convert None or Decimal to float safely."""
    if val is None:
        return 0.0
    return float(val)


async def get_dashboard_summary(
    db: AsyncSession,
    start_date: Optional[date],
    end_date: Optional[date],
    period_label: str,
) -> DashboardSummary:
    """Compute the main dashboard summary statistics."""
    # Wholesale aggregation
    ws_q = select(
        func.coalesce(func.sum(WholesaleSale.selling_amount), 0).label("total_sales"),
        func.coalesce(func.sum(WholesaleSale.estimated_profit), 0).label("total_profit"),
        func.count(WholesaleSale.id).label("count"),
    )
    ws_q = _apply_wholesale_date_filter(ws_q, start_date, end_date)
    ws_result = (await db.execute(ws_q)).one()

    # Retail aggregation
    rt_q = select(
        func.coalesce(func.sum(RetailSale.selling_amount), 0).label("total_sales"),
        func.coalesce(func.sum(RetailSale.estimated_profit), 0).label("total_profit"),
        func.count(RetailSale.id).label("count"),
    )
    rt_q = _apply_retail_date_filter(rt_q, start_date, end_date)
    rt_result = (await db.execute(rt_q)).one()

    # Purchases aggregation
    pu_q = select(
        func.coalesce(func.sum(Purchase.purchase_amount), 0).label("purchase_amount"),
        func.coalesce(func.sum(Purchase.packing_cost), 0).label("packing_cost"),
        func.coalesce(func.sum(Purchase.parcel_cost), 0).label("parcel_cost"),
        func.coalesce(func.sum(Purchase.other_expenses), 0).label("other_expenses"),
        func.count(Purchase.id).label("count"),
    )
    pu_q = _apply_purchase_date_filter(pu_q, start_date, end_date)
    pu_result = (await db.execute(pu_q)).one()

    wholesale_sales = _d(ws_result.total_sales)
    retail_sales = _d(rt_result.total_sales)
    total_sales = wholesale_sales + retail_sales
    ws_profit = _d(ws_result.total_profit)
    rt_profit = _d(rt_result.total_profit)

    purchase_amount = _d(pu_result.purchase_amount)
    additional_expenses = (
        _d(pu_result.packing_cost) + _d(pu_result.parcel_cost) + _d(pu_result.other_expenses)
    )
    total_purchase_expenditure = purchase_amount + additional_expenses

    return DashboardSummary(
        total_sales=total_sales,
        wholesale_sales=wholesale_sales,
        retail_sales=retail_sales,
        wholesale_profit=ws_profit,
        retail_profit=rt_profit,
        total_purchase_expenditure=total_purchase_expenditure,
        total_purchase_amount=purchase_amount,
        total_additional_expenses=additional_expenses,
        total_estimated_profit=ws_profit + rt_profit,
        wholesale_count=ws_result.count,
        retail_count=rt_result.count,
        purchase_count=pu_result.count,
        period_label=period_label,
        start_date=start_date,
        end_date=end_date,
    )


async def get_sales_trend(
    db: AsyncSession,
    start_date: Optional[date],
    end_date: Optional[date],
) -> list[SalesTrendPoint]:
    """Daily sales trend (wholesale + retail) for the given period."""
    # Wholesale per day
    ws_q = select(
        WholesaleSale.transaction_date.label("dt"),
        func.coalesce(func.sum(WholesaleSale.selling_amount), 0).label("ws"),
    ).group_by(WholesaleSale.transaction_date)
    ws_q = _apply_wholesale_date_filter(ws_q, start_date, end_date)
    ws_rows = (await db.execute(ws_q)).fetchall()
    ws_map = {row.dt: _d(row.ws) for row in ws_rows}

    # Retail per day
    rt_q = select(
        RetailSale.transaction_date.label("dt"),
        func.coalesce(func.sum(RetailSale.selling_amount), 0).label("rt"),
    ).group_by(RetailSale.transaction_date)
    rt_q = _apply_retail_date_filter(rt_q, start_date, end_date)
    rt_rows = (await db.execute(rt_q)).fetchall()
    rt_map = {row.dt: _d(row.rt) for row in rt_rows}

    all_dates = sorted(set(list(ws_map.keys()) + list(rt_map.keys())))
    return [
        SalesTrendPoint(
            date=d,
            wholesale=ws_map.get(d, 0.0),
            retail=rt_map.get(d, 0.0),
            total=ws_map.get(d, 0.0) + rt_map.get(d, 0.0),
        )
        for d in all_dates
    ]


async def get_purchase_trend(
    db: AsyncSession,
    start_date: Optional[date],
    end_date: Optional[date],
) -> list[PurchaseTrendPoint]:
    """Daily purchase trend for the given period."""
    q = select(
        Purchase.purchase_date.label("dt"),
        func.coalesce(func.sum(Purchase.purchase_amount), 0).label("purchase_amount"),
        func.coalesce(
            func.sum(Purchase.purchase_amount + Purchase.packing_cost + Purchase.parcel_cost + Purchase.other_expenses),
            0,
        ).label("total_expenditure"),
    ).group_by(Purchase.purchase_date).order_by(Purchase.purchase_date)
    q = _apply_purchase_date_filter(q, start_date, end_date)
    rows = (await db.execute(q)).fetchall()
    return [
        PurchaseTrendPoint(
            date=row.dt,
            purchase_amount=_d(row.purchase_amount),
            total_expenditure=_d(row.total_expenditure),
        )
        for row in rows
    ]


async def get_profit_trend(
    db: AsyncSession,
    start_date: Optional[date],
    end_date: Optional[date],
) -> list[ProfitTrendPoint]:
    """Daily estimated profit trend."""
    ws_q = select(
        WholesaleSale.transaction_date.label("dt"),
        func.coalesce(func.sum(WholesaleSale.estimated_profit), 0).label("profit"),
    ).group_by(WholesaleSale.transaction_date)
    ws_q = _apply_wholesale_date_filter(ws_q, start_date, end_date)
    ws_rows = (await db.execute(ws_q)).fetchall()
    ws_map = {row.dt: _d(row.profit) for row in ws_rows}

    rt_q = select(
        RetailSale.transaction_date.label("dt"),
        func.coalesce(func.sum(RetailSale.estimated_profit), 0).label("profit"),
    ).group_by(RetailSale.transaction_date)
    rt_q = _apply_retail_date_filter(rt_q, start_date, end_date)
    rt_rows = (await db.execute(rt_q)).fetchall()
    rt_map = {row.dt: _d(row.profit) for row in rt_rows}

    all_dates = sorted(set(list(ws_map.keys()) + list(rt_map.keys())))
    return [
        ProfitTrendPoint(
            date=d,
            estimated_profit=ws_map.get(d, 0.0) + rt_map.get(d, 0.0),
        )
        for d in all_dates
    ]


async def get_sales_distribution(
    db: AsyncSession,
    start_date: Optional[date],
    end_date: Optional[date],
) -> SalesDistribution:
    """Return wholesale vs retail sales distribution."""
    ws_q = select(func.coalesce(func.sum(WholesaleSale.selling_amount), 0))
    ws_q = _apply_wholesale_date_filter(ws_q, start_date, end_date)
    ws_total = _d((await db.execute(ws_q)).scalar_one())

    rt_q = select(func.coalesce(func.sum(RetailSale.selling_amount), 0))
    rt_q = _apply_retail_date_filter(rt_q, start_date, end_date)
    rt_total = _d((await db.execute(rt_q)).scalar_one())

    grand = ws_total + rt_total
    ws_pct = (ws_total / grand * 100) if grand > 0 else 0.0
    rt_pct = (rt_total / grand * 100) if grand > 0 else 0.0

    return SalesDistribution(
        wholesale_total=ws_total,
        retail_total=rt_total,
        wholesale_pct=round(ws_pct, 2),
        retail_pct=round(rt_pct, 2),
    )


async def get_top_shops(
    db: AsyncSession,
    start_date: Optional[date],
    end_date: Optional[date],
    limit: int = 10,
) -> list[TopShopItem]:
    """Top shops by total wholesale sales in the selected period."""
    q = select(
        WholesaleSale.shop_name,
        func.coalesce(func.sum(WholesaleSale.selling_amount), 0).label("total_sales"),
        func.coalesce(func.sum(WholesaleSale.estimated_profit), 0).label("total_profit"),
        func.count(WholesaleSale.id).label("transaction_count"),
    )
    q = _apply_wholesale_date_filter(q, start_date, end_date)
    q = q.group_by(WholesaleSale.shop_name).order_by(func.sum(WholesaleSale.selling_amount).desc()).limit(limit)
    rows = (await db.execute(q)).fetchall()
    return [
        TopShopItem(
            shop_name=row[0],
            total_sales=_d(row[1]),
            total_profit=_d(row[2]),
            transaction_count=row[3],
        )
        for row in rows
    ]


async def get_top_suppliers(
    db: AsyncSession,
    start_date: Optional[date],
    end_date: Optional[date],
    limit: int = 10,
) -> list[TopSupplierItem]:
    """Top suppliers by total purchase expenditure within the selected period."""
    total_exp_expr = (
        Purchase.purchase_amount +
        Purchase.packing_cost +
        Purchase.parcel_cost +
        Purchase.other_expenses
    )
    q = select(
        Purchase.supplier_name,
        func.coalesce(func.sum(total_exp_expr), 0).label("total_exp"),
        func.coalesce(func.sum(Purchase.purchase_amount), 0).label("base_amount"),
        func.coalesce(func.sum(Purchase.packing_cost), 0).label("packing"),
        func.coalesce(func.sum(Purchase.parcel_cost), 0).label("parcel"),
        func.coalesce(func.sum(Purchase.other_expenses), 0).label("other"),
        func.count(Purchase.id).label("cnt"),
    )
    q = _apply_purchase_date_filter(q, start_date, end_date)
    q = q.group_by(Purchase.supplier_name).order_by(func.sum(total_exp_expr).desc()).limit(limit)
    rows = (await db.execute(q)).fetchall()
    return [
        TopSupplierItem(
            supplier_name=row[0],
            total_expenditure=_d(row[1]),
            total_purchase=_d(row[1]),
            total_purchase_amount=_d(row[2]),
            packing_cost=_d(row[3]),
            parcel_cost=_d(row[4]),
            other_expenses=_d(row[5]),
            transaction_count=row[6],
        )
        for row in rows
    ]


async def get_monthly_breakdown(
    db: AsyncSession,
    start_date: Optional[date],
    end_date: Optional[date],
    period: Optional[str] = None,
) -> list[MonthlyBreakdown]:
    """Monthly breakdown of sales, purchases, and profit."""
    # If period is a sub-month period (today, yesterday, week), or if no dates are given,
    # expand the range to the current financial year so the monthly table and chart are always rich.
    if period in ["today", "yesterday", "week"] and not (start_date and end_date and period == "custom"):
        today = get_ist_today()
        if today.month >= 4:
            start_date = date(today.year, 4, 1)
        else:
            start_date = date(today.year - 1, 4, 1)
        end_date = today

    # Wholesale monthly
    ws_q = select(
        func.extract("year", WholesaleSale.transaction_date).label("year"),
        func.extract("month", WholesaleSale.transaction_date).label("month"),
        func.coalesce(func.sum(WholesaleSale.selling_amount), 0).label("ws"),
        func.coalesce(func.sum(WholesaleSale.estimated_profit), 0).label("ws_profit"),
    )
    ws_q = _apply_wholesale_date_filter(ws_q, start_date, end_date)
    ws_q = ws_q.group_by(
        func.extract("year", WholesaleSale.transaction_date),
        func.extract("month", WholesaleSale.transaction_date),
    )
    ws_rows = (await db.execute(ws_q)).fetchall()
    ws_map = {(int(r.year), int(r.month)): (_d(r.ws), _d(r.ws_profit)) for r in ws_rows}

    # Retail monthly
    rt_q = select(
        func.extract("year", RetailSale.transaction_date).label("year"),
        func.extract("month", RetailSale.transaction_date).label("month"),
        func.coalesce(func.sum(RetailSale.selling_amount), 0).label("rt"),
        func.coalesce(func.sum(RetailSale.estimated_profit), 0).label("rt_profit"),
    )
    rt_q = _apply_retail_date_filter(rt_q, start_date, end_date)
    rt_q = rt_q.group_by(
        func.extract("year", RetailSale.transaction_date),
        func.extract("month", RetailSale.transaction_date),
    )
    rt_rows = (await db.execute(rt_q)).fetchall()
    rt_map = {(int(r.year), int(r.month)): (_d(r.rt), _d(r.rt_profit)) for r in rt_rows}

    # Purchases monthly
    total_exp_expr = (
        Purchase.purchase_amount +
        Purchase.packing_cost +
        Purchase.parcel_cost +
        Purchase.other_expenses
    )
    pu_q = select(
        func.extract("year", Purchase.purchase_date).label("year"),
        func.extract("month", Purchase.purchase_date).label("month"),
        func.coalesce(func.sum(total_exp_expr), 0).label("pu"),
    )
    pu_q = _apply_purchase_date_filter(pu_q, start_date, end_date)
    pu_q = pu_q.group_by(
        func.extract("year", Purchase.purchase_date),
        func.extract("month", Purchase.purchase_date),
    )
    pu_rows = (await db.execute(pu_q)).fetchall()
    pu_map = {(int(r.year), int(r.month)): _d(r.pu) for r in pu_rows}

    all_keys = sorted(set(list(ws_map.keys()) + list(rt_map.keys()) + list(pu_map.keys())))
    result = []
    for (yr, mo) in all_keys:
        ws, ws_p = ws_map.get((yr, mo), (0.0, 0.0))
        rt, rt_p = rt_map.get((yr, mo), (0.0, 0.0))
        pu = pu_map.get((yr, mo), 0.0)
        profit_total = ws_p + rt_p
        month_label = f"{calendar.month_abbr[mo]} {yr}"
        result.append(MonthlyBreakdown(
            month=month_label,
            year=yr,
            month_num=mo,
            wholesale_sales=ws,
            retail_sales=rt,
            total_sales=ws + rt,
            total_purchase_expenditure=pu,
            estimated_profit=profit_total,
            wholesale=ws,
            retail=rt,
            purchases=pu,
            profit=profit_total,
        ))
    return result


async def get_daily_breakdown(
    db: AsyncSession,
    start_date: Optional[date],
    end_date: Optional[date],
) -> list[DailyBreakdown]:
    """Daily breakdown of sales, purchases, and profit."""
    ws_q = select(
        WholesaleSale.transaction_date.label("dt"),
        func.coalesce(func.sum(WholesaleSale.selling_amount), 0).label("ws"),
        func.coalesce(func.sum(WholesaleSale.estimated_profit), 0).label("ws_profit"),
    ).group_by(WholesaleSale.transaction_date)
    ws_q = _apply_wholesale_date_filter(ws_q, start_date, end_date)
    ws_rows = (await db.execute(ws_q)).fetchall()
    ws_map = {r.dt: (_d(r.ws), _d(r.ws_profit)) for r in ws_rows}

    rt_q = select(
        RetailSale.transaction_date.label("dt"),
        func.coalesce(func.sum(RetailSale.selling_amount), 0).label("rt"),
        func.coalesce(func.sum(RetailSale.estimated_profit), 0).label("rt_profit"),
    ).group_by(RetailSale.transaction_date)
    rt_q = _apply_retail_date_filter(rt_q, start_date, end_date)
    rt_rows = (await db.execute(rt_q)).fetchall()
    rt_map = {r.dt: (_d(r.rt), _d(r.rt_profit)) for r in rt_rows}

    pu_q = select(
        Purchase.purchase_date.label("dt"),
        func.coalesce(
            func.sum(Purchase.purchase_amount + Purchase.packing_cost + Purchase.parcel_cost + Purchase.other_expenses),
            0,
        ).label("pu"),
    ).group_by(Purchase.purchase_date)
    pu_q = _apply_purchase_date_filter(pu_q, start_date, end_date)
    pu_rows = (await db.execute(pu_q)).fetchall()
    pu_map = {r.dt: _d(r.pu) for r in pu_rows}

    all_dates = sorted(set(list(ws_map.keys()) + list(rt_map.keys()) + list(pu_map.keys())))
    result = []
    for d in all_dates:
        ws, ws_p = ws_map.get(d, (0.0, 0.0))
        rt, rt_p = rt_map.get(d, (0.0, 0.0))
        pu = pu_map.get(d, 0.0)
        result.append(DailyBreakdown(
            date=d,
            wholesale=ws, retail=rt,
            total_sales=ws + rt,
            purchases=pu,
            profit=ws_p + rt_p,
        ))
    return result


async def generate_export_csv(
    db: AsyncSession,
    start_date: Optional[date],
    end_date: Optional[date],
) -> str:
    """Generate a CSV string containing all transactions for the period."""
    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    writer.writerow([
        "Type", "Date", "Name", "Category/Label",
        "Amount", "Packing Cost", "Parcel Cost", "Other Expenses",
        "Total Expenditure", "Estimated Profit", "Notes",
    ])

    # Wholesale
    ws_q = select(WholesaleSale).order_by(WholesaleSale.transaction_date)
    ws_q = _apply_wholesale_date_filter(ws_q, start_date, end_date)
    ws_rows = (await db.execute(ws_q)).scalars().all()
    for r in ws_rows:
        writer.writerow([
            "Wholesale", r.transaction_date, r.shop_name, "",
            float(r.selling_amount), "", "", "",
            float(r.selling_amount), float(r.estimated_profit), r.notes or "",
        ])

    # Retail
    rt_q = select(RetailSale).order_by(RetailSale.transaction_date)
    rt_q = _apply_retail_date_filter(rt_q, start_date, end_date)
    rt_rows = (await db.execute(rt_q)).scalars().all()
    for r in rt_rows:
        writer.writerow([
            "Retail", r.transaction_date, r.customer_label or "", "",
            float(r.selling_amount), "", "", "",
            float(r.selling_amount), float(r.estimated_profit), r.notes or "",
        ])

    # Purchases
    pu_q = select(Purchase).order_by(Purchase.purchase_date)
    pu_q = _apply_purchase_date_filter(pu_q, start_date, end_date)
    pu_rows = (await db.execute(pu_q)).scalars().all()
    for r in pu_rows:
        total_exp = float(r.purchase_amount + r.packing_cost + r.parcel_cost + r.other_expenses)
        writer.writerow([
            "Purchase", r.purchase_date, r.supplier_name, r.product_category or "",
            float(r.purchase_amount), float(r.packing_cost), float(r.parcel_cost),
            float(r.other_expenses), total_exp, "", r.notes or "",
        ])

    return output.getvalue()
