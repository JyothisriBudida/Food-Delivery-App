"""Delivery routes - all database operations handled by backend service layer."""

from fastapi import APIRouter, HTTPException
from typing import List, Optional
from app.services import firestore_service
from app.models import DeliveryCreate

router = APIRouter()


@router.post("/", response_model=dict)
async def assign_volunteer(delivery: DeliveryCreate):
    """Assign a volunteer to a delivery route."""
    try:
        delivery_id = await firestore_service.assign_volunteer(delivery)
        return {"id": delivery_id, "message": "Volunteer assigned successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=List[dict])
async def list_deliveries(volunteer_id: Optional[str] = None):
    """Get deliveries, optionally filtered by volunteer ID."""
    try:
        return await firestore_service.get_deliveries(volunteer_id=volunteer_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{delivery_id}", response_model=dict)
async def get_delivery(delivery_id: str):
    """Get a delivery by ID."""
    delivery = await firestore_service.get_delivery(delivery_id)
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery not found")
    return delivery


@router.patch("/{delivery_id}/status", response_model=dict)
async def update_delivery_status(delivery_id: str, new_status: str):
    """Update delivery status."""
    try:
        success = await firestore_service.update_delivery_status(delivery_id, new_status)
        if not success:
            raise HTTPException(status_code=404, detail="Delivery not found")
        return {"message": f"Delivery status updated to {new_status}"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
