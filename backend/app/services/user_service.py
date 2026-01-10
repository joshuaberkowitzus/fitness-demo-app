"""User service for profile management and initialization."""

from datetime import datetime, timedelta
from typing import Optional

from google.cloud.firestore import FieldFilter

from app.models.user import User, UserPreferences, UserStats
from app.services.firebase import get_db, get_user_doc_ref
from app.seed.default_plan import create_default_workout_plan


class UserService:
    """Service for user profile operations."""
    
    @staticmethod
    async def get_user(uid: str) -> Optional[User]:
        """Get a user by UID.
        
        Args:
            uid: The Firebase user UID
            
        Returns:
            User object if found, None otherwise
        """
        user_ref = get_user_doc_ref(uid)
        user_doc = user_ref.get()
        
        if not user_doc.exists:
            return None
        
        data = user_doc.to_dict()
        
        return User(
            id=uid,
            email=data.get('email', ''),
            display_name=data.get('displayName'),
            photo_url=data.get('photoUrl'),
            created_at=data.get('createdAt'),
            last_login=data.get('lastLogin'),
            preferences=UserPreferences(**data.get('preferences', {})) if data.get('preferences') else UserPreferences(),
            google_fit_connected=data.get('googleFitConnected', False),
            streak_days=data.get('streakDays', 0),
            workout_plan_id=data.get('workoutPlanId'),
        )
    
    @staticmethod
    async def initialize_user(
        uid: str,
        email: str,
        display_name: Optional[str] = None,
        photo_url: Optional[str] = None,
    ) -> User:
        """Initialize a new user with default workout plan.
        
        This is called after first Firebase Auth sign-in.
        Creates user profile and seeds default workout plan.
        
        Args:
            uid: The Firebase user UID
            email: User's email address
            display_name: Optional display name
            photo_url: Optional photo URL
            
        Returns:
            The created/updated User object
        """
        user_ref = get_user_doc_ref(uid)
        now = datetime.utcnow()
        
        # Check if user already exists
        existing_doc = user_ref.get()
        if existing_doc.exists:
            # User exists - just update last login
            user_ref.update({'lastLogin': now})
            return await UserService.get_user(uid)
        
        # Create default workout plan for new user
        plan_id = await create_default_workout_plan(uid)
        
        # Create new user profile
        user_data = {
            'email': email,
            'displayName': display_name,
            'photoUrl': photo_url,
            'createdAt': now,
            'lastLogin': now,
            'preferences': {
                'theme': 'system',
                'notificationsEnabled': True,
                'defaultWarmupDuration': 5,
                'autoSyncGoogleFit': False,
                'measurementUnit': 'imperial',
            },
            'googleFitConnected': False,
            'streakDays': 0,
            'workoutPlanId': plan_id,
        }
        
        user_ref.set(user_data)
        
        return User(
            id=uid,
            email=email,
            display_name=display_name,
            photo_url=photo_url,
            created_at=now,
            last_login=now,
            preferences=UserPreferences(),
            google_fit_connected=False,
            streak_days=0,
            workout_plan_id=plan_id,
        )
    
    @staticmethod
    async def update_user(uid: str, **kwargs) -> User:
        """Update user profile fields.
        
        Args:
            uid: The Firebase user UID
            **kwargs: Fields to update
            
        Returns:
            Updated User object
        """
        user_ref = get_user_doc_ref(uid)
        
        # Convert snake_case to camelCase for Firestore
        update_data = {}
        for key, value in kwargs.items():
            if value is not None:
                firestore_key = ''.join(
                    word.capitalize() if i > 0 else word
                    for i, word in enumerate(key.split('_'))
                )
                update_data[firestore_key] = value
        
        if update_data:
            user_ref.update(update_data)
        
        return await UserService.get_user(uid)
    
    @staticmethod
    async def get_user_stats(uid: str) -> UserStats:
        """Calculate user statistics from workout sessions.
        
        Args:
            uid: The Firebase user UID
            
        Returns:
            UserStats object with calculated statistics
        """
        db = get_db()
        sessions_ref = db.collection('users').document(uid).collection('sessions')
        
        # Get all completed sessions
        completed_sessions = list(
            sessions_ref.where(
                filter=FieldFilter('status', '==', 'completed')
            ).stream()
        )
        
        total_workouts = len(completed_sessions)
        total_exercises = 0
        last_workout_date = None
        workout_dates = []
        
        for session in completed_sessions:
            data = session.to_dict()
            
            # Count exercises
            completions = data.get('exerciseCompletions', [])
            total_exercises += len([c for c in completions if not c.get('skipped', False)])
            
            # Track dates
            completed_at = data.get('completedAt')
            if completed_at:
                workout_dates.append(completed_at)
                if not last_workout_date or completed_at > last_workout_date:
                    last_workout_date = completed_at
        
        # Calculate streaks
        current_streak, longest_streak = UserService._calculate_streaks(workout_dates)
        
        # Calculate this week/month counts
        now = datetime.utcnow()
        week_start = now - timedelta(days=now.weekday())
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        workouts_this_week = sum(
            1 for d in workout_dates
            if d >= week_start
        )
        workouts_this_month = sum(
            1 for d in workout_dates
            if d >= month_start
        )
        
        return UserStats(
            total_workouts=total_workouts,
            total_exercises_completed=total_exercises,
            current_streak=current_streak,
            longest_streak=longest_streak,
            last_workout_date=last_workout_date,
            workouts_this_week=workouts_this_week,
            workouts_this_month=workouts_this_month,
        )
    
    @staticmethod
    def _calculate_streaks(workout_dates: list[datetime]) -> tuple[int, int]:
        """Calculate current and longest workout streaks.
        
        Args:
            workout_dates: List of workout completion dates
            
        Returns:
            Tuple of (current_streak, longest_streak)
        """
        if not workout_dates:
            return 0, 0
        
        # Normalize to dates only and remove duplicates
        unique_dates = sorted(set(d.date() for d in workout_dates), reverse=True)
        
        if not unique_dates:
            return 0, 0
        
        today = datetime.utcnow().date()
        
        # Check if the most recent workout was today or yesterday
        most_recent = unique_dates[0]
        if (today - most_recent).days > 1:
            current_streak = 0
        else:
            current_streak = 1
            
            # Count consecutive days
            for i in range(1, len(unique_dates)):
                if (unique_dates[i-1] - unique_dates[i]).days == 1:
                    current_streak += 1
                else:
                    break
        
        # Calculate longest streak
        longest_streak = 1
        current_run = 1
        
        for i in range(1, len(unique_dates)):
            if (unique_dates[i-1] - unique_dates[i]).days == 1:
                current_run += 1
                longest_streak = max(longest_streak, current_run)
            else:
                current_run = 1
        
        return current_streak, longest_streak


# Export singleton-style access
user_service = UserService()
