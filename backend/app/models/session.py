"""Session-related Pydantic models."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

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
    
    exercise_id: str = Field(..., alias="exerciseId", serialization_alias="exerciseId")
    exercise_name: str = Field(..., serialization_alias="exerciseName")
    completed_at: datetime = Field(..., serialization_alias="completedAt")
    sets_completed: int | None = Field(None, serialization_alias="setsCompleted")
    reps_completed: int | None = Field(None, serialization_alias="repsCompleted")
    weight: float | None = None
    notes: str | None = None
    skipped: bool = False
    skip_reason: str | None = Field(None, serialization_alias="skipReason")


# ============================================================================
# Session Models
# ============================================================================

SessionStatus = Literal['in_progress', 'completed', 'cancelled']


class SessionCreate(BaseModel):
    """Model for starting a new session."""
    
    model_config = ConfigDict(populate_by_name=True)
    
    workout_day_id: str = Field(..., min_length=1, alias="workoutDayId")
    warmup_completed: bool = Field(default=False, alias="warmupCompleted")


class SessionUpdate(BaseModel):
    """Model for updating a session."""
    
    model_config = ConfigDict(populate_by_name=True)
    
    status: SessionStatus | None = None
    notes: str | None = None
    warmup_completed: bool | None = Field(default=None, alias="warmupCompleted")


class WorkoutSession(FirestoreDocument):
    """Workout session model."""
    
    date: str  # ISO date YYYY-MM-DD
    workout_plan_id: str = Field(..., serialization_alias="workoutPlanId")
    workout_day_id: str = Field(..., serialization_alias="workoutDayId")
    workout_day_name: str = Field(..., serialization_alias="workoutDayName")
    started_at: datetime = Field(..., serialization_alias="startedAt")
    completed_at: datetime | None = Field(None, serialization_alias="completedAt")
    status: SessionStatus = 'in_progress'
    warmup_completed: bool = Field(False, serialization_alias="warmupCompleted")
    notes: str | None = None
    health_metrics: HealthMetrics | None = Field(None, serialization_alias="healthMetrics")
    synced_at: datetime | None = Field(None, serialization_alias="syncedAt")


class WorkoutSessionFull(WorkoutSession):
    """Session with exercise completions."""
    
    exercise_completions: list[ExerciseCompletion] = Field([], serialization_alias="exerciseCompletions")
