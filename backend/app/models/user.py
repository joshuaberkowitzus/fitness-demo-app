"""User Pydantic models for authentication and profile management."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.models import FirestoreDocument


class UserPreferences(BaseModel):
    """User preference settings."""
    
    theme: Literal['light', 'dark', 'system'] = 'system'
    notifications_enabled: bool = True
    default_warmup_duration: int = Field(default=5, ge=1, le=30)
    auto_sync_google_fit: bool = False
    measurement_unit: Literal['metric', 'imperial'] = 'imperial'


class User(FirestoreDocument):
    """User profile data."""
    
    email: str
    display_name: str | None = None
    photo_url: str | None = None
    created_at: datetime | None = None
    last_login: datetime | None = None
    preferences: UserPreferences = Field(default_factory=UserPreferences)
    google_fit_connected: bool = False
    streak_days: int = 0
    workout_plan_id: str | None = None


class UserCreate(BaseModel):
    """Model for creating a new user."""
    
    email: str
    display_name: str | None = None
    photo_url: str | None = None


class UserUpdate(BaseModel):
    """Model for updating user profile."""
    
    display_name: str | None = Field(None, min_length=1, max_length=100)


class UserPreferencesUpdate(BaseModel):
    """Model for updating user preferences."""
    
    theme: Literal['light', 'dark', 'system'] | None = None
    notifications_enabled: bool | None = None
    default_warmup_duration: int | None = Field(None, ge=1, le=30)
    auto_sync_google_fit: bool | None = None
    measurement_unit: Literal['metric', 'imperial'] | None = None


class UserStats(BaseModel):
    """User statistics and progress data."""
    
    total_workouts: int = 0
    total_exercises_completed: int = 0
    current_streak: int = 0
    longest_streak: int = 0
    last_workout_date: datetime | None = None
    workouts_this_week: int = 0
    workouts_this_month: int = 0
