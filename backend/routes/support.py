"""
Support Routes

Handles customer contact requests by offloading email sending to a background worker.
"""

from celery import Celery
from fastapi import APIRouter, status

from config import RABBITMQ_URL, SUPPORT_EMAIL
from schemas.support import ContactSupportRequest, ContactSupportResponse

router = APIRouter(prefix="/support", tags=["support"])

# Configure Celery to use RabbitMQ as the message broker.
# This allows the API to return a '202 Accepted' immediately while
# the worker handles the slow task of sending an actual email.
celery_app = Celery("backend_support", broker=RABBITMQ_URL, backend="rpc://")


@router.post(
    "/contact",
    response_model=ContactSupportResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
def contact_support(payload: ContactSupportRequest):
    """Queue a support email task."""
    celery_app.send_task(
        "tasks.send_email",
        kwargs={
            "to_email": SUPPORT_EMAIL,
            "reply_to": payload.email,
            "subject": payload.subject.strip(),
            "message": payload.message.strip(),
        },
    )

    return ContactSupportResponse(
        queued=True,
        recipient=SUPPORT_EMAIL,
        detail="Support email request queued.",
    )
