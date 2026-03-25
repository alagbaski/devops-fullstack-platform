from dataclasses import dataclass
from datetime import datetime


@dataclass
class User:
    id: int
    email: str
    password_hash: str | None
    role: str
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_db_row(cls, row: tuple) -> "User":
        return cls(
            id=row[0],
            email=row[1],
            password_hash=row[2],
            role=row[3],
            created_at=row[4],
            updated_at=row[5],
        )

    @classmethod
    def from_public_row(cls, row: tuple) -> "User":
        return cls(
            id=row[0],
            email=row[1],
            password_hash=None,
            role=row[2],
            created_at=row[3],
            updated_at=row[4],
        )

    def to_response(self) -> dict:
        return {
            "id": self.id,
            "email": self.email,
            "role": self.role,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }
