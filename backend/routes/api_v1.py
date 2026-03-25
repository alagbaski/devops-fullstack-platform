from fastapi import APIRouter

from routes.auth import router as auth_router
from routes.products import router as products_router

router = APIRouter()
router.include_router(auth_router)
router.include_router(products_router)


@router.get("")
def api_v1_root():
    return {"message": "API v1 ready"}
