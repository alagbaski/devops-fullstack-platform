from datetime import datetime

from pydantic import BaseModel, Field


class FeedbackCreate(BaseModel):
    message: str = Field(min_length=1, max_length=2000)


class FeedbackResponse(BaseModel):
    id: int
    user_id: int
    message: str
    created_at: datetime
