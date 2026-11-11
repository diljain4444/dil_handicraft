"""Tests for dashboard endpoints."""

import pytest
from datetime import date
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_dashboard_summary(auth_client: AsyncClient):
    """Test the dashboard summary endpoint."""
    # Create some test data first
    today = str(date.today())

    await auth_client.post("/api/wholesale", json={
        "shop_name": "Dashboard Shop",
        "transaction_date": today,
        "selling_amount": "5000.00",
        "estimated_profit": "500.00",
    })
    await auth_client.post("/api/retail", json={
        "transaction_date": today,
        "selling_amount": "2000.00",
        "estimated_profit": "200.00",
    })
    await auth_client.post("/api/purchases", json={
        "supplier_name": "Dashboard Supplier",
        "purchase_date": today,
        "purchase_amount": "3000.00",
        "packing_cost": "100.00",
    })

    resp = await auth_client.get("/api/dashboard/summary?period=today")
    assert resp.status_code == 200
    data = resp.json()

    assert "total_sales" in data
    assert "wholesale_sales" in data
    assert "retail_sales" in data
    assert "total_purchase_expenditure" in data
    assert "wholesale_profit" in data
    assert "retail_profit" in data
    assert "total_estimated_profit" in data
    assert "wholesale_count" in data
    assert "retail_count" in data
    assert "purchase_count" in data
    assert "period_label" in data
    assert data["period_label"] == "Today"

    # Values should be positive given data we inserted
    assert data["wholesale_sales"] >= 5000.0
    assert data["retail_sales"] >= 2000.0
    assert data["total_purchase_amount"] >= 3000.0
    assert data["wholesale_profit"] >= 500.0
    assert data["retail_profit"] >= 200.0


@pytest.mark.asyncio
async def test_dashboard_summary_overall(auth_client: AsyncClient):
    """Test dashboard summary for overall period."""
    resp = await auth_client.get("/api/dashboard/summary?period=overall")
    assert resp.status_code == 200
    data = resp.json()
    assert data["period_label"] == "All Time"
    assert data["start_date"] is None
    assert data["end_date"] is None


@pytest.mark.asyncio
async def test_sales_trend(auth_client: AsyncClient):
    """Test the sales trend endpoint."""
    resp = await auth_client.get("/api/dashboard/sales-trend?period=month")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.asyncio
async def test_purchase_trend(auth_client: AsyncClient):
    """Test the purchase trend endpoint."""
    resp = await auth_client.get("/api/dashboard/purchase-trend?period=month")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.asyncio
async def test_profit_trend(auth_client: AsyncClient):
    """Test the profit trend endpoint."""
    resp = await auth_client.get("/api/dashboard/profit-trend?period=month")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.asyncio
async def test_sales_distribution(auth_client: AsyncClient):
    """Test the sales distribution endpoint."""
    resp = await auth_client.get("/api/dashboard/sales-distribution?period=overall")
    assert resp.status_code == 200
    data = resp.json()
    assert "wholesale_total" in data
    assert "retail_total" in data
    assert "wholesale_pct" in data
    assert "retail_pct" in data


@pytest.mark.asyncio
async def test_dashboard_requires_auth(client: AsyncClient):
    """Test that dashboard endpoints require authentication."""
    resp = await client.get("/api/dashboard/summary")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_top_suppliers_and_monthly(auth_client: AsyncClient):
    """Test top suppliers with period filter and monthly breakdown structure."""
    resp = await auth_client.get("/api/analytics/top-suppliers?period=month")
    assert resp.status_code == 200
    suppliers = resp.json()
    assert isinstance(suppliers, list)

    resp_m = await auth_client.get("/api/analytics/monthly-breakdown?period=calendar_year")
    assert resp_m.status_code == 200
    breakdown = resp_m.json()
    assert isinstance(breakdown, list)
    if len(breakdown) > 0:
        first = breakdown[0]
        assert "month" in first
        assert "total_sales" in first
        assert "total_purchase_expenditure" in first


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    """Test the health check endpoint."""
    resp = await client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"
