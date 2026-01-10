"""Workout-related Pydantic models."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.models import BaseResponse, FirestoreDocument


# ============================================================================
# Exercise Models
# ============================================================================

class ExerciseBase(BaseModel):
    """Base exercise fields."""
    
    name: str = Field(..., min_length=1, max_length=200)
    instructions: str = Field(..., min_length=1)
    sets: int | None = Field(None, ge=1, le=20)
    reps: int | str | None = None
    tempo: str | None = None
    notes: str | None = None
    category: str | None = None


class ExerciseCreate(ExerciseBase):
    """Model for creating a new exercise."""
    pass


class ExerciseUpdate(BaseModel):
    """Model for updating an exercise."""
    
    name: str | None = Field(None, min_length=1, max_length=200)
    instructions: str | None = None
    sets: int | None = Field(None, ge=1, le=20)
    reps: int | str | None = None
    tempo: str | None = None
    notes: str | None = None
    category: str | None = None
    sort_order: int | None = Field(None, ge=0)


class Exercise(FirestoreDocument, ExerciseBase):
    """Exercise model with ID."""
    
    sort_order: int = 0


# ============================================================================
# Workout Day Models
# ============================================================================

DayOfWeek = Literal[0, 1, 2, 3, 4, 5, 6]
DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']


class WorkoutDayBase(BaseModel):
    """Base workout day fields."""
    
    name: str = Field(..., min_length=1, max_length=200)
    focus: str = Field(..., min_length=1)
    format: str | None = None
    duration: int | None = Field(None, ge=1, le=180)  # Duration in minutes
    is_rest_day: bool = False


class WorkoutDayUpdate(BaseModel):
    """Model for updating a workout day."""
    
    name: str | None = Field(None, min_length=1, max_length=200)
    focus: str | None = None
    format: str | None = None
    duration: int | None = Field(None, ge=1, le=180)
    is_rest_day: bool | None = None


class WorkoutDay(FirestoreDocument, WorkoutDayBase):
    """Workout day model with ID."""
    
    day_of_week: DayOfWeek
    sort_order: int = 0


class WorkoutDayFull(WorkoutDay):
    """Workout day with exercises."""
    
    exercises: list[Exercise] = []


# ============================================================================
# Workout Plan Models
# ============================================================================

class WorkoutPlanBase(BaseModel):
    """Base workout plan fields."""
    
    name: str = Field(..., min_length=1, max_length=200)
    description: str | None = None


class WorkoutPlanUpdate(BaseModel):
    """Model for updating a workout plan."""
    
    name: str | None = Field(None, min_length=1, max_length=200)
    description: str | None = None


class WorkoutPlan(FirestoreDocument, WorkoutPlanBase):
    """Workout plan model with ID."""
    
    is_active: bool = True
    is_default: bool = False
    created_at: datetime | None = None
    updated_at: datetime | None = None


class WorkoutPlanFull(WorkoutPlan):
    """Workout plan with all days."""
    
    days: list[WorkoutDayFull] = []
