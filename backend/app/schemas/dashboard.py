"""Pydantic schemas for dashboard and analytics responses."""

from datetime import date
from typing import Optional
from pydantic import BaseModel


class DashboardSummary(BaseModel):
    """Summary statistics for the dashboard."""
    total_sales: float
    wholesale_sales: float
    retail_sales: float
    wholesale_profit: float = 0.0
    retail_profit: float = 0.0
    total_purchase_expenditure: float
    total_purchase_amount: float
    total_additional_expenses: float
    total_estimated_profit: float
    wholesale_count: int
    retail_count: int
    purchase_count: int
    period_label: str
    start_date: Optional[date]
    end_date: Optional[date]


class SalesTrendPoint(BaseModel):
    """A single data point for the sales trend chart."""
    date: date
    wholesale: float
    retail: float
    total: float


class PurchaseTrendPoint(BaseModel):
    """A single data point for the purchase trend chart."""
    date: date
    purchase_amount: float
    total_expenditure: float


class ProfitTrendPoint(BaseModel):
    """A single data point for the profit trend chart."""
    date: date
    estimated_profit: float


class SalesDistribution(BaseModel):
    """Distribution of sales between wholesale and retail."""
    wholesale_total: float
    retail_total: float
    wholesale_pct: float
    retail_pct: float


class TopShopItem(BaseModel):
    """Top shop by sales."""
    shop_name: str
    total_sales: float
    total_profit: float = 0.0
    transaction_count: int


class TopSupplierItem(BaseModel):
    """Top supplier by purchase amount."""
    supplier_name: str
    total_expenditure: float
    total_purchase: float
    total_purchase_amount: float = 0.0
    packing_cost: float = 0.0
    parcel_cost: float = 0.0
    other_expenses: float = 0.0
    transaction_count: int


class MonthlyBreakdown(BaseModel):
    """Monthly aggregated data."""
    month: str
    year: int
    month_num: int
    wholesale_sales: float
    retail_sales: float
    total_sales: float
    total_purchase_expenditure: float
    estimated_profit: float
    wholesale: float = 0.0
    retail: float = 0.0
    purchases: float = 0.0
    profit: float = 0.0


class DailyBreakdown(BaseModel):
    """Daily aggregated data."""
    date: date
    wholesale: float
    retail: float
    total_sales: float
    purchases: float
    profit: float


class PeriodParams(BaseModel):
    """Common period query parameters."""
    period: str = "month"
    start_date: Optional[date] = None
    end_date: Optional[date] = None
