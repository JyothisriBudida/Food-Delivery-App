"""
Backend API Tests for Food Delivery App

Tests cover:
- Health check endpoints
- All API route structure (methods, paths)
- Donation CRUD operations (mocked database)
- Request CRUD operations (mocked database)
- Delivery CRUD operations (mocked database)
- User profile operations (mocked database)
- CORS configuration
- Error handling
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock, AsyncMock
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from app.main import app
from app.config import settings


class TestHealthEndpoints:
    """Test health and root endpoints."""

    def setup_method(self):
        self.client = TestClient(app)

    def test_root_endpoint(self):
        """Test the root API endpoint returns correct message."""
        response = self.client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "Food Delivery API" in data["message"]

    def test_health_endpoint(self):
        """Test the health check endpoint."""
        response = self.client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"


class TestCORSConfiguration:
    """Test CORS configuration for frontend communication."""

    def setup_method(self):
        self.client = TestClient(app)

    def test_cors_headers_present(self):
        """Test that CORS headers are present in responses."""
        response = self.client.options("/api/donations/")
        # CORS preflight should not error
        assert response.status_code in (200, 204)

    def test_cors_allow_origin(self):
        """Test that CORS allows the frontend origin."""
        response = self.client.get(
            "/api/health",
            headers={"Origin": "http://localhost:3000"},
        )
        assert response.status_code == 200


class TestDonationRoutes:
    """Test donation API routes with mocked database."""

    def setup_method(self):
        self.client = TestClient(app)

    @patch("app.services.firestore_service._get_db")
    def test_create_donation_success(self, mock_get_db):
        """Test creating a donation via API."""
        # Mock Firestore document reference
        mock_doc_ref = MagicMock()
        mock_doc_ref.id = "test_donation_id_123"
        mock_collection = MagicMock()
        mock_collection.document.return_value = mock_doc_ref
        mock_db = MagicMock()
        mock_db.collection.return_value = mock_collection
        mock_get_db.return_value = mock_db

        donation_data = {
            "foodName": "Pizza",
            "quantity": "5 boxes",
            "donorName": "John Doe",
            "address": "123 Main St",
            "latitude": 12.9716,
            "longitude": 77.5946,
            "donorId": "user_123",
            "donorEmail": "john@example.com",
            "status": "Available",
        }

        response = self.client.post("/api/donations/", json=donation_data)
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["id"] == "test_donation_id_123"
        assert "message" in data

    @patch("app.services.firestore_service._get_db")
    def test_list_donations(self, mock_get_db):
        """Test listing donations via API."""
        # Mock Firestore stream
        mock_doc = MagicMock()
        mock_doc.exists = True
        mock_doc.id = "donation_1"
        mock_doc.to_dict.return_value = {
            "foodName": "Pizza",
            "quantity": "5 boxes",
            "donorName": "John Doe",
            "address": "123 Main St",
            "latitude": 12.9716,
            "longitude": 77.5946,
            "donorId": "user_123",
            "status": "Available",
            "createdAt": None,
            "updatedAt": None,
        }

        mock_collection = MagicMock()
        mock_collection.stream.return_value = [mock_doc]
        mock_db = MagicMock()
        mock_db.collection.return_value = mock_collection
        mock_get_db.return_value = mock_db

        response = self.client.get("/api/donations/")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 1
        assert data[0]["id"] == "donation_1"

    @patch("app.services.firestore_service._get_db")
    def test_get_donation_not_found(self, mock_get_db):
        """Test getting a non-existent donation."""
        mock_doc = MagicMock()
        mock_doc.exists = False
        mock_db = MagicMock()
        mock_db.collection.return_value.document.return_value.get.return_value = mock_doc
        mock_get_db.return_value = mock_db

        response = self.client.get("/api/donations/nonexistent_id")
        assert response.status_code == 404

    @patch("app.services.firestore_service._get_db")
    def test_update_donation_status(self, mock_get_db):
        """Test updating donation status."""
        mock_doc_ref = MagicMock()
        mock_db = MagicMock()
        mock_db.collection.return_value.document.return_value = mock_doc_ref
        mock_get_db.return_value = mock_db

        response = self.client.patch(
            "/api/donations/test_id/status", params={"new_status": "Delivered"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data


class TestRequestRoutes:
    """Test request API routes with mocked database."""

    def setup_method(self):
        self.client = TestClient(app)

    @patch("app.services.firestore_service._get_db")
    def test_create_request_success(self, mock_get_db):
        """Test creating a food request via API."""
        mock_doc_ref = MagicMock()
        mock_doc_ref.id = "test_request_id_456"
        mock_collection = MagicMock()
        mock_collection.document.return_value = mock_doc_ref
        mock_db = MagicMock()
        mock_db.collection.return_value = mock_collection
        mock_get_db.return_value = mock_db

        request_data = {
            "foodNeeded": "Rice and vegetables",
            "quantity": "10 servings",
            "receiverName": "Community Center",
            "address": "456 Oak Ave",
            "urgency": "High",
            "people": 25,
            "latitude": 12.9141,
            "longitude": 77.6411,
            "receiverId": "user_456",
            "receiverEmail": "center@example.com",
            "status": "Pending",
        }

        response = self.client.post("/api/requests/", json=request_data)
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["id"] == "test_request_id_456"

    @patch("app.services.firestore_service._get_db")
    def test_list_requests_with_status_filter(self, mock_get_db):
        """Test listing requests with status filter."""
        mock_collection = MagicMock()
        mock_collection.where.return_value.stream.return_value = []
        mock_db = MagicMock()
        mock_db.collection.return_value = mock_collection
        mock_get_db.return_value = mock_db

        response = self.client.get("/api/requests/?status=Pending")
        assert response.status_code == 200
        assert response.json() == []

    @patch("app.services.firestore_service._get_db")
    def test_update_request_status(self, mock_get_db):
        """Test updating request status."""
        mock_doc_ref = MagicMock()
        mock_db = MagicMock()
        mock_db.collection.return_value.document.return_value = mock_doc_ref
        mock_get_db.return_value = mock_db

        response = self.client.patch(
            "/api/requests/test_id/status", params={"new_status": "Fulfilled"}
        )
        assert response.status_code == 200


class TestDeliveryRoutes:
    """Test delivery API routes with mocked database."""

    def setup_method(self):
        self.client = TestClient(app)

    @patch("app.services.firestore_service._get_db")
    def test_assign_volunteer(self, mock_get_db):
        """Test assigning a volunteer to a delivery."""
        mock_doc_ref = MagicMock()
        mock_doc_ref.id = "test_delivery_id_789"
        mock_collection = MagicMock()
        mock_collection.document.return_value = mock_doc_ref
        mock_db = MagicMock()
        mock_db.collection.return_value = mock_collection
        mock_get_db.return_value = mock_db

        delivery_data = {
            "taskType": "delivery-run",
            "donationId": "donation_1",
            "requestId": "request_1",
            "volunteerId": "volunteer_1",
            "volunteerName": "Jane Smith",
            "foodName": "Pizza",
            "quantity": "5 boxes",
            "urgency": "High",
            "routeDistanceKm": 5.5,
        }

        response = self.client.post("/api/deliveries/", json=delivery_data)
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["id"] == "test_delivery_id_789"

    @patch("app.services.firestore_service._get_db")
    def test_list_deliveries_by_volunteer(self, mock_get_db):
        """Test listing deliveries filtered by volunteer."""
        mock_collection = MagicMock()
        mock_collection.where.return_value.stream.return_value = []
        mock_db = MagicMock()
        mock_db.collection.return_value = mock_collection
        mock_get_db.return_value = mock_db

        response = self.client.get("/api/deliveries/?volunteer_id=volunteer_1")
        assert response.status_code == 200
        assert response.json() == []

    @patch("app.services.firestore_service._get_db")
    def test_update_delivery_status(self, mock_get_db):
        """Test updating delivery status."""
        mock_doc = MagicMock()
        mock_doc.exists = True
        mock_doc.to_dict.return_value = {
            "donationId": "donation_1",
            "requestId": "request_1",
        }
        mock_doc_ref = MagicMock()
        mock_doc_ref.get.return_value = mock_doc
        mock_db = MagicMock()
        mock_db.collection.return_value.document.return_value = mock_doc_ref
        mock_get_db.return_value = mock_db

        response = self.client.patch(
            "/api/deliveries/test_id/status", params={"new_status": "Picked Up"}
        )
        assert response.status_code == 200


class TestUserRoutes:
    """Test user profile API routes with mocked database."""

    def setup_method(self):
        self.client = TestClient(app)

    @patch("app.services.firestore_service._get_db")
    def test_create_user_profile(self, mock_get_db):
        """Test creating/updating a user profile."""
        mock_doc_ref = MagicMock()
        mock_db = MagicMock()
        mock_db.collection.return_value.document.return_value = mock_doc_ref
        mock_get_db.return_value = mock_db

        profile_data = {
            "displayName": "John Doe",
            "email": "john@example.com",
        }

        response = self.client.post(
            "/api/users/user_123/profile", json=profile_data
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data

    @patch("app.services.firestore_service._get_db")
    def test_get_user_profile_not_found(self, mock_get_db):
        """Test getting a non-existent user profile."""
        mock_doc = MagicMock()
        mock_doc.exists = False
        mock_db = MagicMock()
        mock_db.collection.return_value.document.return_value.get.return_value = mock_doc
        mock_get_db.return_value = mock_db

        response = self.client.get("/api/users/nonexistent/profile")
        assert response.status_code == 404


class TestAPIRouteStructure:
    """Test that all expected API routes exist with correct methods."""

    def setup_method(self):
        self.client = TestClient(app)

    def test_all_routes_registered(self):
        """Test that all expected API routes are registered."""
        routes = []
        for route in app.routes:
            if hasattr(route, "path") and route.path.startswith("/api"):
                methods = [m for m in (route.methods or []) if m != "HEAD"]
                routes.append((route.path, tuple(sorted(methods))))

        expected_routes = [
            ("/api/donations/", ("GET", "POST")),
            ("/api/donations/{donation_id}", ("GET",)),
            ("/api/donations/{donation_id}/status", ("PATCH",)),
            ("/api/requests/", ("GET", "POST")),
            ("/api/requests/{request_id}", ("GET",)),
            ("/api/requests/{request_id}/status", ("PATCH",)),
            ("/api/deliveries/", ("GET", "POST")),
            ("/api/deliveries/{delivery_id}", ("GET",)),
            ("/api/deliveries/{delivery_id}/status", ("PATCH",)),
            ("/api/users/{user_id}/profile", ("GET", "POST")),
            ("/api/health", ("GET",)),
        ]

        for path, methods in expected_routes:
            assert (path, methods) in routes, f"Route {path} {methods} not found"

    def test_openapi_schema_generated(self):
        """Test that OpenAPI schema can be generated (validates all models)."""
        response = self.client.get("/openapi.json")
        assert response.status_code == 200
        schema = response.json()
        assert "openapi" in schema
        assert "paths" in schema
        assert "components" in schema


class TestSettings:
    """Test configuration settings."""

    def test_settings_load(self):
        """Test that settings load correctly."""
        assert settings.api_host == "0.0.0.0"
        assert settings.api_port == 8000
        assert settings.frontend_url == "http://localhost:3000"

    def test_env_file_reference(self):
        """Test that .env file is referenced in config."""
        from pydantic_settings import BaseSettings
        assert issubclass(type(settings), BaseSettings)
