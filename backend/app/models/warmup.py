"""Warmup routine Pydantic models."""

from pydantic import BaseModel, Field

from app.models import FirestoreDocument


class WarmupMovement(BaseModel):
    """A single movement in a warmup routine."""
    
    name: str
    instructions: str
    duration: str = Field(..., description="Duration like '30 seconds' or '10 reps'")
    purpose: str = Field(..., description="What this movement targets/achieves")
    sort_order: int = 0


class WarmupRoutine(FirestoreDocument):
    """A complete warmup routine."""
    
    name: str
    description: str
    duration: int = Field(..., ge=1, le=30, description="Total duration in minutes")
    movements: list[WarmupMovement] = []


class WarmupRoutineResponse(BaseModel):
    """Response model for warmup routine endpoint."""
    
    id: str
    name: str
    description: str
    duration: int
    movements: list[WarmupMovement]
