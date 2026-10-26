"""Request routes - all database operations handled by backend service layer."""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.services import firestore_service
from app.models import RequestCreate

router = APIRouter()


@router.post("/", response_model=dict)
async def create_request(request: RequestCreate):
    """Create a new food request."""
    try:
        request_id = await firestore_service.create_request(request)
        return {"id": request_id, "message": "Request created successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=List[dict])
async def list_requests(status: Optional[str] = Query(None, description="Filter by status")):
    """Get all requests, optionally filtered by status."""
    try:
        return await firestore_service.get_requests(status_filter=status)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{request_id}", response_model=dict)
async def get_request(request_id: str):
    """Get a request by ID."""
    req = await firestore_service.get_request(request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    return req


@router.patch("/{request_id}/status", response_model=dict)
async def update_request_status(request_id: str, new_status: str):
    """Update request status."""
    try:
        await firestore_service.update_request_status(request_id, new_status)
        return {"message": f"Request status updated to {new_status}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
