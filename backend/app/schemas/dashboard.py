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


class DrillDownRow(BaseModel):
    """A single aggregated row in a KPI drill-down."""
    name: str              # Party name / customer name / supplier name
    total_amount: float    # Total sales amount OR total purchase expenditure
    total_profit: float    # Estimated profit (0 for purchases)
    transaction_count: int # Number of individual transactions


class DrillDownResponse(BaseModel):
    """Full drill-down response for a KPI card."""
    card_type: str         # 'wholesale_sales' | 'retail_sales' | 'purchase_expenditure' | 'wholesale_profit' | 'retail_profit'
    period_label: str
    rows: list[DrillDownRow]
    total_amount: float    # Grand total
    total_profit: float    # Grand total profit


class PartyBill(BaseModel):
    """An individual bill/transaction for a specific party."""
    id: int
    date: date
    amount: float          # selling_amount OR total_expenditure
    profit: float          # estimated_profit (0 for purchases)
    notes: Optional[str]


class PartyBillsResponse(BaseModel):
    """All individual bills for a specific party in a KPI drill-down."""
    card_type: str
    party_name: str
    period_label: str
    bills: list[PartyBill]
    total_amount: float
    total_profit: float
