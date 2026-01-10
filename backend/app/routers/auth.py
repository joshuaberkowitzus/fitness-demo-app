"""Authentication router with JWT verification middleware."""

from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, status

from app.services.firebase import verify_firebase_token

router = APIRouter()


async def get_current_user_uid(
    authorization: Annotated[str | None, Header()] = None
) -> str:
    """
    Dependency to extract and verify the Firebase ID token from the Authorization header.
    
    Returns:
        The authenticated user's UID
        
    Raises:
        HTTPException: If the token is missing, invalid, or expired
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Extract token from "Bearer <token>" format
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format. Use 'Bearer <token>'",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = parts[1]
    
    try:
        decoded_token = await verify_firebase_token(token)
        return decoded_token["uid"]
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )


# Type alias for dependency injection
CurrentUserUID = Annotated[str, Depends(get_current_user_uid)]


@router.get("/verify")
async def verify_token(uid: CurrentUserUID) -> dict:
    """
    Verify authentication token.
    
    Returns user info if the token is valid.
    """
    return {
        "authenticated": True,
        "uid": uid,
    }
