"""Firestore service layer - backend database operations.

All Firestore interactions happen here. The routers call these functions.
The frontend never accesses Firestore directly.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
from firebase_admin import firestore
from app.database import get_db as _get_db
from app.models import (
    DonationCreate, DonationResponse,
    RequestCreate, RequestResponse,
    DeliveryCreate, DeliveryResponse,
    UserProfileCreate, UserProfileResponse,
)

COLLECTIONS = {
    "donations": "donations",
    "requests": "requests",
    "deliveries": "deliveries",
    "users": "users",
}


def _doc_to_dict(doc, doc_id: str = None) -> dict:
    """Convert a Firestore document to a dict with id included."""
    data = doc.to_dict() or {}
    if doc_id:
        data["id"] = doc_id
    return data


def _serialize_timestamp(value: Any) -> Any:
    """Convert Firestore timestamp to ISO format string or None."""
    if value is None:
        return None
    if hasattr(value, "to_datetime"):
        return value.to_datetime().isoformat()
    if isinstance(value, datetime):
        return value.isoformat()
    return value


# ==================== DONATIONS ====================

async def create_donation(donation: DonationCreate) -> str:
    """Create a new donation document."""
    doc_ref = _get_db().collection(COLLECTIONS["donations"]).document()
    data = donation.dict()
    data["status"] = donation.status or "Available"
    data["createdAt"] = firestore.SERVER_TIMESTAMP
    data["updatedAt"] = firestore.SERVER_TIMESTAMP
    doc_ref.set(data)
    return doc_ref.id


async def get_donations(status_filter: Optional[str] = None) -> List[dict]:
    """Get all donations, optionally filtered by status."""
    collection_ref = _get_db().collection(COLLECTIONS["donations"])
    if status_filter:
        collection_ref = collection_ref.where("status", "==", status_filter)
    docs = collection_ref.stream()
    results = []
    for doc in docs:
        data = _doc_to_dict(doc, doc.id)
        data["createdAt"] = _serialize_timestamp(data.get("createdAt"))
        data["updatedAt"] = _serialize_timestamp(data.get("updatedAt"))
        results.append(data)
    return results


async def get_donation(donation_id: str) -> Optional[dict]:
    """Get a single donation by ID."""
    doc = _get_db().collection(COLLECTIONS["donations"]).document(donation_id).get()
    if not doc.exists:
        return None
    data = _doc_to_dict(doc, doc.id)
    data["createdAt"] = _serialize_timestamp(data.get("createdAt"))
    data["updatedAt"] = _serialize_timestamp(data.get("updatedAt"))
    return data


async def update_donation_status(donation_id: str, new_status: str) -> bool:
    """Update donation status."""
    doc_ref = _get_db().collection(COLLECTIONS["donations"]).document(donation_id)
    doc_ref.update({
        "status": new_status,
        "updatedAt": firestore.SERVER_TIMESTAMP,
    })
    return True


# ==================== REQUESTS ====================

async def create_request(request: RequestCreate) -> str:
    """Create a new food request document."""
    doc_ref = _get_db().collection(COLLECTIONS["requests"]).document()
    data = request.dict()
    data["status"] = request.status or "Pending"
    data["createdAt"] = firestore.SERVER_TIMESTAMP
    data["updatedAt"] = firestore.SERVER_TIMESTAMP
    doc_ref.set(data)
    return doc_ref.id


async def get_requests(status_filter: Optional[str] = None) -> List[dict]:
    """Get all requests, optionally filtered by status."""
    collection_ref = _get_db().collection(COLLECTIONS["requests"])
    if status_filter:
        collection_ref = collection_ref.where("status", "==", status_filter)
    docs = collection_ref.stream()
    results = []
    for doc in docs:
        data = _doc_to_dict(doc, doc.id)
        data["createdAt"] = _serialize_timestamp(data.get("createdAt"))
        data["updatedAt"] = _serialize_timestamp(data.get("updatedAt"))
        results.append(data)
    return results


async def get_request(request_id: str) -> Optional[dict]:
    """Get a single request by ID."""
    doc = _get_db().collection(COLLECTIONS["requests"]).document(request_id).get()
    if not doc.exists:
        return None
    data = _doc_to_dict(doc, doc.id)
    data["createdAt"] = _serialize_timestamp(data.get("createdAt"))
    data["updatedAt"] = _serialize_timestamp(data.get("updatedAt"))
    return data


async def update_request_status(request_id: str, new_status: str) -> bool:
    """Update request status."""
    doc_ref = _get_db().collection(COLLECTIONS["requests"]).document(request_id)
    doc_ref.update({
        "status": new_status,
        "updatedAt": firestore.SERVER_TIMESTAMP,
    })
    return True


# ==================== DELIVERIES ====================

async def assign_volunteer(delivery: DeliveryCreate) -> str:
    """Create a delivery and assign a volunteer."""
    doc_ref = _get_db().collection(COLLECTIONS["deliveries"]).document()
    data = delivery.dict()
    data["status"] = "Assigned"
    data["assignedAt"] = firestore.SERVER_TIMESTAMP
    data["createdAt"] = firestore.SERVER_TIMESTAMP
    data["updatedAt"] = firestore.SERVER_TIMESTAMP
    doc_ref.set(data)

    # Update donation and request status
    if delivery.donationId:
        await update_donation_status(delivery.donationId, "In Transit")
    if delivery.requestId:
        await update_request_status(delivery.requestId, "In Transit")

    return doc_ref.id


async def get_deliveries(volunteer_id: Optional[str] = None) -> List[dict]:
    """Get deliveries, optionally filtered by volunteer ID."""
    collection_ref = _get_db().collection(COLLECTIONS["deliveries"])
    if volunteer_id:
        collection_ref = collection_ref.where("volunteerId", "==", volunteer_id)
    docs = collection_ref.stream()
    results = []
    for doc in docs:
        data = _doc_to_dict(doc, doc.id)
        for ts_field in ["createdAt", "updatedAt", "assignedAt", "pickedUpAt", "deliveredAt"]:
            data[ts_field] = _serialize_timestamp(data.get(ts_field))
        results.append(data)
    return results


async def get_delivery(delivery_id: str) -> Optional[dict]:
    """Get a single delivery by ID."""
    doc = _get_db().collection(COLLECTIONS["deliveries"]).document(delivery_id).get()
    if not doc.exists:
        return None
    data = _doc_to_dict(doc, doc.id)
    for ts_field in ["createdAt", "updatedAt", "assignedAt", "pickedUpAt", "deliveredAt"]:
        data[ts_field] = _serialize_timestamp(data.get(ts_field))
    return data


async def update_delivery_status(delivery_id: str, new_status: str) -> bool:
    """Update delivery status and linked donation/request statuses."""
    doc_ref = _get_db().collection(COLLECTIONS["deliveries"]).document(delivery_id)
    doc = doc_ref.get()
    if not doc.exists:
        return False

    delivery_data = doc.to_dict() or {}
    update_data = {
        "status": new_status,
        "updatedAt": firestore.SERVER_TIMESTAMP,
    }

    if new_status == "Picked Up":
        update_data["pickedUpAt"] = firestore.SERVER_TIMESTAMP
    elif new_status == "Delivered":
        update_data["deliveredAt"] = firestore.SERVER_TIMESTAMP

    doc_ref.update(update_data)

    # Update linked donation and request
    linked_updates = []
    if new_status == "Picked Up" and delivery_data.get("donationId"):
        linked_updates.append(update_donation_status(delivery_data["donationId"], "Picked Up"))

    if new_status == "Delivered":
        if delivery_data.get("donationId"):
            linked_updates.append(update_donation_status(delivery_data["donationId"], "Delivered"))
        if delivery_data.get("requestId"):
            linked_updates.append(update_request_status(delivery_data["requestId"], "Fulfilled"))

    for coro in linked_updates:
        await coro

    return True


# ==================== USERS ====================

async def create_or_update_user_profile(user_id: str, user_data: UserProfileCreate) -> str:
    """Create or update a user profile document."""
    doc_ref = _get_db().collection(COLLECTIONS["users"]).document(user_id)
    data = user_data.dict(exclude_unset=True)
    data["updatedAt"] = firestore.SERVER_TIMESTAMP
    doc_ref.set(data, merge=True)
    return user_id


async def get_user_profile(user_id: str) -> Optional[dict]:
    """Get a user profile by ID."""
    doc = _get_db().collection(COLLECTIONS["users"]).document(user_id).get()
    if not doc.exists:
        return None
    data = _doc_to_dict(doc, doc.id)
    data["updatedAt"] = _serialize_timestamp(data.get("updatedAt"))
    return data



