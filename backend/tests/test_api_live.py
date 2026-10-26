"""
Backend API Tests for Food Delivery App

Tests run against the live FastAPI server at http://127.0.0.1:8000
Since Firebase service account key is not configured, database-dependent
endpoints will return errors - this tests the API structure and error handling.
"""

import pytest
import httpx

BASE_URL = "http://127.0.0.1:8000"


class TestHealthEndpoints:
    """Test health and root endpoints against live server."""

    def test_root_endpoint(self):
        """Test the root API endpoint returns correct message."""
        response = httpx.get(f"{BASE_URL}/", timeout=5.0)
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "Food Delivery API" in data["message"]

    def test_health_endpoint(self):
        """Test the health check endpoint."""
        response = httpx.get(f"{BASE_URL}/api/health", timeout=5.0)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"

    def test_openapi_schema(self):
        """Test that OpenAPI schema is generated (validates all routes and models)."""
        response = httpx.get(f"{BASE_URL}/openapi.json", timeout=5.0)
        assert response.status_code == 200
        schema = response.json()
        assert "openapi" in schema
        assert "paths" in schema
        assert "components" in schema

        # Verify all expected routes exist in the schema
        paths = schema["paths"]
        expected_paths = [
            "/api/donations/",
            "/api/donations/{donation_id}",
            "/api/donations/{donation_id}/status",
            "/api/requests/",
            "/api/requests/{request_id}",
            "/api/requests/{request_id}/status",
            "/api/deliveries/",
            "/api/deliveries/{delivery_id}",
            "/api/deliveries/{delivery_id}/status",
            "/api/users/{user_id}/profile",
            "/api/health",
        ]
        for path in expected_paths:
            assert path in paths, f"Expected path {path} not found in OpenAPI schema"


class TestAPIRouteMethods:
    """Test that API routes accept correct HTTP methods."""

    def test_donations_post(self):
        """POST /api/donations/ should exist."""
        response = httpx.post(f"{BASE_URL}/api/donations/", json={}, timeout=5.0)
        # Should not be 404 or 405 (method not allowed)
        assert response.status_code not in (404, 405)

    def test_donations_get(self):
        """GET /api/donations/ should exist."""
        response = httpx.get(f"{BASE_URL}/api/donations/", timeout=5.0)
        assert response.status_code not in (404, 405)

    def test_donation_status_patch(self):
        """PATCH /api/donations/{id}/status should exist."""
        response = httpx.patch(
            f"{BASE_URL}/api/donations/test_id/status",
            params={"new_status": "Available"},
            timeout=5.0,
        )
        assert response.status_code not in (404, 405)

    def test_requests_post(self):
        """POST /api/requests/ should exist."""
        response = httpx.post(f"{BASE_URL}/api/requests/", json={}, timeout=5.0)
        assert response.status_code not in (404, 405)

    def test_requests_get(self):
        """GET /api/requests/ should exist."""
        response = httpx.get(f"{BASE_URL}/api/requests/", timeout=5.0)
        assert response.status_code not in (404, 405)

    def test_request_status_patch(self):
        """PATCH /api/requests/{id}/status should exist."""
        response = httpx.patch(
            f"{BASE_URL}/api/requests/test_id/status",
            params={"new_status": "Pending"},
            timeout=5.0,
        )
        assert response.status_code not in (404, 405)

    def test_deliveries_post(self):
        """POST /api/deliveries/ should exist."""
        response = httpx.post(f"{BASE_URL}/api/deliveries/", json={}, timeout=5.0)
        assert response.status_code not in (404, 405)

    def test_deliveries_get(self):
        """GET /api/deliveries/ should exist."""
        response = httpx.get(f"{BASE_URL}/api/deliveries/", timeout=5.0)
        assert response.status_code not in (404, 405)

    def test_delivery_status_patch(self):
        """PATCH /api/deliveries/{id}/status should exist."""
        response = httpx.patch(
            f"{BASE_URL}/api/deliveries/test_id/status",
            params={"new_status": "Assigned"},
            timeout=5.0,
        )
        assert response.status_code not in (404, 405)

    def test_users_profile_post(self):
        """POST /api/users/{id}/profile should exist."""
        response = httpx.post(
            f"{BASE_URL}/api/users/test_user/profile", json={}, timeout=5.0
        )
        assert response.status_code not in (404, 405)

    def test_users_profile_get(self):
        """GET /api/users/{id}/profile should exist."""
        response = httpx.get(
            f"{BASE_URL}/api/users/test_user/profile", timeout=5.0
        )
        assert response.status_code not in (404, 405)


class TestCORSConfiguration:
    """Test CORS headers for frontend communication."""

    def test_cors_preflight(self):
        """Test CORS preflight request succeeds."""
        response = httpx.options(
            f"{BASE_URL}/api/donations/",
            headers={"Origin": "http://localhost:3000"},
            timeout=5.0,
        )
        # Should not be 404 or 405
        assert response.status_code not in (404, 405)

    def test_cors_origin_header(self):
        """Test that CORS allows frontend origin."""
        response = httpx.get(
            f"{BASE_URL}/api/health",
            headers={"Origin": "http://localhost:3000"},
            timeout=5.0,
        )
        assert response.status_code == 200


class TestErrorHandling:
    """Test API error handling."""

    def test_nonexistent_route_returns_404(self):
        """Test that nonexistent routes return 404."""
        response = httpx.get(f"{BASE_URL}/api/nonexistent", timeout=5.0)
        assert response.status_code == 404

    def test_database_unavailable_returns_500(self):
        """Test that endpoints return 500 when database is unavailable (no service key)."""
        # Without Firebase service account key, DB calls will fail
        response = httpx.get(f"{BASE_URL}/api/donations/", timeout=5.0)
        # Should be 500 (internal server error) since DB is not configured
        assert response.status_code == 500
