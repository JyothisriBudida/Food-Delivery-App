"""User routes - profile management via backend."""

from fastapi import APIRouter, HTTPException
from app.services import firestore_service
from app.models import UserProfileCreate

router = APIRouter()


@router.post("/{user_id}/profile", response_model=dict)
async def create_or_update_user_profile(user_id: str, profile: UserProfileCreate):
    """Create or update a user profile."""
    try:
        await firestore_service.create_or_update_user_profile(user_id, profile)
        return {"message": "User profile updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{user_id}/profile", response_model=dict)
async def get_user_profile(user_id: str):
    """Get a user profile by ID."""
    profile = await firestore_service.get_user_profile(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found")
    return profile
