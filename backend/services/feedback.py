from contextlib import closing

from db import get_conn
from models.feedback import Feedback
from schemas.feedback import FeedbackCreate


def create_feedback(user_id: int, payload: FeedbackCreate) -> dict:
    with closing(get_conn()) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO feedback (user_id, message)
                VALUES (%s, %s)
                RETURNING id, user_id, message, created_at;
                """,
                (user_id, payload.message.strip()),
            )
            row = cur.fetchone()
        conn.commit()

    return Feedback.from_db_row(row).to_response()


def list_feedback() -> list[dict]:
    with closing(get_conn()) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, user_id, message, created_at
                FROM feedback
                ORDER BY created_at DESC;
                """
            )
            rows = cur.fetchall()

    return [Feedback.from_db_row(row).to_response() for row in rows]
