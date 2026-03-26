from fastapi import APIRouter

from routes.admin import router as admin_router
from routes.auth import router as auth_router
from routes.feedback import router as feedback_router
from routes.products import router as products_router

router = APIRouter()
router.include_router(admin_router)
router.include_router(auth_router)
router.include_router(feedback_router)
router.include_router(products_router)


@router.get("")
def api_v1_root():
    return {"message": "API v1 ready"}
