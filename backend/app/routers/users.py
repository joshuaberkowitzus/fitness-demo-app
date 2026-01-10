"""User profile and settings router."""

from datetime import datetime
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.models.user import User, UserPreferences, UserPreferencesUpdate, UserStats
from app.routers.auth import get_current_user_uid
from app.services.firebase import get_user_doc_ref
from app.services.user_service import user_service


router = APIRouter()


# ============================================================================
# Request/Response Models
# ============================================================================

class UserProfileUpdate(BaseModel):
    """Model for updating user profile."""
    
    display_name: str | None = Field(None, min_length=1, max_length=100)


class InitializeRequest(BaseModel):
    """Request body for user initialization."""
    
    email: str | None = None
    display_name: str | None = None
    photo_url: str | None = None


# ============================================================================
# Profile Endpoints
# ============================================================================

@router.get("/me", response_model=User)
async def get_current_user_profile(uid: str = Depends(get_current_user_uid)):
    """Get the current user's profile."""
    user = await user_service.get_user(uid)
    
    if not user:
        raise HTTPException(status_code=404, detail="User profile not found. Call POST /users/me/initialize first.")
    
    return user


@router.post("/me/initialize", response_model=User, status_code=201)
async def initialize_user(
    request: InitializeRequest | None = None,
    uid: str = Depends(get_current_user_uid)
):
    """Initialize a new user's profile and seed default workout plan.
    
    This should be called after first Firebase Auth sign-in.
    If user already exists, returns existing user (idempotent).
    """
    req = request or InitializeRequest()
    
    return await user_service.initialize_user(
        uid=uid,
        email=req.email or "",
        display_name=req.display_name,
        photo_url=req.photo_url,
    )


@router.patch("/me", response_model=User)
async def update_profile(
    update: UserProfileUpdate,
    uid: str = Depends(get_current_user_uid)
):
    """Update the current user's profile."""
    user = await user_service.get_user(uid)
    
    if not user:
        raise HTTPException(status_code=404, detail="User profile not found")
    
    if update.display_name is not None:
        user = await user_service.update_user(uid, display_name=update.display_name)
    
    return user


@router.patch("/me/preferences", response_model=UserPreferences)
async def update_preferences(
    update: UserPreferencesUpdate,
    uid: str = Depends(get_current_user_uid)
):
    """Update the current user's preferences."""
    user_ref = get_user_doc_ref(uid)
    
    if not user_ref.get().exists:
        raise HTTPException(status_code=404, detail="User profile not found")
    
    # Get current preferences
    user_doc = user_ref.get()
    current_prefs = user_doc.to_dict().get('preferences', {})
    
    # Apply updates
    update_data = {}
    for key, value in update.model_dump().items():
        if value is not None:
            # Convert snake_case to camelCase for Firestore
            firestore_key = ''.join(
                word.capitalize() if i > 0 else word
                for i, word in enumerate(key.split('_'))
            )
            update_data[f'preferences.{firestore_key}'] = value
            current_prefs[firestore_key] = value
    
    if update_data:
        user_ref.update(update_data)
    
    # Return updated preferences
    return UserPreferences(
        theme=current_prefs.get('theme', 'system'),
        notifications_enabled=current_prefs.get('notificationsEnabled', True),
        default_warmup_duration=current_prefs.get('defaultWarmupDuration', 5),
        auto_sync_google_fit=current_prefs.get('autoSyncGoogleFit', False),
        measurement_unit=current_prefs.get('measurementUnit', 'imperial'),
    )


@router.get("/me/stats", response_model=UserStats)
async def get_user_stats(uid: str = Depends(get_current_user_uid)):
    """Get the current user's workout statistics."""
    user = await user_service.get_user(uid)
    
    if not user:
        raise HTTPException(status_code=404, detail="User profile not found")
    
    return await user_service.get_user_stats(uid)

