"""Health and Google Fit integration models (T070)."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class GoogleFitTokens(BaseModel):
    """Encrypted Google Fit OAuth tokens stored in Firestore."""
    
    model_config = ConfigDict(populate_by_name=True)
    
    access_token: str = Field(..., alias="accessToken")
    refresh_token: str = Field(..., alias="refreshToken")
    token_type: str = Field(default="Bearer", alias="tokenType")
    expires_at: datetime = Field(..., alias="expiresAt")
    scopes: list[str] = Field(default_factory=list)
    
    @property
    def is_expired(self) -> bool:
        """Check if the access token is expired."""
        return datetime.utcnow() >= self.expires_at


class GoogleFitStatus(BaseModel):
    """Google Fit connection status response."""
    
    model_config = ConfigDict(populate_by_name=True)
    
    connected: bool = False
    last_sync_at: Optional[datetime] = Field(default=None, alias="lastSyncAt")
    scopes: list[str] = Field(default_factory=list)


class GoogleFitAuthUrl(BaseModel):
    """Google Fit OAuth authorization URL response."""
    
    url: str
    state: str


class GoogleFitCallback(BaseModel):
    """Google Fit OAuth callback request."""
    
    code: str
    state: str


class HealthMetrics(BaseModel):
    """Health metrics from Google Fit for a workout session."""
    
    model_config = ConfigDict(populate_by_name=True)
    
    heart_rate_avg: Optional[int] = Field(default=None, alias="heartRateAvg")
    heart_rate_max: Optional[int] = Field(default=None, alias="heartRateMax")
    heart_rate_min: Optional[int] = Field(default=None, alias="heartRateMin")
    calories_burned: Optional[int] = Field(default=None, alias="caloriesBurned")
    steps: Optional[int] = None
    active_minutes: Optional[int] = Field(default=None, alias="activeMinutes")
    
    @property
    def has_data(self) -> bool:
        """Check if any metrics are available."""
        return any([
            self.heart_rate_avg,
            self.heart_rate_max,
            self.calories_burned,
            self.steps,
            self.active_minutes,
        ])


class HealthMetricsRequest(BaseModel):
    """Request parameters for fetching health metrics."""
    
    start_time: datetime = Field(..., alias="startTime")
    end_time: datetime = Field(..., alias="endTime")


class HealthMetricsResponse(BaseModel):
    """Response containing health metrics for a time period."""
    
    model_config = ConfigDict(populate_by_name=True)
    
    metrics: HealthMetrics
    start_time: datetime = Field(..., alias="startTime")
    end_time: datetime = Field(..., alias="endTime")
    source: str = "google_fit"
