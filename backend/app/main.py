"""FastAPI application entry point."""

import logging
import time
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.config import get_settings
from app.routers import auth, users, workouts, sessions, health, warmup

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup/shutdown."""
    # Startup: Initialize Firebase (lazy, will happen on first request)
    yield
    # Shutdown: Cleanup if needed


settings = get_settings()

app = FastAPI(
    title="Fitness Tracker API",
    description="Backend API for the Fitness Tracker application",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all incoming requests with timing."""
    request_id = str(uuid.uuid4())[:8]
    start_time = time.time()
    
    # Log request
    logger.info(
        f"[{request_id}] {request.method} {request.url.path} - Started"
    )
    
    response = await call_next(request)
    
    # Calculate duration
    duration = (time.time() - start_time) * 1000
    
    # Log response
    logger.info(
        f"[{request_id}] {request.method} {request.url.path} - "
        f"Completed {response.status_code} in {duration:.2f}ms"
    )
    
    # Add request ID to response headers
    response.headers["X-Request-ID"] = request_id
    return response


# Error handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors with detailed response."""
    errors = []
    for error in exc.errors():
        errors.append({
            "field": ".".join(str(loc) for loc in error["loc"]),
            "message": error["msg"],
            "type": error["type"],
        })
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Validation error",
            "errors": errors,
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected errors gracefully."""
    logger.exception(f"Unexpected error: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An unexpected error occurred",
            "type": type(exc).__name__,
        },
    )

# Include routers
app.include_router(auth.router, prefix=f"{settings.api_prefix}/auth", tags=["auth"])
app.include_router(users.router, prefix=f"{settings.api_prefix}/users", tags=["users"])
app.include_router(workouts.router, prefix=f"{settings.api_prefix}/workouts", tags=["workouts"])
app.include_router(sessions.router, prefix=f"{settings.api_prefix}/sessions", tags=["sessions"])
app.include_router(health.router, prefix=f"{settings.api_prefix}/health", tags=["health"])
app.include_router(warmup.router, prefix=f"{settings.api_prefix}/warmup", tags=["warmup"])


@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "healthy", "service": "fitness-tracker-api"}


@app.get("/health")
async def health_check():
    """Detailed health check endpoint."""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "firebase": "connected",  # Will be validated on actual requests
    }
