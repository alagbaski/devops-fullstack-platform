from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from prometheus_fastapi_instrumentator import Instrumentator

from config import MEDIA_ROOT, MEDIA_URL
from db import initialize_database
from routes.api_v1 import router as api_v1_router
from routes.items import router as items_router
from routes.system import router as system_router

app = FastAPI()
Instrumentator().instrument(app).expose(app)

MEDIA_ROOT.mkdir(parents=True, exist_ok=True)
app.mount(MEDIA_URL, StaticFiles(directory=MEDIA_ROOT), name="media")

app.include_router(system_router)
app.include_router(items_router)
app.include_router(api_v1_router, prefix="/api/v1")


@app.on_event("startup")
def startup() -> None:
    MEDIA_ROOT.mkdir(parents=True, exist_ok=True)
    initialize_database()
