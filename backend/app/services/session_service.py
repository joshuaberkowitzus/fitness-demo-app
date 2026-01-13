"""Session service for managing workout sessions and exercise completions."""

from datetime import datetime

from google.cloud.firestore import FieldFilter

from app.models.session import (
    ExerciseCompletion,
    ExerciseCompletionCreate,
    SessionCreate,
    SessionUpdate,
    WorkoutSession,
    WorkoutSessionFull,
)
from app.services.firebase import get_firestore_client, get_user_subcollection
from app.services.workout_service import WorkoutService


class SessionService:
    """Service for workout session operations."""
    
    def __init__(self, uid: str):
        """Initialize service with user ID."""
        self.uid = uid
        self.db = get_firestore_client()
        self.workout_service = WorkoutService(uid)
    
    # =========================================================================
    # Session Operations
    # =========================================================================
    
    async def start_session(self, create: SessionCreate) -> WorkoutSession:
        """Start a new workout session."""
        # Check if there's already an in-progress session
        current = await self.get_current_session()
        if current:
            raise ValueError("A workout session is already in progress")
        
        # Get workout day info
        workout_day = await self.workout_service.get_workout_day(create.workout_day_id)
        if not workout_day:
            raise ValueError(f"Workout day '{create.workout_day_id}' not found")
        
        # Get active plan
        plan = await self.workout_service.get_active_plan()
        if not plan:
            raise ValueError("No active workout plan found")
        
        now = datetime.utcnow()
        session_data = {
            'date': now.strftime('%Y-%m-%d'),
            'workoutPlanId': plan.id,
            'workoutDayId': create.workout_day_id,
            'workoutDayName': workout_day.name,
            'startedAt': now,
            'completedAt': None,
            'status': 'in_progress',
            'warmupCompleted': create.warmup_completed,
            'notes': None,
            'healthMetrics': None,
            'syncedAt': now,
        }
        
        sessions_ref = get_user_subcollection(self.uid, 'workoutSessions')
        _, session_ref = sessions_ref.add(session_data)
        
        return WorkoutSession(
            id=session_ref.id,
            date=session_data['date'],
            workout_plan_id=session_data['workoutPlanId'],
            workout_day_id=session_data['workoutDayId'],
            workout_day_name=session_data['workoutDayName'],
            started_at=session_data['startedAt'],
            completed_at=None,
            status='in_progress',
            warmup_completed=session_data['warmupCompleted'],
            notes=None,
            health_metrics=None,
            synced_at=session_data['syncedAt'],
        )
    
    async def get_current_session(self) -> WorkoutSessionFull | None:
        """Get the current in-progress session with completions."""
        sessions_ref = get_user_subcollection(self.uid, 'workoutSessions')
        query = sessions_ref.where(filter=FieldFilter('status', '==', 'in_progress')).limit(1)
        sessions = list(query.stream())
        
        if not sessions:
            return None
        
        session_doc = sessions[0]
        return await self._build_session_full(session_doc)
    
    async def get_session(self, session_id: str) -> WorkoutSessionFull | None:
        """Get a specific session with completions."""
        sessions_ref = get_user_subcollection(self.uid, 'workoutSessions')
        session_doc = sessions_ref.document(session_id).get()
        
        if not session_doc.exists:
            return None
        
        return await self._build_session_full(session_doc)
    
    async def update_session(self, session_id: str, update: SessionUpdate) -> WorkoutSession:
        """Update a session (complete, cancel, add notes)."""
        sessions_ref = get_user_subcollection(self.uid, 'workoutSessions')
        session_ref = sessions_ref.document(session_id)
        session_doc = session_ref.get()
        
        if not session_doc.exists:
            raise ValueError(f"Session '{session_id}' not found")
        
        update_data = {}
        session_data = session_doc.to_dict()
        
        if update.status is not None:
            update_data['status'] = update.status
            if update.status == 'completed':
                update_data['completedAt'] = datetime.utcnow()
                
                # Fetch health metrics on completion (T078)
                health_metrics = await self._fetch_session_health_metrics(session_data)
                if health_metrics:
                    update_data['healthMetrics'] = health_metrics
        
        if update.notes is not None:
            update_data['notes'] = update.notes
        
        if update.warmup_completed is not None:
            update_data['warmupCompleted'] = update.warmup_completed
        
        update_data['syncedAt'] = datetime.utcnow()
        
        session_ref.update(update_data)
        
        updated_doc = session_ref.get()
        data = updated_doc.to_dict()
        
        return WorkoutSession(
            id=updated_doc.id,
            **self._convert_firestore_to_model(data)
        )
    
    async def _fetch_session_health_metrics(self, session_data: dict) -> dict | None:
        """Fetch health metrics from Google Fit for a completed session (T078).
        
        Args:
            session_data: The session data containing start time
            
        Returns:
            Health metrics dict or None if unavailable
        """
        try:
            from app.services.google_fit import GoogleFitService
            
            google_fit = GoogleFitService(self.uid)
            status = await google_fit.get_status()
            
            if not status.connected:
                return None
            
            start_time = session_data.get('startedAt')
            end_time = datetime.utcnow()
            
            if not start_time:
                return None
            
            metrics = await google_fit.get_health_metrics(start_time, end_time)
            
            if not metrics.has_data:
                return None
            
            return {
                'heartRateAvg': metrics.heart_rate_avg,
                'heartRateMax': metrics.heart_rate_max,
                'heartRateMin': metrics.heart_rate_min,
                'caloriesBurned': metrics.calories_burned,
                'steps': metrics.steps,
                'activeMinutes': metrics.active_minutes,
            }
        except Exception as e:
            print(f"Failed to fetch health metrics: {e}")
            return None
    
    async def list_sessions(
        self,
        limit: int = 20,
        offset: int = 0,
        status: str | None = None
    ) -> tuple[list[WorkoutSession], int]:
        """List sessions with pagination."""
        sessions_ref = get_user_subcollection(self.uid, 'workoutSessions')
        
        # Build query
        query = sessions_ref.order_by('startedAt', direction='DESCENDING')
        
        if status:
            query = query.where(filter=FieldFilter('status', '==', status))
        
        # Get total count (inefficient but Firestore doesn't have count)
        all_sessions = list(query.stream())
        total = len(all_sessions)
        
        # Apply pagination
        sessions = all_sessions[offset:offset + limit]
        
        result = []
        for session_doc in sessions:
            data = session_doc.to_dict()
            result.append(WorkoutSession(
                id=session_doc.id,
                **self._convert_firestore_to_model(data)
            ))
        
        return result, total
    
    # =========================================================================
    # Exercise Completion Operations
    # =========================================================================
    
    async def complete_exercise(
        self,
        session_id: str,
        exercise_id: str,
        completion: ExerciseCompletionCreate | None = None
    ) -> ExerciseCompletion:
        """Mark an exercise as complete."""
        sessions_ref = get_user_subcollection(self.uid, 'workoutSessions')
        session_ref = sessions_ref.document(session_id)
        
        if not session_ref.get().exists:
            raise ValueError(f"Session '{session_id}' not found")
        
        # Check if already completed
        completions_ref = session_ref.collection('exerciseCompletions')
        existing = completions_ref.document(exercise_id).get()
        if existing.exists:
            raise ValueError(f"Exercise '{exercise_id}' already completed")
        
        # Get exercise name from workout
        session_data = session_ref.get().to_dict()
        workout_day = await self.workout_service.get_workout_day(session_data['workoutDayId'])
        exercise = next((e for e in workout_day.exercises if e.id == exercise_id), None) if workout_day else None
        exercise_name = exercise.name if exercise else f"Exercise {exercise_id}"
        
        now = datetime.utcnow()
        completion_data = {
            'exerciseName': exercise_name,
            'completedAt': now,
            'setsCompleted': completion.sets_completed if completion else None,
            'repsCompleted': completion.reps_completed if completion else None,
            'weight': completion.weight if completion else None,
            'notes': completion.notes if completion else None,
            'skipped': False,
            'skipReason': None,
        }
        
        completions_ref.document(exercise_id).set(completion_data)
        
        return ExerciseCompletion(
            id=exercise_id,
            exercise_id=exercise_id,
            exercise_name=exercise_name,
            completed_at=now,
            sets_completed=completion_data['setsCompleted'],
            reps_completed=completion_data['repsCompleted'],
            weight=completion_data['weight'],
            notes=completion_data['notes'],
            skipped=False,
            skip_reason=None,
        )
    
    async def undo_exercise_completion(self, session_id: str, exercise_id: str) -> None:
        """Undo an exercise completion."""
        sessions_ref = get_user_subcollection(self.uid, 'workoutSessions')
        session_ref = sessions_ref.document(session_id)
        
        if not session_ref.get().exists:
            raise ValueError(f"Session '{session_id}' not found")
        
        completion_ref = session_ref.collection('exerciseCompletions').document(exercise_id)
        
        if not completion_ref.get().exists:
            raise ValueError(f"Exercise '{exercise_id}' completion not found")
        
        completion_ref.delete()
    
    # =========================================================================
    # Helper Methods
    # =========================================================================
    
    async def _build_session_full(self, session_doc) -> WorkoutSessionFull:
        """Build a full session object with completions."""
        data = session_doc.to_dict()
        
        # Get completions
        completions_ref = session_doc.reference.collection('exerciseCompletions')
        completions = []
        for comp_doc in completions_ref.stream():
            comp_data = comp_doc.to_dict()
            completions.append(ExerciseCompletion(
                id=comp_doc.id,
                exercise_id=comp_doc.id,
                exercise_name=comp_data.get('exerciseName', ''),
                completed_at=comp_data.get('completedAt'),
                sets_completed=comp_data.get('setsCompleted'),
                reps_completed=comp_data.get('repsCompleted'),
                weight=comp_data.get('weight'),
                notes=comp_data.get('notes'),
                skipped=comp_data.get('skipped', False),
                skip_reason=comp_data.get('skipReason'),
            ))
        
        return WorkoutSessionFull(
            id=session_doc.id,
            **self._convert_firestore_to_model(data),
            exercise_completions=completions,
        )
    
    @staticmethod
    def _convert_firestore_to_model(data: dict) -> dict:
        """Convert Firestore field names to model field names."""
        conversions = {
            'workoutPlanId': 'workout_plan_id',
            'workoutDayId': 'workout_day_id',
            'workoutDayName': 'workout_day_name',
            'startedAt': 'started_at',
            'completedAt': 'completed_at',
            'warmupCompleted': 'warmup_completed',
            'healthMetrics': 'health_metrics',
            'syncedAt': 'synced_at',
        }
        result = {}
        for key, value in data.items():
            new_key = conversions.get(key, key)
            result[new_key] = value
        return result
