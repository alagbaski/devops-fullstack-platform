"""
Authentication Routes

This module handles user identity operations: signing up new accounts,
exchanging credentials for JWT tokens (login), and retrieving the
currently authenticated user's profile.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, status

from dependencies.auth import get_current_user
from exceptions import EntityAlreadyExistsException, ValidationException
from schemas.auth import LoginRequest, SignupRequest, TokenResponse, UserResponse
from security.jwt import create_access_token
from services.background_jobs import queue_signup_jobs
from services.users import authenticate_user, create_user

# Define the router with a prefix so all endpoints start with /auth
router = APIRouter(prefix="/auth", tags=["auth"])
logger = logging.getLogger(__name__)


@router.post(
    "/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED
)
def signup(payload: SignupRequest):
    """
    Register a new user.
    If the email or username already exists, the service layer raises a ValueError,
    which we catch and convert into a 400 Bad Request for the client.
    """
    try:
        user = create_user(payload.email, payload.username, payload.password)
        try:
            queue_signup_jobs(user)
        except Exception:
            logger.exception(
                "Failed to enqueue signup background jobs for user_id=%s", user["id"]
            )
        return user
    except (ValidationException, EntityAlreadyExistsException) as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
        ) from exc


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest):
    user = authenticate_user(payload.identifier, payload.password)
    # Suggestion: Log login attempts (excluding passwords) for security auditing
    # logger.info(f"Login attempt for: {payload.identifier}")

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email/username or password",
        )

    # Create a JWT containing non-sensitive user metadata
    token = create_access_token(
        {"sub": user["username"], "email": user["email"], "role": user["role"]}
    )
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserResponse)
def read_current_user(current_user=Depends(get_current_user)):
    """
    Retrieve the profile of the user associated with the provided JWT.
    The 'get_current_user' dependency handles token validation and
    database lookup automatically.
    """
    return current_user
