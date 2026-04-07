"""Tests for products routes."""

from io import BytesIO

import pytest
from fastapi import HTTPException
from starlette.datastructures import UploadFile

from routes import products as product_routes

from .conftest import sample_product_response


def test_list_active_products(monkeypatch: pytest.MonkeyPatch):
    product = sample_product_response()
    monkeypatch.setattr(product_routes, "list_active_products", lambda: [product])
    data = product_routes.get_products()
    assert isinstance(data, list)
    assert data[0]["is_active"] is True


def test_admin_products_returns_data(monkeypatch: pytest.MonkeyPatch):
    product = sample_product_response()
    monkeypatch.setattr(product_routes, "list_products_for_admin", lambda: [product])
    data = product_routes.get_admin_products(
        {"email": "admin@example.com", "role": "admin"}
    )
    assert data[0]["slug"] == product["slug"]


def test_get_product_not_found(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(product_routes, "get_product", lambda product_id: None)

    with pytest.raises(HTTPException) as exc_info:
        product_routes.get_product_by_id(999)

    assert exc_info.value.status_code == 404


def test_upload_product_image(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(
        product_routes,
        "save_product_image",
        lambda upload: "/media/products/example.png",
    )

    upload = UploadFile(filename="example.png", file=BytesIO(b"pngdata"))
    upload.headers = {"content-type": "image/png"}

    data = product_routes.upload_product_image(
        upload, {"email": "admin@example.com", "role": "admin"}
    )
    assert data["image_url"] == "/media/products/example.png"
