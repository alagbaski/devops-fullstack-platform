from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ProductCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    slug: str = Field(min_length=2, max_length=160)
    description: str = Field(min_length=8, max_length=1200)
    price: Decimal = Field(ge=0)
    currency: str = Field(min_length=3, max_length=3, default="USD")
    inventory_count: int = Field(ge=0, default=0)
    image_url: str | None = Field(default=None, max_length=500)
    is_active: bool = True


class ProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str
    description: str
    price: Decimal
    currency: str
    inventory_count: int
    image_url: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime
