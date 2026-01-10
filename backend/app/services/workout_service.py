"""Workout service for managing workout plans and days."""

from datetime import datetime

from google.cloud.firestore import FieldFilter

from app.models.workout import (
    Exercise,
    ExerciseCreate,
    ExerciseUpdate,
    WorkoutDay,
    WorkoutDayFull,
    WorkoutDayUpdate,
    WorkoutPlan,
    WorkoutPlanFull,
    WorkoutPlanUpdate,
    DAY_NAMES,
)
from app.services.firebase import get_firestore_client, get_user_subcollection
from app.seed.default_plan import get_default_workout_plan


class WorkoutService:
    """Service for workout plan operations."""
    
    def __init__(self, uid: str):
        """Initialize service with user ID."""
        self.uid = uid
        self.db = get_firestore_client()
    
    # =========================================================================
    # Workout Plan Operations
    # =========================================================================
    
    async def get_active_plan(self) -> WorkoutPlanFull | None:
        """Get the user's active workout plan with all days and exercises."""
        plans_ref = get_user_subcollection(self.uid, 'workoutPlans')
        
        # Find active plan
        query = plans_ref.where(filter=FieldFilter('isActive', '==', True)).limit(1)
        plans = list(query.stream())
        
        if not plans:
            return None
        
        plan_doc = plans[0]
        plan_data = plan_doc.to_dict()
        plan = WorkoutPlan(id=plan_doc.id, **self._convert_firestore_to_model(plan_data))
        
        # Get all days with exercises
        days = await self._get_plan_days(plan.id)
        
        return WorkoutPlanFull(**plan.model_dump(), days=days)
    
    async def get_or_create_default_plan(self) -> WorkoutPlanFull:
        """Get active plan or create the default plan if none exists."""
        plan = await self.get_active_plan()
        if plan:
            return plan
        
        # Create default plan
        return await self._seed_default_plan()
    
    async def update_plan(self, update: WorkoutPlanUpdate) -> WorkoutPlan:
        """Update the active workout plan metadata."""
        plan = await self.get_active_plan()
        if not plan:
            raise ValueError("No active workout plan found")
        
        plans_ref = get_user_subcollection(self.uid, 'workoutPlans')
        plan_ref = plans_ref.document(plan.id)
        
        update_data = {k: v for k, v in update.model_dump().items() if v is not None}
        update_data['updatedAt'] = datetime.utcnow()
        
        plan_ref.update(self._convert_model_to_firestore(update_data))
        
        # Fetch updated plan
        updated_doc = plan_ref.get()
        return WorkoutPlan(id=updated_doc.id, **self._convert_firestore_to_model(updated_doc.to_dict()))
    
    async def reset_plan_to_default(self) -> WorkoutPlanFull:
        """Reset the user's plan to the default knee-preservation program."""
        # Delete existing plans
        plans_ref = get_user_subcollection(self.uid, 'workoutPlans')
        for plan in plans_ref.stream():
            # Delete subcollections first
            days_ref = plans_ref.document(plan.id).collection('workoutDays')
            for day in days_ref.stream():
                # Delete exercises
                exercises_ref = days_ref.document(day.id).collection('exercises')
                for exercise in exercises_ref.stream():
                    exercise.reference.delete()
                day.reference.delete()
            plan.reference.delete()
        
        # Create fresh default plan
        return await self._seed_default_plan()
    
    # =========================================================================
    # Workout Day Operations
    # =========================================================================
    
    async def get_today_workout(self) -> WorkoutDayFull | None:
        """Get today's workout based on current day of week."""
        today = datetime.now()
        day_of_week = today.weekday()  # Monday = 0
        # Convert to our format (Sunday = 0)
        day_index = (day_of_week + 1) % 7
        day_id = DAY_NAMES[day_index]
        
        return await self.get_workout_day(day_id)
    
    async def get_workout_day(self, day_id: str) -> WorkoutDayFull | None:
        """Get a specific workout day with exercises."""
        plan = await self.get_or_create_default_plan()
        
        plans_ref = get_user_subcollection(self.uid, 'workoutPlans')
        day_ref = plans_ref.document(plan.id).collection('workoutDays').document(day_id)
        day_doc = day_ref.get()
        
        if not day_doc.exists:
            return None
        
        day_data = day_doc.to_dict()
        day = WorkoutDay(id=day_doc.id, **self._convert_firestore_to_model(day_data))
        
        # Get exercises
        exercises = await self._get_day_exercises(plan.id, day_id)
        
        return WorkoutDayFull(**day.model_dump(), exercises=exercises)
    
    async def update_workout_day(self, day_id: str, update: WorkoutDayUpdate) -> WorkoutDay:
        """Update a workout day."""
        plan = await self.get_active_plan()
        if not plan:
            raise ValueError("No active workout plan found")
        
        plans_ref = get_user_subcollection(self.uid, 'workoutPlans')
        day_ref = plans_ref.document(plan.id).collection('workoutDays').document(day_id)
        
        if not day_ref.get().exists:
            raise ValueError(f"Workout day '{day_id}' not found")
        
        update_data = {k: v for k, v in update.model_dump().items() if v is not None}
        day_ref.update(self._convert_model_to_firestore(update_data))
        
        updated_doc = day_ref.get()
        return WorkoutDay(id=updated_doc.id, **self._convert_firestore_to_model(updated_doc.to_dict()))
    
    # =========================================================================
    # Exercise Operations
    # =========================================================================
    
    async def get_exercises(self, day_id: str) -> list[Exercise]:
        """Get all exercises for a workout day."""
        plan = await self.get_active_plan()
        if not plan:
            return []
        
        return await self._get_day_exercises(plan.id, day_id)
    
    async def add_exercise(self, day_id: str, exercise: ExerciseCreate) -> Exercise:
        """Add a new exercise to a workout day."""
        plan = await self.get_active_plan()
        if not plan:
            raise ValueError("No active workout plan found")
        
        plans_ref = get_user_subcollection(self.uid, 'workoutPlans')
        exercises_ref = plans_ref.document(plan.id).collection('workoutDays').document(day_id).collection('exercises')
        
        # Get current max sort order
        existing = list(exercises_ref.order_by('sortOrder', direction='DESCENDING').limit(1).stream())
        max_order = existing[0].to_dict().get('sortOrder', -1) if existing else -1
        
        exercise_data = exercise.model_dump()
        exercise_data['sortOrder'] = max_order + 1
        
        doc_ref = exercises_ref.add(self._convert_model_to_firestore(exercise_data))
        
        return Exercise(id=doc_ref[1].id, sort_order=exercise_data['sortOrder'], **exercise.model_dump())
    
    async def update_exercise(self, day_id: str, exercise_id: str, update: ExerciseUpdate) -> Exercise:
        """Update an existing exercise."""
        plan = await self.get_active_plan()
        if not plan:
            raise ValueError("No active workout plan found")
        
        plans_ref = get_user_subcollection(self.uid, 'workoutPlans')
        exercise_ref = (
            plans_ref.document(plan.id)
            .collection('workoutDays').document(day_id)
            .collection('exercises').document(exercise_id)
        )
        
        if not exercise_ref.get().exists:
            raise ValueError(f"Exercise '{exercise_id}' not found")
        
        update_data = {k: v for k, v in update.model_dump().items() if v is not None}
        exercise_ref.update(self._convert_model_to_firestore(update_data))
        
        updated_doc = exercise_ref.get()
        return Exercise(id=updated_doc.id, **self._convert_firestore_to_model(updated_doc.to_dict()))
    
    async def delete_exercise(self, day_id: str, exercise_id: str) -> None:
        """Delete an exercise from a workout day."""
        plan = await self.get_active_plan()
        if not plan:
            raise ValueError("No active workout plan found")
        
        plans_ref = get_user_subcollection(self.uid, 'workoutPlans')
        exercise_ref = (
            plans_ref.document(plan.id)
            .collection('workoutDays').document(day_id)
            .collection('exercises').document(exercise_id)
        )
        
        if not exercise_ref.get().exists:
            raise ValueError(f"Exercise '{exercise_id}' not found")
        
        exercise_ref.delete()
    
    # =========================================================================
    # Helper Methods
    # =========================================================================
    
    async def _get_plan_days(self, plan_id: str) -> list[WorkoutDayFull]:
        """Get all days for a plan with exercises."""
        plans_ref = get_user_subcollection(self.uid, 'workoutPlans')
        days_ref = plans_ref.document(plan_id).collection('workoutDays')
        
        days = []
        for day_doc in days_ref.order_by('sortOrder').stream():
            day_data = day_doc.to_dict()
            day = WorkoutDay(id=day_doc.id, **self._convert_firestore_to_model(day_data))
            exercises = await self._get_day_exercises(plan_id, day_doc.id)
            days.append(WorkoutDayFull(**day.model_dump(), exercises=exercises))
        
        return days
    
    async def _get_day_exercises(self, plan_id: str, day_id: str) -> list[Exercise]:
        """Get all exercises for a specific day."""
        plans_ref = get_user_subcollection(self.uid, 'workoutPlans')
        exercises_ref = (
            plans_ref.document(plan_id)
            .collection('workoutDays').document(day_id)
            .collection('exercises')
        )
        
        exercises = []
        for ex_doc in exercises_ref.order_by('sortOrder').stream():
            ex_data = ex_doc.to_dict()
            exercises.append(Exercise(id=ex_doc.id, **self._convert_firestore_to_model(ex_data)))
        
        return exercises
    
    async def _seed_default_plan(self) -> WorkoutPlanFull:
        """Seed the default workout plan for a new user."""
        default_plan = get_default_workout_plan()
        
        plans_ref = get_user_subcollection(self.uid, 'workoutPlans')
        
        # Create plan document
        plan_data = {
            'name': default_plan['name'],
            'description': default_plan['description'],
            'isActive': True,
            'isDefault': True,
            'createdAt': datetime.utcnow(),
            'updatedAt': datetime.utcnow(),
        }
        _, plan_ref = plans_ref.add(plan_data)
        
        # Create days and exercises
        days_data = []
        for day in default_plan['days']:
            day_ref = plan_ref.collection('workoutDays').document(day['id'])
            day_doc = {
                'name': day['name'],
                'focus': day['focus'],
                'format': day.get('format'),
                'duration': day.get('duration'),
                'isRestDay': day.get('isRestDay', False),
                'dayOfWeek': day['dayOfWeek'],
                'sortOrder': day['sortOrder'],
            }
            day_ref.set(day_doc)
            
            exercises = []
            for i, ex in enumerate(day.get('exercises', [])):
                ex_data = {
                    'name': ex['name'],
                    'instructions': ex['instructions'],
                    'sets': ex.get('sets'),
                    'reps': ex.get('reps'),
                    'tempo': ex.get('tempo'),
                    'notes': ex.get('notes'),
                    'category': ex.get('category'),
                    'sortOrder': i,
                }
                _, ex_ref = day_ref.collection('exercises').add(ex_data)
                exercises.append(Exercise(id=ex_ref.id, **self._convert_firestore_to_model(ex_data)))
            
            days_data.append(WorkoutDayFull(
                id=day['id'],
                **self._convert_firestore_to_model(day_doc),
                exercises=exercises
            ))
        
        return WorkoutPlanFull(
            id=plan_ref.id,
            name=default_plan['name'],
            description=default_plan['description'],
            is_active=True,
            is_default=True,
            created_at=plan_data['createdAt'],
            updated_at=plan_data['updatedAt'],
            days=days_data,
        )
    
    @staticmethod
    def _convert_firestore_to_model(data: dict) -> dict:
        """Convert Firestore field names to model field names (camelCase to snake_case)."""
        conversions = {
            'isActive': 'is_active',
            'isDefault': 'is_default',
            'createdAt': 'created_at',
            'updatedAt': 'updated_at',
            'dayOfWeek': 'day_of_week',
            'sortOrder': 'sort_order',
            'isRestDay': 'is_rest_day',
        }
        result = {}
        for key, value in data.items():
            new_key = conversions.get(key, key)
            result[new_key] = value
        return result
    
    @staticmethod
    def _convert_model_to_firestore(data: dict) -> dict:
        """Convert model field names to Firestore field names (snake_case to camelCase)."""
        conversions = {
            'is_active': 'isActive',
            'is_default': 'isDefault',
            'created_at': 'createdAt',
            'updated_at': 'updatedAt',
            'day_of_week': 'dayOfWeek',
            'sort_order': 'sortOrder',
            'is_rest_day': 'isRestDay',
        }
        result = {}
        for key, value in data.items():
            new_key = conversions.get(key, key)
            result[new_key] = value
        return result
