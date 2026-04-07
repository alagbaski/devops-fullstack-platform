from celery import Celery
import os

celery = Celery(
    "worker",
    broker=os.getenv("RABBITMQ_URL", "amqp://guest:guest@rabbitmq:5672//"),
    backend="rpc://",
    include=["tasks"],
)

celery.conf.task_routes = {"tasks.*": {"queue": "default"}}
