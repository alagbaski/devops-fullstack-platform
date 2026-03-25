from dataclasses import dataclass
from datetime import datetime


@dataclass
class Feedback:
    id: int
    user_id: int
    message: str
    created_at: datetime

    @classmethod
    def from_db_row(cls, row: tuple) -> "Feedback":
        return cls(
            id=row[0],
            user_id=row[1],
            message=row[2],
            created_at=row[3],
        )

    def to_response(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "message": self.message,
            "created_at": self.created_at,
        }
