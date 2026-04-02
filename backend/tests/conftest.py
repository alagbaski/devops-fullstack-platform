"""Shared test helpers for backend tests."""

from datetime import datetime, timezone


def sample_user_response(email: str = "test@example.com", username: str = "testuser") -> dict:
    now = datetime.now(timezone.utc)
    return {
        "id": 1,
        "email": email,
        "username": username,
        "created_at": now,
        "updated_at": now,
    }


def sample_product_response() -> dict:
    now = datetime.now(timezone.utc)
    return {
        "id": 1,
        "name": "Test Product",
        "slug": "test-product",
        "description": "Test desc",
        "price": "19.99",
        "currency": "USD",
        "inventory_count": 10,
        "image_url": "https://example.com/img.jpg",
        "is_active": True,
        "created_at": now,
        "updated_at": now,
    }
