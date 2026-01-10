"""Workout plan and day management router."""

from fastapi import APIRouter, Depends, HTTPException

from app.models import BaseResponse
from app.models.workout import (
    Exercise,
    ExerciseCreate,
    ExerciseUpdate,
    WorkoutDay,
    WorkoutDayFull,
    WorkoutDayUpdate,
    WorkoutPlan,
    WorkoutPlanFull,
    WorkoutPlanUpdate,
)
from app.routers.auth import get_current_user_uid
from app.services.workout_service import WorkoutService


router = APIRouter()


def get_workout_service(uid: str = Depends(get_current_user_uid)) -> WorkoutService:
    """Dependency to get workout service for current user."""
    return WorkoutService(uid)


# ============================================================================
# Workout Plan Endpoints
# ============================================================================

@router.get("/plan", response_model=WorkoutPlanFull)
async def get_active_plan(service: WorkoutService = Depends(get_workout_service)):
    """Get the user's active workout plan with all days and exercises.
    
    If no plan exists, creates the default knee-preservation plan.
    """
    plan = await service.get_or_create_default_plan()
    return plan


@router.patch("/plan", response_model=WorkoutPlan)
async def update_plan(
    update: WorkoutPlanUpdate,
    service: WorkoutService = Depends(get_workout_service)
):
    """Update the active workout plan metadata (name, description)."""
    try:
        return await service.update_plan(update)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/plan/reset", response_model=WorkoutPlanFull)
async def reset_plan(service: WorkoutService = Depends(get_workout_service)):
    """Reset the workout plan to the default knee-preservation program.
    
    Warning: This deletes all customizations.
    """
    return await service.reset_plan_to_default()


# ============================================================================
# Today's Workout
# ============================================================================

@router.get("/today", response_model=WorkoutDayFull | None)
async def get_today_workout(service: WorkoutService = Depends(get_workout_service)):
    """Get today's workout based on day of week.
    
    Returns null if today is a rest day with no exercises.
    """
    return await service.get_today_workout()


# ============================================================================
# Workout Day Endpoints
# ============================================================================

@router.get("/days/{day_id}", response_model=WorkoutDayFull)
async def get_workout_day(
    day_id: str,
    service: WorkoutService = Depends(get_workout_service)
):
    """Get a specific workout day with exercises."""
    day = await service.get_workout_day(day_id)
    if not day:
        raise HTTPException(status_code=404, detail=f"Workout day '{day_id}' not found")
    return day


@router.patch("/days/{day_id}", response_model=WorkoutDay)
async def update_workout_day(
    day_id: str,
    update: WorkoutDayUpdate,
    service: WorkoutService = Depends(get_workout_service)
):
    """Update a workout day (name, focus, format, etc.)."""
    try:
        return await service.update_workout_day(day_id, update)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ============================================================================
# Exercise Endpoints
# ============================================================================

@router.get("/days/{day_id}/exercises", response_model=list[Exercise])
async def get_exercises(
    day_id: str,
    service: WorkoutService = Depends(get_workout_service)
):
    """Get all exercises for a workout day."""
    return await service.get_exercises(day_id)


@router.post("/days/{day_id}/exercises", response_model=Exercise, status_code=201)
async def add_exercise(
    day_id: str,
    exercise: ExerciseCreate,
    service: WorkoutService = Depends(get_workout_service)
):
    """Add a new exercise to a workout day."""
    try:
        return await service.add_exercise(day_id, exercise)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.patch("/days/{day_id}/exercises/{exercise_id}", response_model=Exercise)
async def update_exercise(
    day_id: str,
    exercise_id: str,
    update: ExerciseUpdate,
    service: WorkoutService = Depends(get_workout_service)
):
    """Update an existing exercise."""
    try:
        return await service.update_exercise(day_id, exercise_id, update)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/days/{day_id}/exercises/{exercise_id}", response_model=BaseResponse)
async def delete_exercise(
    day_id: str,
    exercise_id: str,
    service: WorkoutService = Depends(get_workout_service)
):
    """Delete an exercise from a workout day."""
    try:
        await service.delete_exercise(day_id, exercise_id)
        return BaseResponse(success=True, message="Exercise deleted")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
