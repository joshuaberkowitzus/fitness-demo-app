"""Google Fit service for OAuth and health data integration (T071, T077)."""

import base64
import hashlib
import os
import secrets
from datetime import datetime, timedelta
from typing import Optional
from urllib.parse import urlencode

from cryptography.fernet import Fernet
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

from app.models.health import GoogleFitTokens, HealthMetrics, GoogleFitStatus
from app.services.firebase import get_firestore_client, get_user_doc


# Google Fit OAuth configuration
GOOGLE_FIT_SCOPES = [
    "https://www.googleapis.com/auth/fitness.heart_rate.read",
    "https://www.googleapis.com/auth/fitness.activity.read",
    "https://www.googleapis.com/auth/fitness.body.read",
]

# OAuth URLs
GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"


class GoogleFitService:
    """Service for Google Fit OAuth and health data operations."""
    
    def __init__(self, uid: str):
        """Initialize service with user ID."""
        self.uid = uid
        self.db = get_firestore_client()
        self._fernet = self._get_encryption_key()
    
    @staticmethod
    def _get_encryption_key() -> Fernet:
        """Get or generate encryption key for token storage."""
        key = os.environ.get("GOOGLE_FIT_ENCRYPTION_KEY")
        if not key:
            # Generate a consistent key from a secret (in production, use a proper secret manager)
            secret = os.environ.get("SECRET_KEY", "default-dev-secret-key-change-me")
            # Derive a Fernet-compatible key from the secret
            derived = hashlib.sha256(secret.encode()).digest()
            key = base64.urlsafe_b64encode(derived)
        else:
            key = key.encode() if isinstance(key, str) else key
        return Fernet(key)
    
    def _encrypt_token(self, token: str) -> str:
        """Encrypt a token for secure storage."""
        return self._fernet.encrypt(token.encode()).decode()
    
    def _decrypt_token(self, encrypted: str) -> str:
        """Decrypt a stored token."""
        return self._fernet.decrypt(encrypted.encode()).decode()
    
    # =========================================================================
    # OAuth Flow
    # =========================================================================
    
    def get_auth_url(self, redirect_uri: str) -> tuple[str, str]:
        """Generate Google OAuth authorization URL.
        
        Returns:
            Tuple of (authorization_url, state)
        """
        client_id = os.environ.get("GOOGLE_CLIENT_ID")
        if not client_id:
            raise ValueError("GOOGLE_CLIENT_ID environment variable not set")
        
        # Generate secure state parameter
        state = secrets.token_urlsafe(32)
        
        # Store state for verification
        self._store_oauth_state(state)
        
        params = {
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": " ".join(GOOGLE_FIT_SCOPES),
            "access_type": "offline",
            "prompt": "consent",
            "state": state,
        }
        
        url = f"{GOOGLE_AUTH_URL}?{urlencode(params)}"
        return url, state
    
    async def exchange_code(self, code: str, state: str, redirect_uri: str) -> GoogleFitTokens:
        """Exchange authorization code for access tokens.
        
        Args:
            code: Authorization code from OAuth callback
            state: State parameter to verify
            redirect_uri: Redirect URI used in initial auth request
            
        Returns:
            GoogleFitTokens with encrypted tokens
        """
        import httpx
        
        # Verify state
        if not self._verify_oauth_state(state):
            raise ValueError("Invalid OAuth state parameter")
        
        client_id = os.environ.get("GOOGLE_CLIENT_ID")
        client_secret = os.environ.get("GOOGLE_CLIENT_SECRET")
        
        if not client_id or not client_secret:
            raise ValueError("Google OAuth credentials not configured")
        
        # Exchange code for tokens
        async with httpx.AsyncClient() as client:
            response = await client.post(
                GOOGLE_TOKEN_URL,
                data={
                    "client_id": client_id,
                    "client_secret": client_secret,
                    "code": code,
                    "grant_type": "authorization_code",
                    "redirect_uri": redirect_uri,
                },
            )
            response.raise_for_status()
            data = response.json()
        
        # Create tokens object
        expires_at = datetime.utcnow() + timedelta(seconds=data.get("expires_in", 3600))
        tokens = GoogleFitTokens(
            access_token=data["access_token"],
            refresh_token=data.get("refresh_token", ""),
            token_type=data.get("token_type", "Bearer"),
            expires_at=expires_at,
            scopes=data.get("scope", "").split(),
        )
        
        # Store encrypted tokens
        await self._store_tokens(tokens)
        
        return tokens
    
    async def refresh_access_token(self) -> Optional[GoogleFitTokens]:
        """Refresh the access token using the refresh token.
        
        Returns:
            Updated GoogleFitTokens or None if refresh fails
        """
        import httpx
        
        tokens = await self.get_tokens()
        if not tokens or not tokens.refresh_token:
            return None
        
        client_id = os.environ.get("GOOGLE_CLIENT_ID")
        client_secret = os.environ.get("GOOGLE_CLIENT_SECRET")
        
        if not client_id or not client_secret:
            return None
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    GOOGLE_TOKEN_URL,
                    data={
                        "client_id": client_id,
                        "client_secret": client_secret,
                        "refresh_token": self._decrypt_token(tokens.refresh_token),
                        "grant_type": "refresh_token",
                    },
                )
                response.raise_for_status()
                data = response.json()
            
            # Update tokens
            expires_at = datetime.utcnow() + timedelta(seconds=data.get("expires_in", 3600))
            new_tokens = GoogleFitTokens(
                access_token=data["access_token"],
                refresh_token=tokens.refresh_token,  # Keep existing refresh token
                token_type=data.get("token_type", "Bearer"),
                expires_at=expires_at,
                scopes=tokens.scopes,
            )
            
            await self._store_tokens(new_tokens)
            return new_tokens
            
        except Exception as e:
            print(f"Failed to refresh Google Fit token: {e}")
            return None
    
    # =========================================================================
    # Token Storage
    # =========================================================================
    
    async def _store_tokens(self, tokens: GoogleFitTokens) -> None:
        """Store encrypted tokens in Firestore."""
        user_ref = get_user_doc(self.uid)
        
        # Encrypt sensitive tokens
        encrypted_data = {
            "googleFit": {
                "accessToken": self._encrypt_token(tokens.access_token),
                "refreshToken": self._encrypt_token(tokens.refresh_token) if tokens.refresh_token else "",
                "tokenType": tokens.token_type,
                "expiresAt": tokens.expires_at,
                "scopes": tokens.scopes,
                "connectedAt": datetime.utcnow(),
            }
        }
        
        user_ref.set(encrypted_data, merge=True)
    
    async def get_tokens(self) -> Optional[GoogleFitTokens]:
        """Retrieve and decrypt tokens from Firestore."""
        user_ref = get_user_doc(self.uid)
        user_doc = user_ref.get()
        
        if not user_doc.exists:
            return None
        
        data = user_doc.to_dict()
        google_fit_data = data.get("googleFit")
        
        if not google_fit_data or not google_fit_data.get("accessToken"):
            return None
        
        try:
            return GoogleFitTokens(
                access_token=google_fit_data["accessToken"],  # Already encrypted for storage check
                refresh_token=google_fit_data.get("refreshToken", ""),
                token_type=google_fit_data.get("tokenType", "Bearer"),
                expires_at=google_fit_data["expiresAt"],
                scopes=google_fit_data.get("scopes", []),
            )
        except Exception:
            return None
    
    async def get_valid_access_token(self) -> Optional[str]:
        """Get a valid (non-expired) access token, refreshing if needed."""
        tokens = await self.get_tokens()
        if not tokens:
            return None
        
        # Check if token is expired (with 5 minute buffer)
        if tokens.is_expired or (tokens.expires_at - datetime.utcnow()) < timedelta(minutes=5):
            tokens = await self.refresh_access_token()
            if not tokens:
                return None
        
        # Decrypt and return access token
        return self._decrypt_token(tokens.access_token)
    
    async def disconnect(self) -> None:
        """Disconnect Google Fit and remove stored tokens."""
        user_ref = get_user_doc(self.uid)
        user_ref.update({"googleFit": None})
    
    # =========================================================================
    # Status
    # =========================================================================
    
    async def get_status(self) -> GoogleFitStatus:
        """Get Google Fit connection status."""
        user_ref = get_user_doc(self.uid)
        user_doc = user_ref.get()
        
        if not user_doc.exists:
            return GoogleFitStatus(connected=False)
        
        data = user_doc.to_dict()
        google_fit_data = data.get("googleFit")
        
        if not google_fit_data or not google_fit_data.get("accessToken"):
            return GoogleFitStatus(connected=False)
        
        return GoogleFitStatus(
            connected=True,
            last_sync_at=google_fit_data.get("lastSyncAt"),
            scopes=google_fit_data.get("scopes", []),
        )
    
    # =========================================================================
    # Health Data Fetching
    # =========================================================================
    
    async def get_health_metrics(
        self,
        start_time: datetime,
        end_time: datetime
    ) -> HealthMetrics:
        """Fetch health metrics from Google Fit for a time period.
        
        Args:
            start_time: Start of the time period
            end_time: End of the time period
            
        Returns:
            HealthMetrics with available data
        """
        access_token = await self.get_valid_access_token()
        if not access_token:
            return HealthMetrics()
        
        try:
            # Build credentials and service
            credentials = Credentials(token=access_token)
            fitness_service = build("fitness", "v1", credentials=credentials)
            
            # Convert times to milliseconds
            start_ms = int(start_time.timestamp() * 1000)
            end_ms = int(end_time.timestamp() * 1000)
            
            # Fetch heart rate data
            heart_rate_data = await self._fetch_heart_rate(
                fitness_service, start_ms, end_ms
            )
            
            # Fetch calories data
            calories = await self._fetch_calories(
                fitness_service, start_ms, end_ms
            )
            
            # Fetch steps data
            steps = await self._fetch_steps(
                fitness_service, start_ms, end_ms
            )
            
            # Update last sync time
            await self._update_last_sync()
            
            return HealthMetrics(
                heart_rate_avg=heart_rate_data.get("avg"),
                heart_rate_max=heart_rate_data.get("max"),
                heart_rate_min=heart_rate_data.get("min"),
                calories_burned=calories,
                steps=steps,
            )
            
        except Exception as e:
            print(f"Error fetching Google Fit data: {e}")
            return HealthMetrics()
    
    async def _fetch_heart_rate(
        self,
        service,
        start_ms: int,
        end_ms: int
    ) -> dict:
        """Fetch heart rate data from Google Fit."""
        try:
            result = service.users().dataSources().datasets().get(
                userId="me",
                dataSourceId="derived:com.google.heart_rate.bpm:com.google.android.gms:merge_heart_rate_bpm",
                datasetId=f"{start_ms}000000-{end_ms}000000",
            ).execute()
            
            points = result.get("point", [])
            if not points:
                return {}
            
            values = [p["value"][0]["fpVal"] for p in points if p.get("value")]
            if not values:
                return {}
            
            return {
                "avg": int(sum(values) / len(values)),
                "max": int(max(values)),
                "min": int(min(values)),
            }
        except Exception as e:
            print(f"Error fetching heart rate: {e}")
            return {}
    
    async def _fetch_calories(
        self,
        service,
        start_ms: int,
        end_ms: int
    ) -> Optional[int]:
        """Fetch calories burned from Google Fit."""
        try:
            result = service.users().dataSources().datasets().get(
                userId="me",
                dataSourceId="derived:com.google.calories.expended:com.google.android.gms:merge_calories_expended",
                datasetId=f"{start_ms}000000-{end_ms}000000",
            ).execute()
            
            points = result.get("point", [])
            if not points:
                return None
            
            total = sum(p["value"][0]["fpVal"] for p in points if p.get("value"))
            return int(total)
        except Exception as e:
            print(f"Error fetching calories: {e}")
            return None
    
    async def _fetch_steps(
        self,
        service,
        start_ms: int,
        end_ms: int
    ) -> Optional[int]:
        """Fetch step count from Google Fit."""
        try:
            result = service.users().dataSources().datasets().get(
                userId="me",
                dataSourceId="derived:com.google.step_count.delta:com.google.android.gms:merge_step_deltas",
                datasetId=f"{start_ms}000000-{end_ms}000000",
            ).execute()
            
            points = result.get("point", [])
            if not points:
                return None
            
            total = sum(p["value"][0]["intVal"] for p in points if p.get("value"))
            return total
        except Exception as e:
            print(f"Error fetching steps: {e}")
            return None
    
    async def _update_last_sync(self) -> None:
        """Update the last sync timestamp."""
        user_ref = get_user_doc(self.uid)
        user_ref.update({"googleFit.lastSyncAt": datetime.utcnow()})
    
    # =========================================================================
    # OAuth State Management
    # =========================================================================
    
    def _store_oauth_state(self, state: str) -> None:
        """Store OAuth state for verification."""
        user_ref = get_user_doc(self.uid)
        user_ref.set({
            "googleFitOAuthState": {
                "state": state,
                "createdAt": datetime.utcnow(),
            }
        }, merge=True)
    
    def _verify_oauth_state(self, state: str) -> bool:
        """Verify OAuth state parameter."""
        user_ref = get_user_doc(self.uid)
        user_doc = user_ref.get()
        
        if not user_doc.exists:
            return False
        
        data = user_doc.to_dict()
        stored_state = data.get("googleFitOAuthState", {}).get("state")
        
        if stored_state != state:
            return False
        
        # Clean up state after verification
        user_ref.update({"googleFitOAuthState": None})
        return True
