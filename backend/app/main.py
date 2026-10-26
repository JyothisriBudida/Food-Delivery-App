"""FastAPI Backend for Food Delivery App.

This backend is the ONLY service that interacts with the database (Firestore).
The frontend communicates with this backend via REST API and only uses
Firebase for client-side authentication.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import donations, requests, deliveries, users
from app.config import settings

app = FastAPI(
    title="Food Delivery API",
    description="Backend API for Food Delivery App - handles all database operations",
    version="1.0.0",
)

# CORS middleware - allows frontend to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(donations.router, prefix="/api/donations", tags=["donations"])
app.include_router(requests.router, prefix="/api/requests", tags=["requests"])
app.include_router(deliveries.router, prefix="/api/deliveries", tags=["deliveries"])
app.include_router(users.router, prefix="/api/users", tags=["users"])


@app.get("/")
async def root():
    return {"message": "Food Delivery API is running"}


@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}
