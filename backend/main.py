from fastapi import FastAPI
from prometheus_fastapi_instrumentator import Instrumentator

from db import initialize_database
from routes.api_v1 import router as api_v1_router
from routes.items import router as items_router
from routes.system import router as system_router

app = FastAPI()
Instrumentator().instrument(app).expose(app)

app.include_router(system_router)
app.include_router(items_router)
app.include_router(api_v1_router, prefix="/api/v1")


@app.on_event("startup")
def startup() -> None:
    initialize_database()
