"""Base Pydantic models for API responses."""

from datetime import datetime
from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


class BaseResponse(BaseModel):
    """Base model for all API responses."""
    
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
    )


class ErrorResponse(BaseModel):
    """Standard error response."""
    
    detail: str
    code: str | None = None


class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated response wrapper."""
    
    items: list[T]
    total: int
    offset: int
    limit: int
    
    @property
    def has_more(self) -> bool:
        """Check if there are more items available."""
        return self.offset + len(self.items) < self.total


class TimestampMixin(BaseModel):
    """Mixin for models with timestamps."""
    
    created_at: datetime | None = None
    updated_at: datetime | None = None


class FirestoreDocument(BaseModel):
    """Base model for Firestore documents."""
    
    id: str
    
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        extra="ignore",
    )
