"""Warmup routine router."""

from fastapi import APIRouter

from app.models.warmup import WarmupRoutineResponse
from app.seed.warmup_routine import get_default_warmup_routine


router = APIRouter()


@router.get("", response_model=WarmupRoutineResponse)
async def get_warmup_routine():
    """Get the default warmup routine.
    
    Returns the knee-shield warmup routine with all movements.
    This endpoint does not require authentication as the warmup
    routine is the same for all users.
    """
    routine = get_default_warmup_routine()
    
    return WarmupRoutineResponse(
        id=routine.id,
        name=routine.name,
        description=routine.description,
        duration=routine.duration,
        movements=routine.movements,
    )
