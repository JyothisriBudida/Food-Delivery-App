"""Pydantic models for request/response validation."""

from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime


# --- Donation Models ---
class DonationBase(BaseModel):
    foodName: str
    quantity: str
    donorName: str
    address: str
    latitude: float
    longitude: float
    donorId: str
    donorEmail: Optional[str] = None
    status: Optional[str] = "Available"


class DonationCreate(DonationBase):
    pass


class DonationResponse(DonationBase):
    id: str
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- Request Models ---
class RequestBase(BaseModel):
    foodNeeded: str
    quantity: str
    receiverName: str
    address: str
    urgency: str = "Medium"
    people: int
    latitude: float
    longitude: float
    receiverId: str
    receiverEmail: Optional[str] = None
    status: Optional[str] = "Pending"


class RequestCreate(RequestBase):
    pass


class RequestResponse(RequestBase):
    id: str
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- Delivery Models ---
class DeliveryBase(BaseModel):
    taskType: str = "delivery-run"
    donationId: str
    requestId: str
    volunteerId: str
    volunteerName: str
    donorName: Optional[str] = None
    donorEmail: Optional[str] = None
    receiverName: Optional[str] = None
    receiverEmail: Optional[str] = None
    foodName: Optional[str] = None
    foodNeeded: Optional[str] = None
    quantity: Optional[str] = None
    people: Optional[int] = None
    urgency: Optional[str] = None
    routeDistanceKm: Optional[float] = None
    pickupLocation: Optional[dict] = None
    deliveryLocation: Optional[dict] = None
    status: Optional[str] = "Assigned"


class DeliveryCreate(DeliveryBase):
    pass


class DeliveryResponse(DeliveryBase):
    id: str
    assignedAt: Optional[datetime] = None
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None
    pickedUpAt: Optional[datetime] = None
    deliveredAt: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- User Models ---
class UserProfileBase(BaseModel):
    displayName: Optional[str] = None
    email: Optional[str] = None


class UserProfileCreate(UserProfileBase):
    pass


class UserProfileResponse(UserProfileBase):
    id: str
    updatedAt: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- Generic Response ---
class MessageResponse(BaseModel):
    message: str
