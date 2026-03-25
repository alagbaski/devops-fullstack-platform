from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal


@dataclass
class Product:
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

    @classmethod
    def from_db_row(cls, row: tuple) -> "Product":
        return cls(
            id=row[0],
            name=row[1],
            slug=row[2],
            description=row[3],
            price=row[4],
            currency=row[5],
            inventory_count=row[6],
            image_url=row[7],
            is_active=row[8],
            created_at=row[9],
            updated_at=row[10],
        )

    def to_response(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "slug": self.slug,
            "description": self.description,
            "price": self.price,
            "currency": self.currency,
            "inventory_count": self.inventory_count,
            "image_url": self.image_url,
            "is_active": self.is_active,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }
