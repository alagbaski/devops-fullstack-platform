from pydantic import BaseModel

from schemas.auth import LoginRequest, SignupRequest, TokenResponse, UserResponse
from schemas.products import ProductCreate, ProductResponse


class Item(BaseModel):
    name: str


__all__ = [
    "Item",
    "LoginRequest",
    "ProductCreate",
    "ProductResponse",
    "SignupRequest",
    "TokenResponse",
    "UserResponse",
]
