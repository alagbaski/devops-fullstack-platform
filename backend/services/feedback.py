from contextlib import closing

from db import get_conn
from models.feedback import Feedback
from schemas.feedback import FeedbackCreate
from services.background_jobs import queue_feedback_notification
from exceptions import EntityNotFoundException


def create_feedback(user: dict, payload: FeedbackCreate) -> dict:
    with closing(get_conn()) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO feedback (user_id, message)
                VALUES (%s, %s)
                RETURNING id, user_id, message, created_at;
                """,
                (user["id"], payload.message.strip()),
            )
            row = cur.fetchone()
        conn.commit()

    feedback = Feedback.from_db_row(row).to_response()
    queue_feedback_notification(user, feedback)
    return feedback


def list_feedback() -> list[dict]:
    with closing(get_conn()) as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, user_id, message, created_at
                FROM feedback
                ORDER BY created_at DESC;
                """)
            rows = cur.fetchall()

    return [Feedback.from_db_row(row).to_response() for row in rows]

def delete_feedback(feedback_id: int) -> None:
    with closing(get_conn()) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM feedback WHERE id = %s;", (feedback_id,))
            if cur.fetchone() is None:
                raise EntityNotFoundException("Feedback not found")

            cur.execute("DELETE FROM feedback WHERE id = %s;", (feedback_id,))
        conn.commit()
