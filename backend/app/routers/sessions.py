"""Workout session logging router."""

from fastapi import APIRouter, Depends, HTTPException, Query

from app.models import BaseResponse, PaginatedResponse
from app.models.session import (
    ExerciseCompletion,
    ExerciseCompletionCreate,
    SessionCreate,
    SessionUpdate,
    WorkoutSession,
    WorkoutSessionFull,
)
from app.routers.auth import get_current_user_uid
from app.services.session_service import SessionService


router = APIRouter()


def get_session_service(uid: str = Depends(get_current_user_uid)) -> SessionService:
    """Dependency to get session service for current user."""
    return SessionService(uid)


# ============================================================================
# Session Lifecycle
# ============================================================================

@router.post("", response_model=WorkoutSession, status_code=201)
async def start_session(
    create: SessionCreate,
    service: SessionService = Depends(get_session_service)
):
    """Start a new workout session.
    
    Only one session can be in progress at a time.
    """
    try:
        return await service.start_session(create)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/current", response_model=WorkoutSessionFull | None)
async def get_current_session(service: SessionService = Depends(get_session_service)):
    """Get the current in-progress session with exercise completions.
    
    Returns null if no session is in progress.
    """
    return await service.get_current_session()


@router.get("", response_model=PaginatedResponse[WorkoutSession])
async def list_sessions(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    status: str | None = Query(None, pattern="^(in_progress|completed|cancelled)$"),
    service: SessionService = Depends(get_session_service)
):
    """List workout sessions with pagination."""
    sessions, total = await service.list_sessions(limit=limit, offset=offset, status=status)
    return PaginatedResponse(
        items=sessions,
        total=total,
        offset=offset,
        limit=limit,
    )


@router.get("/{session_id}", response_model=WorkoutSessionFull)
async def get_session(
    session_id: str,
    service: SessionService = Depends(get_session_service)
):
    """Get a specific session with exercise completions."""
    session = await service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found")
    return session


@router.patch("/{session_id}", response_model=WorkoutSession)
async def update_session(
    session_id: str,
    update: SessionUpdate,
    service: SessionService = Depends(get_session_service)
):
    """Update a session (complete, cancel, add notes, warmup status)."""
    try:
        return await service.update_session(session_id, update)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ============================================================================
# Exercise Completion
# ============================================================================

@router.post(
    "/{session_id}/exercises/{exercise_id}/complete",
    response_model=ExerciseCompletion,
    status_code=201
)
async def complete_exercise(
    session_id: str,
    exercise_id: str,
    completion: ExerciseCompletionCreate | None = None,
    service: SessionService = Depends(get_session_service)
):
    """Mark an exercise as complete in the current session.
    
    Optionally include sets/reps/weight/notes.
    """
    try:
        return await service.complete_exercise(session_id, exercise_id, completion)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete(
    "/{session_id}/exercises/{exercise_id}/complete",
    response_model=BaseResponse
)
async def undo_exercise_completion(
    session_id: str,
    exercise_id: str,
    service: SessionService = Depends(get_session_service)
):
    """Undo an exercise completion (uncheck it)."""
    try:
        await service.undo_exercise_completion(session_id, exercise_id)
        return BaseResponse(success=True, message="Exercise completion removed")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
