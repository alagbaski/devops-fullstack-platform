"""Tests for feedback routes and service behavior."""

from datetime import datetime, timezone

from routes import feedback as feedback_routes
from services import feedback as feedback_service


def test_submit_feedback_uses_current_user(monkeypatch):
    current_user = {
        "id": 7,
        "email": "shopper@example.com",
        "username": "shopper",
        "role": "customer",
    }
    payload = feedback_routes.FeedbackCreate(message="Need help with checkout")
    captured = {}

    def _create_feedback(user, feedback_payload):
        captured["user"] = user
        captured["payload"] = feedback_payload
        return {
            "id": 1,
            "user_id": user["id"],
            "message": feedback_payload.message,
            "created_at": datetime.now(timezone.utc),
        }

    monkeypatch.setattr(feedback_routes, "create_feedback", _create_feedback)

    response = feedback_routes.submit_feedback(payload, current_user)

    assert captured["user"] == current_user
    assert captured["payload"] == payload
    assert response["user_id"] == current_user["id"]


def test_create_feedback_persists_and_queues_notification(monkeypatch):
    current_user = {
        "id": 3,
        "email": "shopper@example.com",
        "username": "shopper",
        "role": "customer",
    }
    payload = feedback_service.FeedbackCreate(message="Please add more payment options")
    queued = {}
    committed = {"value": False}
    db_row = (11, current_user["id"], payload.message, datetime.now(timezone.utc))

    class FakeCursor:
        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            return False

        def execute(self, query, params):
            assert "INSERT INTO feedback" in query
            assert params == (current_user["id"], payload.message)

        def fetchone(self):
            return db_row

    class FakeConnection:
        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            return False

        def cursor(self):
            return FakeCursor()

        def commit(self):
            committed["value"] = True

        def close(self):
            return None

    monkeypatch.setattr(feedback_service, "get_conn", lambda: FakeConnection())
    monkeypatch.setattr(
        feedback_service,
        "queue_feedback_notification",
        lambda user, feedback: queued.update({"user": user, "feedback": feedback}),
    )

    response = feedback_service.create_feedback(current_user, payload)

    assert committed["value"] is True
    assert response["id"] == db_row[0]
    assert response["user_id"] == current_user["id"]
    assert queued["user"] == current_user
    assert queued["feedback"]["id"] == db_row[0]
    assert "payment options" in queued["feedback"]["message"]
