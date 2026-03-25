from fastapi import APIRouter, Depends

from config import BACKEND_PORT, NGINX_PORT, RABBITMQ_UI_PORT
from dependencies.auth import get_current_admin
from services.products import get_product_counts

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/overview")
def admin_overview(_admin=Depends(get_current_admin)):
    counts = get_product_counts()
    return {
        "products": counts,
        "system_links": [
            {"label": "Storefront", "href": f"http://localhost:{NGINX_PORT}"},
            {"label": "Backend health", "href": f"http://localhost:{BACKEND_PORT}/health"},
            {"label": "Backend metrics", "href": f"http://localhost:{BACKEND_PORT}/metrics"},
            {"label": "RabbitMQ UI", "href": f"http://localhost:{RABBITMQ_UI_PORT}"},
            {"label": "Prometheus", "href": "http://localhost:9090"},
            {"label": "Grafana", "href": "http://localhost:3001"},
        ],
    }
