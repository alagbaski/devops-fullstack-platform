from pydantic import BaseModel

from schemas.auth import LoginRequest, SignupRequest, TokenResponse, UserResponse
from schemas.feedback import FeedbackCreate, FeedbackResponse
from schemas.products import ProductCreate, ProductResponse, ProductUpdate


class Item(BaseModel):
    name: str


__all__ = [
    "FeedbackCreate",
    "FeedbackResponse",
    "Item",
    "LoginRequest",
    "ProductCreate",
    "ProductResponse",
    "ProductUpdate",
    "SignupRequest",
    "TokenResponse",
    "UserResponse",
]
