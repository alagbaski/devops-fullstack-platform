"""
Product Routes

Public endpoints for browsing the catalog and Admin-only endpoints for CRUD operations.
"""

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from dependencies.auth import get_current_admin
from exceptions import (
    EntityAlreadyExistsException,
    EntityNotFoundException,
    ValidationException,
)
from schemas.products import ProductCreate, ProductResponse, ProductUpdate
from services.products import (
    create_product,
    delete_product,
    get_product,
    list_active_products,
    list_products_for_admin,
    update_product,
)
from services.uploads import save_product_image

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=list[ProductResponse])
def get_products():
    """Fetch all active products for the storefront."""
    return list_active_products()


@router.get("/admin", response_model=list[ProductResponse])
def get_admin_products(_admin=Depends(get_current_admin)):
    """Fetch the full catalog for the admin dashboard (includes inactive items)."""
    return list_products_for_admin()


@router.get("/{product_id}", response_model=ProductResponse)
def get_product_by_id(product_id: int):
    """Fetch details for a single product."""
    product = get_product(product_id)
    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Product not found"
        )

    return product


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def add_product(payload: ProductCreate, _admin=Depends(get_current_admin)):
    """Create a new product. Requires Admin privileges."""
    try:
        return create_product(payload)
    except (ValidationException, EntityAlreadyExistsException) as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
        ) from exc


@router.patch("/{product_id}", response_model=ProductResponse)
def patch_product(
    product_id: int, payload: ProductUpdate, _admin=Depends(get_current_admin)
):
    """Update existing product fields. Requires Admin privileges."""
    try:
        return update_product(product_id, payload)
    except EntityNotFoundException as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)
        ) from exc
    except ValidationException as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
        ) from exc


@router.post("/upload-image")
def upload_product_image(
    file: UploadFile = File(...), _admin=Depends(get_current_admin)
):
    """Process an image upload and return the resulting URL."""
    try:
        image_url = save_product_image(file)
        return {"image_url": image_url}
    except ValidationException as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
        ) from exc


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_product(product_id: int, _admin=Depends(get_current_admin)):
    """Permanently delete a product. Requires Admin privileges."""
    try:
        delete_product(product_id)
    except EntityNotFoundException as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)
        ) from exc
