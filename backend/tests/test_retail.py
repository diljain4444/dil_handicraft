"""Tests for retail sales endpoints."""

import pytest
from datetime import date
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_retail(auth_client: AsyncClient):
    """Test creating a retail sale."""
    payload = {
        "customer_label": "Walk-in Customer",
        "transaction_date": str(date.today()),
        "selling_amount": "1500.00",
        "estimated_profit": "300.00",
    }
    resp = await auth_client.post("/api/retail", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["customer_label"] == "Walk-in Customer"
    assert data["selling_amount"] == 1500.0


@pytest.mark.asyncio
async def test_create_retail_no_customer(auth_client: AsyncClient):
    """Test creating a retail sale without a customer label."""
    payload = {
        "transaction_date": str(date.today()),
        "selling_amount": "750.00",
        "estimated_profit": "75.00",
    }
    resp = await auth_client.post("/api/retail", json=payload)
    assert resp.status_code == 201
    assert resp.json()["customer_label"] is None


@pytest.mark.asyncio
async def test_list_retail(auth_client: AsyncClient):
    """Test listing retail sales."""
    resp = await auth_client.get("/api/retail")
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data


@pytest.mark.asyncio
async def test_retail_autocomplete(client: AsyncClient):
    """Test customer autocomplete (no auth required)."""
    resp = await client.get("/api/retail/autocomplete/customers?q=")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.asyncio
async def test_update_retail(auth_client: AsyncClient):
    """Test updating a retail sale."""
    create_resp = await auth_client.post("/api/retail", json={
        "transaction_date": str(date.today()),
        "selling_amount": "500.00",
        "estimated_profit": "50.00",
    })
    sale_id = create_resp.json()["id"]

    resp = await auth_client.put(f"/api/retail/{sale_id}", json={"selling_amount": "600.00"})
    assert resp.status_code == 200
    assert resp.json()["selling_amount"] == 600.0


@pytest.mark.asyncio
async def test_delete_retail(auth_client: AsyncClient):
    """Test deleting a retail sale."""
    create_resp = await auth_client.post("/api/retail", json={
        "transaction_date": str(date.today()),
        "selling_amount": "200.00",
        "estimated_profit": "20.00",
    })
    sale_id = create_resp.json()["id"]

    resp = await auth_client.delete(f"/api/retail/{sale_id}")
    assert resp.status_code == 204
