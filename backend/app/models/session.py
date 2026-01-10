"""Session-related Pydantic models."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.models import FirestoreDocument


# ============================================================================
# Health Metrics
# ============================================================================

class HealthMetrics(BaseModel):
    """Health metrics from Google Fit."""
    
    heart_rate_avg: int | None = None
    heart_rate_max: int | None = None
    calories_burned: int | None = None
    steps: int | None = None


# ============================================================================
# Exercise Completion Models
# ============================================================================

class ExerciseCompletionCreate(BaseModel):
    """Model for marking an exercise complete."""
    
    sets_completed: int | None = Field(None, ge=0)
    reps_completed: int | None = Field(None, ge=0)
    weight: float | None = Field(None, ge=0)
    notes: str | None = None


class ExerciseCompletion(FirestoreDocument):
    """Record of completing an exercise."""
    
    exercise_name: str
    completed_at: datetime
    sets_completed: int | None = None
    reps_completed: int | None = None
    weight: float | None = None
    notes: str | None = None
    skipped: bool = False
    skip_reason: str | None = None


# ============================================================================
# Session Models
# ============================================================================

SessionStatus = Literal['in_progress', 'completed', 'cancelled']


class SessionCreate(BaseModel):
    """Model for starting a new session."""
    
    workout_day_id: str = Field(..., min_length=1)
    warmup_completed: bool = False


class SessionUpdate(BaseModel):
    """Model for updating a session."""
    
    status: SessionStatus | None = None
    notes: str | None = None
    warmup_completed: bool | None = None


class WorkoutSession(FirestoreDocument):
    """Workout session model."""
    
    date: str  # ISO date YYYY-MM-DD
    workout_plan_id: str
    workout_day_id: str
    workout_day_name: str
    started_at: datetime
    completed_at: datetime | None = None
    status: SessionStatus = 'in_progress'
    warmup_completed: bool = False
    notes: str | None = None
    health_metrics: HealthMetrics | None = None
    synced_at: datetime | None = None


class WorkoutSessionFull(WorkoutSession):
    """Session with exercise completions."""
    
    exercise_completions: list[ExerciseCompletion] = []
