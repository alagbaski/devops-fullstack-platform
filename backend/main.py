"""
Main Application Entrypoint

Constructs the FastAPI instance, configures telemetry (Prometheus),
mounts static media directories, and registers all API routes.
"""
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from prometheus_fastapi_instrumentator import Instrumentator

from config import MEDIA_ROOT, MEDIA_URL
from db import initialize_database
from routes.api_v1 import router as api_v1_router
from routes.items import router as items_router
from routes.system import router as system_router

app = FastAPI()

# Setup Prometheus metrics scraping
Instrumentator().instrument(app).expose(app)

# Setup local media storage for product images
MEDIA_ROOT.mkdir(parents=True, exist_ok=True)
app.mount(MEDIA_URL, StaticFiles(directory=MEDIA_ROOT), name="media")

# Register route modules
app.include_router(system_router)
app.include_router(items_router)
app.include_router(api_v1_router, prefix="/api/v1")


@app.on_event("startup")
def startup() -> None:
    """Actions performed when the server starts."""
    MEDIA_ROOT.mkdir(parents=True, exist_ok=True)
    initialize_database()
