from fastapi import APIRouter, Depends, HTTPException, status

from dependencies.auth import get_current_admin
from schemas.products import ProductCreate, ProductResponse
from services.products import create_product, list_active_products

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=list[ProductResponse])
def get_products():
    return list_active_products()


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def add_product(payload: ProductCreate, _admin=Depends(get_current_admin)):
    try:
        return create_product(payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
