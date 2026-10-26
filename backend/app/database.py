"""Firebase Admin SDK initialization - backend only database access.

This module initializes the Firebase Admin SDK with a service account key.
Only the backend should have access to this. The frontend must never
initialize the Admin SDK or have access to the service account key.

Initialization is lazy: the Firebase Admin SDK is only initialized on first
database access, so the backend can start even without a service account key
(useful for development/testing before the key is configured).
"""

import firebase_admin
from firebase_admin import credentials, firestore
from app.config import settings

_db = None
_app = None


def _ensure_initialized():
    """Initialize Firebase Admin SDK on first use."""
    global _db, _app
    if _db is not None:
        return _db

    try:
        cred = credentials.Certificate(settings.firebase_service_account_key)
        _app = firebase_admin.initialize_app(cred)
        _db = firestore.client()
        return _db
    except FileNotFoundError:
        raise RuntimeError(
            "Firebase service account key not found. "
            "Please download serviceAccountKey.json from Firebase Console "
            "and place it in the backend/ directory."
        )
    except ValueError:
        # Already initialized
        _db = firestore.client()
        return _db


def get_db():
    """Get the Firestore client (initializes on first call)."""
    return _ensure_initialized()


# For backward compatibility - this will be None until first call
db = None

__all__ = ["get_db", "db"]
