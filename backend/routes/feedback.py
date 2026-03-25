from fastapi import APIRouter, Depends, status

from dependencies.auth import get_current_admin, get_current_user
from schemas.feedback import FeedbackCreate, FeedbackResponse
from services.feedback import create_feedback, list_feedback

router = APIRouter(prefix="/feedback", tags=["feedback"])


@router.post("", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
def submit_feedback(payload: FeedbackCreate, current_user=Depends(get_current_user)):
    return create_feedback(current_user["id"], payload)


@router.get("", response_model=list[FeedbackResponse])
def get_feedback(_admin=Depends(get_current_admin)):
    return list_feedback()
