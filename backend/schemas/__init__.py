from pydantic import BaseModel

from schemas.auth import LoginRequest, SignupRequest, TokenResponse, UserResponse
from schemas.products import ProductCreate, ProductResponse, ProductUpdate


class Item(BaseModel):
    name: str


__all__ = [
    "Item",
    "LoginRequest",
    "ProductCreate",
    "ProductResponse",
    "ProductUpdate",
    "SignupRequest",
    "TokenResponse",
    "UserResponse",
]
