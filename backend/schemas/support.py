from pydantic import BaseModel, EmailStr, Field


class ContactSupportRequest(BaseModel):
    email: EmailStr
    subject: str = Field(min_length=3, max_length=200)
    message: str = Field(min_length=5, max_length=4000)


class ContactSupportResponse(BaseModel):
    queued: bool
    recipient: str
    detail: str
