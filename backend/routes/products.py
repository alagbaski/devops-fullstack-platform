from fastapi import APIRouter, Depends, HTTPException, status

from dependencies.auth import get_current_admin
from schemas.products import ProductCreate, ProductResponse, ProductUpdate
from services.products import create_product, list_active_products, list_products_for_admin, update_product

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=list[ProductResponse])
def get_products():
    return list_active_products()


@router.get("/admin", response_model=list[ProductResponse])
def get_admin_products(_admin=Depends(get_current_admin)):
    return list_products_for_admin()


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def add_product(payload: ProductCreate, _admin=Depends(get_current_admin)):
    try:
        return create_product(payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.patch("/{product_id}", response_model=ProductResponse)
def patch_product(product_id: int, payload: ProductUpdate, _admin=Depends(get_current_admin)):
    try:
        return update_product(product_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
