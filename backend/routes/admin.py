from fastapi import APIRouter, Depends

from config import BACKEND_PORT, NGINX_PORT, RABBITMQ_UI_PORT
from dependencies.auth import get_current_admin
from services.products import get_product_counts

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/overview")
def admin_overview(_admin=Depends(get_current_admin)):
    counts = get_product_counts()
    return {
        "product_counts": counts,
        "system_links": [
            {"label": "Storefront", "url": f"http://localhost:{NGINX_PORT}"},
            {"label": "Backend health", "url": f"http://localhost:{BACKEND_PORT}/health"},
            {"label": "Backend metrics", "url": f"http://localhost:{BACKEND_PORT}/metrics"},
            {"label": "RabbitMQ UI", "url": f"http://localhost:{RABBITMQ_UI_PORT}"},
            {"label": "Prometheus", "url": "http://localhost:9090"},
            {"label": "Grafana", "url": "http://localhost:3001"},
        ],
    }
