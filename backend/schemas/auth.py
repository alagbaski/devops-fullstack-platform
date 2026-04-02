from datetime import datetime

from pydantic import BaseModel, Field, model_validator


class SignupRequest(BaseModel):
    email: str
    username: str = Field(min_length=3, max_length=64)
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    identifier: str | None = Field(default=None, min_length=3, max_length=255)
    email: str | None = None
    password: str = Field(min_length=8, max_length=128)

    @model_validator(mode="after")
    def resolve_identifier(self) -> "LoginRequest":
        identifier = (self.identifier or self.email or "").strip()
        if not identifier:
            raise ValueError("Email or username is required")

        self.identifier = identifier
        return self


class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    created_at: datetime
    updated_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
