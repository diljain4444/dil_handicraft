"""Tests for purchases endpoints."""

import pytest
from datetime import date
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_purchase(auth_client: AsyncClient):
    """Test creating a purchase with expense calculation."""
    payload = {
        "supplier_name": "ABC Supplier",
        "product_category": "Handicrafts",
        "purchase_date": str(date.today()),
        "purchase_amount": "10000.00",
        "packing_cost": "500.00",
        "parcel_cost": "300.00",
        "other_expenses": "200.00",
        "notes": "Test purchase",
    }
    resp = await auth_client.post("/api/purchases", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["supplier_name"] == "ABC Supplier"
    assert data["purchase_amount"] == 10000.0
    assert data["packing_cost"] == 500.0
    assert data["parcel_cost"] == 300.0
    assert data["other_expenses"] == 200.0
    # Total expenditure = 10000 + 500 + 300 + 200 = 11000
    assert data["total_expenditure"] == 11000.0


@pytest.mark.asyncio
async def test_create_purchase_minimal(auth_client: AsyncClient):
    """Test creating a purchase with only required fields."""
    payload = {
        "supplier_name": "Min Supplier",
        "purchase_date": str(date.today()),
        "purchase_amount": "5000.00",
    }
    resp = await auth_client.post("/api/purchases", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["packing_cost"] == 0.0
    assert data["parcel_cost"] == 0.0
    assert data["other_expenses"] == 0.0
    assert data["total_expenditure"] == 5000.0


@pytest.mark.asyncio
async def test_list_purchases(auth_client: AsyncClient):
    """Test listing purchases."""
    resp = await auth_client.get("/api/purchases")
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data


@pytest.mark.asyncio
async def test_purchase_autocomplete(client: AsyncClient):
    """Test supplier autocomplete (no auth required)."""
    resp = await client.get("/api/purchases/autocomplete/suppliers?q=")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.asyncio
async def test_update_purchase(auth_client: AsyncClient):
    """Test updating a purchase."""
    create_resp = await auth_client.post("/api/purchases", json={
        "supplier_name": "Update Supplier",
        "purchase_date": str(date.today()),
        "purchase_amount": "3000.00",
    })
    purchase_id = create_resp.json()["id"]

    resp = await auth_client.put(f"/api/purchases/{purchase_id}", json={"purchase_amount": "3500.00"})
    assert resp.status_code == 200
    assert resp.json()["purchase_amount"] == 3500.0


@pytest.mark.asyncio
async def test_delete_purchase(auth_client: AsyncClient):
    """Test deleting a purchase."""
    create_resp = await auth_client.post("/api/purchases", json={
        "supplier_name": "Delete Supplier",
        "purchase_date": str(date.today()),
        "purchase_amount": "1000.00",
    })
    purchase_id = create_resp.json()["id"]

    resp = await auth_client.delete(f"/api/purchases/{purchase_id}")
    assert resp.status_code == 204

    get_resp = await auth_client.get(f"/api/purchases/{purchase_id}")
    assert get_resp.status_code == 404


@pytest.mark.asyncio
async def test_create_purchase_negative_amount(auth_client: AsyncClient):
    """Test that negative purchase amount is rejected."""
    resp = await auth_client.post("/api/purchases", json={
        "supplier_name": "Bad Supplier",
        "purchase_date": str(date.today()),
        "purchase_amount": "-100.00",
    })
    assert resp.status_code == 422
