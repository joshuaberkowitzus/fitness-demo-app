"""Firebase Admin SDK singleton wrapper."""

from functools import lru_cache
from typing import Any

import firebase_admin
from firebase_admin import auth, credentials, firestore
from google.cloud.firestore import Client as FirestoreClient

from app.config import get_settings


@lru_cache
def get_firebase_app() -> firebase_admin.App:
    """Initialize and return the Firebase Admin app singleton."""
    import os
    settings = get_settings()
    
    try:
        # Try to get existing app
        return firebase_admin.get_app()
    except ValueError:
        # Initialize new app
        service_account_path = settings.firebase_service_account_path
        
        # Only use service account file if explicitly set and file exists
        if service_account_path and os.path.exists(service_account_path):
            cred = credentials.Certificate(service_account_path)
        else:
            # Use application default credentials (for Cloud Run, GCE, etc.)
            cred = credentials.ApplicationDefault()
        
        return firebase_admin.initialize_app(cred, {
            'projectId': settings.firebase_project_id,
        })


def get_firestore_client() -> FirestoreClient:
    """Get the Firestore client."""
    get_firebase_app()  # Ensure Firebase is initialized
    return firestore.client()


# Alias for backward compatibility
def get_db() -> FirestoreClient:
    """Get the Firestore client (alias for get_firestore_client)."""
    return get_firestore_client()


def get_auth() -> Any:
    """Get the Firebase Auth module."""
    get_firebase_app()  # Ensure Firebase is initialized
    return auth


async def verify_firebase_token(id_token: str) -> dict:
    """
    Verify a Firebase ID token and return the decoded claims.
    
    Args:
        id_token: The Firebase ID token from the client
        
    Returns:
        Decoded token claims including 'uid', 'email', etc.
        
    Raises:
        ValueError: If the token is invalid or expired
    """
    try:
        get_firebase_app()  # Ensure Firebase is initialized
        decoded_token = auth.verify_id_token(id_token)
        return decoded_token
    except Exception as e:
        raise ValueError(f"Invalid Firebase token: {str(e)}")


def get_user_doc_ref(uid: str):
    """Get a reference to a user's document in Firestore."""
    db = get_firestore_client()
    return db.collection('users').document(uid)


# Alias for backward compatibility
def get_user_doc(uid: str):
    """Get a reference to a user's document (alias for get_user_doc_ref)."""
    return get_user_doc_ref(uid)


def get_user_subcollection(uid: str, subcollection: str):
    """Get a reference to a user's subcollection in Firestore."""
    db = get_firestore_client()
    return db.collection('users').document(uid).collection(subcollection)
