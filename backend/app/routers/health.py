"""Google Fit integration router (T072-T076)."""

import os
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query

from app.models.health import (
    GoogleFitAuthUrl,
    GoogleFitCallback,
    GoogleFitStatus,
    HealthMetrics,
    HealthMetricsResponse,
)
from app.models import BaseResponse
from app.routers.auth import get_current_user_uid
from app.services.google_fit import GoogleFitService


router = APIRouter()


def get_google_fit_service(uid: str = Depends(get_current_user_uid)) -> GoogleFitService:
    """Dependency to get Google Fit service for current user."""
    return GoogleFitService(uid)


# ============================================================================
# Google Fit OAuth Endpoints
# ============================================================================

@router.get("/google-fit/auth-url", response_model=GoogleFitAuthUrl)
async def get_google_fit_auth_url(
    redirect_uri: str = Query(..., description="OAuth redirect URI"),
    service: GoogleFitService = Depends(get_google_fit_service)
):
    """Get Google Fit OAuth authorization URL (T072).
    
    Initiates the OAuth flow by returning an authorization URL
    that the user should be redirected to.
    """
    try:
        url, state = service.get_auth_url(redirect_uri)
        return GoogleFitAuthUrl(url=url, state=state)
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/google-fit/callback", response_model=GoogleFitStatus)
async def google_fit_callback(
    callback: GoogleFitCallback,
    redirect_uri: str = Query(..., description="OAuth redirect URI used in auth request"),
    service: GoogleFitService = Depends(get_google_fit_service)
):
    """Handle Google Fit OAuth callback (T073).
    
    Exchanges the authorization code for access tokens.
    """
    try:
        await service.exchange_code(callback.code, callback.state, redirect_uri)
        return await service.get_status()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to complete OAuth: {str(e)}")


@router.get("/google-fit/status", response_model=GoogleFitStatus)
async def get_google_fit_status(
    service: GoogleFitService = Depends(get_google_fit_service)
):
    """Get Google Fit connection status (T074).
    
    Returns whether Google Fit is connected and when it was last synced.
    """
    return await service.get_status()


@router.delete("/google-fit/disconnect", response_model=BaseResponse)
async def disconnect_google_fit(
    service: GoogleFitService = Depends(get_google_fit_service)
):
    """Disconnect Google Fit (T075).
    
    Removes stored tokens and disconnects the Google Fit integration.
    """
    await service.disconnect()
    return BaseResponse(success=True, message="Google Fit disconnected")


# ============================================================================
# Health Metrics Endpoints
# ============================================================================

@router.get("/metrics", response_model=HealthMetricsResponse)
async def get_health_metrics(
    start_time: datetime = Query(..., alias="start", description="Start time (ISO format)"),
    end_time: datetime = Query(..., alias="end", description="End time (ISO format)"),
    service: GoogleFitService = Depends(get_google_fit_service)
):
    """Get health metrics from Google Fit for a time period (T076).
    
    Fetches heart rate, calories, and steps data from Google Fit.
    Requires Google Fit to be connected.
    """
    # Check if connected
    status = await service.get_status()
    if not status.connected:
        raise HTTPException(
            status_code=400,
            detail="Google Fit not connected. Please connect first."
        )
    
    # Validate time range
    if end_time <= start_time:
        raise HTTPException(
            status_code=400,
            detail="End time must be after start time"
        )
    
    metrics = await service.get_health_metrics(start_time, end_time)
    
    return HealthMetricsResponse(
        metrics=metrics,
        start_time=start_time,
        end_time=end_time,
        source="google_fit",
    )
