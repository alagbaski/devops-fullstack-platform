"""Tests for auth routes."""
import pytest
from fastapi import HTTPException

from exceptions import EntityAlreadyExistsException
from routes import auth as auth_routes

from .conftest import sample_user_response


def test_signup_success(monkeypatch: pytest.MonkeyPatch):
    user = sample_user_response()
    monkeypatch.setattr(auth_routes, "create_user", lambda email, username, password: user)

    data = auth_routes.signup(
        auth_routes.SignupRequest(
            email="test@example.com",
            username="testuser",
            password="testpass123",
        )
    )
    assert data["email"] == "test@example.com"
    assert data["username"] == "testuser"
    assert "id" in data
    assert "created_at" in data
    assert "updated_at" in data


def test_signup_duplicate_email(monkeypatch: pytest.MonkeyPatch):
    def _raise_duplicate(email: str, username: str, password: str):
        raise EntityAlreadyExistsException("Email is already registered")

    monkeypatch.setattr(auth_routes, "create_user", _raise_duplicate)

    with pytest.raises(HTTPException) as exc_info:
        auth_routes.signup(
            auth_routes.SignupRequest(
                email="test@example.com",
                username="testuser",
                password="testpass123",
            )
        )

    assert exc_info.value.status_code == 400
    assert "already registered" in exc_info.value.detail.lower()


def test_login_success(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(
        auth_routes,
        "authenticate_user",
        lambda identifier, password: {
            "email": "login@example.com",
            "username": identifier,
            "role": "customer",
        },
    )
    monkeypatch.setattr(
        auth_routes, "create_access_token", lambda payload: "header.payload.signature"
    )

    data = auth_routes.login(
        auth_routes.LoginRequest(identifier="loginuser", password="testpass123")
    )

    assert data.access_token == "header.payload.signature"
    assert data.token_type == "bearer"


def test_login_invalid(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(auth_routes, "authenticate_user", lambda identifier, password: None)

    with pytest.raises(HTTPException) as exc_info:
        auth_routes.login(auth_routes.LoginRequest(identifier="invaliduser", password="wrongpass"))

    assert exc_info.value.status_code == 401
    assert "invalid email/username or password" in exc_info.value.detail.lower()


def test_get_me_returns_current_user():
    user = sample_user_response()
    assert auth_routes.read_current_user(user) == user


def test_get_me_unauth():
    with pytest.raises(HTTPException) as exc_info:
        auth_routes.get_current_user(None)

    assert exc_info.value.status_code == 401
