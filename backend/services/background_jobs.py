"""Helpers for publishing best-effort background jobs."""

import logging

from celery import Celery

from config import RABBITMQ_URL

logger = logging.getLogger(__name__)

celery_app = Celery("backend_jobs", broker=RABBITMQ_URL, backend="rpc://")


def publish_task_safe(task_name: str, **kwargs) -> bool:
    """Attempt to queue a task without breaking the request path on failure."""
    try:
        celery_app.send_task(task_name, kwargs=kwargs)
        return True
    except Exception:
        logger.exception("Failed to enqueue background task '%s'", task_name)
        return False


def queue_signup_jobs(user: dict) -> None:
    """Publish best-effort signup side effects."""
    publish_task_safe(
        "tasks.send_welcome_email",
        to_email=user["email"],
        username=user["username"],
    )
    publish_task_safe(
        "tasks.log_signup_analytics",
        user_id=user["id"],
        email=user["email"],
        username=user["username"],
        role=user.get("role", "customer"),
    )
