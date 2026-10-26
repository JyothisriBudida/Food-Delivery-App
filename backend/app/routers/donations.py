"""Donation routes - all database operations handled by backend service layer."""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.services import firestore_service
from app.models import DonationCreate, DonationResponse

router = APIRouter()


@router.post("/", response_model=dict)
async def create_donation(donation: DonationCreate):
    """Create a new food donation."""
    try:
        donation_id = await firestore_service.create_donation(donation)
        return {"id": donation_id, "message": "Donation created successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=List[dict])
async def list_donations(status: Optional[str] = Query(None, description="Filter by status")):
    """Get all donations, optionally filtered by status."""
    try:
        return await firestore_service.get_donations(status_filter=status)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{donation_id}", response_model=dict)
async def get_donation(donation_id: str):
    """Get a donation by ID."""
    donation = await firestore_service.get_donation(donation_id)
    if not donation:
        raise HTTPException(status_code=404, detail="Donation not found")
    return donation


@router.patch("/{donation_id}/status", response_model=dict)
async def update_donation_status(donation_id: str, new_status: str):
    """Update donation status."""
    try:
        await firestore_service.update_donation_status(donation_id, new_status)
        return {"message": f"Donation status updated to {new_status}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
