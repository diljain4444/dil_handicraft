"""Tests for wholesale sales endpoints."""

import pytest
from datetime import date
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_wholesale(auth_client: AsyncClient):
    """Test creating a wholesale sale."""
    payload = {
        "shop_name": "Test Shop",
        "transaction_date": str(date.today()),
        "selling_amount": "5000.00",
        "estimated_profit": "500.00",
        "notes": "Test note",
    }
    resp = await auth_client.post("/api/wholesale", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["shop_name"] == "Test Shop"
    assert data["selling_amount"] == 5000.0
    assert data["estimated_profit"] == 500.0
    assert "id" in data
    return data["id"]


@pytest.mark.asyncio
async def test_list_wholesale(auth_client: AsyncClient):
    """Test listing wholesale sales."""
    # Create a record first
    payload = {
        "shop_name": "List Shop",
        "transaction_date": str(date.today()),
        "selling_amount": "3000.00",
        "estimated_profit": "300.00",
    }
    await auth_client.post("/api/wholesale", json=payload)

    resp = await auth_client.get("/api/wholesale")
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data
    assert data["total"] >= 1


@pytest.mark.asyncio
async def test_get_wholesale_by_id(auth_client: AsyncClient):
    """Test fetching a wholesale sale by ID."""
    payload = {
        "shop_name": "Get Shop",
        "transaction_date": str(date.today()),
        "selling_amount": "2000.00",
        "estimated_profit": "200.00",
    }
    create_resp = await auth_client.post("/api/wholesale", json=payload)
    assert create_resp.status_code == 201
    sale_id = create_resp.json()["id"]

    resp = await auth_client.get(f"/api/wholesale/{sale_id}")
    assert resp.status_code == 200
    assert resp.json()["id"] == sale_id
    assert resp.json()["shop_name"] == "Get Shop"


@pytest.mark.asyncio
async def test_update_wholesale(auth_client: AsyncClient):
    """Test updating a wholesale sale."""
    payload = {
        "shop_name": "Update Shop",
        "transaction_date": str(date.today()),
        "selling_amount": "1000.00",
        "estimated_profit": "100.00",
    }
    create_resp = await auth_client.post("/api/wholesale", json=payload)
    sale_id = create_resp.json()["id"]

    update_payload = {"selling_amount": "1500.00", "notes": "Updated"}
    resp = await auth_client.put(f"/api/wholesale/{sale_id}", json=update_payload)
    assert resp.status_code == 200
    assert resp.json()["selling_amount"] == 1500.0
    assert resp.json()["notes"] == "Updated"


@pytest.mark.asyncio
async def test_delete_wholesale(auth_client: AsyncClient):
    """Test deleting a wholesale sale."""
    payload = {
        "shop_name": "Delete Shop",
        "transaction_date": str(date.today()),
        "selling_amount": "999.00",
        "estimated_profit": "99.00",
    }
    create_resp = await auth_client.post("/api/wholesale", json=payload)
    sale_id = create_resp.json()["id"]

    resp = await auth_client.delete(f"/api/wholesale/{sale_id}")
    assert resp.status_code == 204

    # Confirm it's gone
    get_resp = await auth_client.get(f"/api/wholesale/{sale_id}")
    assert get_resp.status_code == 404


@pytest.mark.asyncio
async def test_wholesale_requires_auth(client: AsyncClient):
    """Test that wholesale endpoints require authentication."""
    resp = await client.get("/api/wholesale")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_wholesale_autocomplete(client: AsyncClient):
    """Test shop autocomplete endpoint (no auth required)."""
    resp = await client.get("/api/wholesale/autocomplete/shops?q=")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.asyncio
async def test_create_wholesale_invalid_amount(auth_client: AsyncClient):
    """Test that negative selling amount is rejected."""
    payload = {
        "shop_name": "Bad Shop",
        "transaction_date": str(date.today()),
        "selling_amount": "-100.00",
        "estimated_profit": "0.00",
    }
    resp = await auth_client.post("/api/wholesale", json=payload)
    assert resp.status_code == 422
