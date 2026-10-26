"""
Database module tests for Food Delivery App backend.

Tests the lazy initialization of Firebase Admin SDK and Firestore client.
"""

import pytest
import sys
import os
from unittest.mock import patch, MagicMock

sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from app.config import settings


class TestDatabaseInitialization:
    """Test Firebase Admin SDK initialization (backend only)."""

    def test_database_module_imports(self):
        """Test that database module can be imported."""
        from app import database
        assert hasattr(database, "get_db")
        assert hasattr(database, "db")

    def test_settings_have_firebase_key_path(self):
        """Test that settings has firebase_service_account_key configured."""
        assert hasattr(settings, "firebase_service_account_key")
        assert settings.firebase_service_account_key == "./serviceAccountKey.json"

    @patch("app.database.firebase_admin.initialize_app")
    @patch("app.database.credentials.Certificate")
    def test_lazy_init_raises_without_key(self, mock_cert, mock_init):
        """Test that get_db raises RuntimeError when key file missing."""
        from app import database

        # Reset module state
        database._db = None
        database._app = None

        mock_cert.side_effect = FileNotFoundError("No such file")

        with pytest.raises(RuntimeError, match="service account key"):
            database.get_db()

    @patch("app.database.firestore")
    @patch("app.database.firebase_admin.initialize_app")
    @patch("app.database.credentials.Certificate")
    def test_get_db_returns_client(self, mock_cert, mock_init, mock_firestore):
        """Test that get_db returns a Firestore client when key exists."""
        from app import database

        # Reset module state
        database._db = None
        database._app = None

        mock_client = MagicMock()
        mock_firestore.client.return_value = mock_client

        result = database.get_db()
        assert result == mock_client
        mock_cert.assert_called_once_with("./serviceAccountKey.json")
        mock_init.assert_called_once()
        mock_firestore.client.assert_called_once()

    def test_backend_only_import(self):
        """Test that frontend-only firebase imports are NOT in backend database module."""
        import inspect
        from app import database
        source = inspect.getsource(database)
        # Backend should use firebase_admin, not firebase (client SDK)
        assert "firebase_admin" in source
        assert "from firebase import" not in source
        assert "initializeApp" not in source  # Client SDK function
        assert "getFirestore" not in source   # Client SDK function
