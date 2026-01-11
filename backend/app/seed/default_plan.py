"""Default knee-preservation workout plan seed data.

Based on workoutplan-guide.md - the structured workout program for knee preservation.
"""

from datetime import datetime
from typing import Optional
import uuid


async def create_default_workout_plan(uid: str) -> str:
    """Create the default workout plan for a new user.
    
    Args:
        uid: The Firebase user UID
        
    Returns:
        The ID of the created workout plan
    """
    from app.services.firebase import get_db
    
    db = get_db()
    plan_data = get_default_workout_plan()
    plan_id = str(uuid.uuid4())
    
    # Add metadata
    plan_data['id'] = plan_id
    plan_data['userId'] = uid
    plan_data['createdAt'] = datetime.utcnow()
    plan_data['updatedAt'] = datetime.utcnow()
    plan_data['isDefault'] = True
    
    # Store in Firestore
    db.collection('users').document(uid).collection('workoutPlans').document(plan_id).set(plan_data)
    
    return plan_id


def get_default_workout_plan() -> dict:
    """Return the default knee-preservation workout plan data."""
    return {
        "name": "Knee-Preservation Program",
        "description": "A comprehensive 7-day workout program designed for muscle building while protecting knee joints. Features hypertrophy training, low-impact cardio, and strategic recovery days.",
        "days": [
            # Sunday - Rest Day
            {
                "id": "sunday",
                "dayOfWeek": 0,
                "name": "Full Rest",
                "focus": "Recovery & Regeneration",
                "format": None,
                "duration": None,
                "isRestDay": True,
                "sortOrder": 0,
                "exercises": [],
            },
            # Monday - Chest & Triceps (Push) + Abs
            {
                "id": "monday",
                "dayOfWeek": 1,
                "name": "Chest & Triceps (Push) + Abs",
                "focus": "Hypertrophy (Muscle Growth)",
                "format": "Circuit: 3 rounds, 45 seconds work, 15 seconds rest",
                "duration": 35,
                "isRestDay": False,
                "sortOrder": 1,
                "exercises": [
                    {
                        "name": "Push-ups (Slow Tempo)",
                        "instructions": "3 seconds down, 1 second up. If too easy, elevate your feet on a chair. Focus on controlled movement throughout.",
                        "sets": 3,
                        "reps": "45 seconds",
                        "tempo": "3 seconds down, 1 second up",
                        "category": "Push",
                    },
                    {
                        "name": "Diamond Push-ups",
                        "instructions": "Hands close together forming a diamond shape. Keep elbows close to body. Focus on triceps engagement.",
                        "sets": 3,
                        "reps": "45 seconds",
                        "category": "Push",
                    },
                    {
                        "name": "Tricep Dips (Chair/Bench)",
                        "instructions": "Use a sturdy chair or bench. Keep elbows pointing back, not flaring out. Lower until arms are at 90 degrees.",
                        "sets": 3,
                        "reps": "45 seconds",
                        "category": "Push",
                    },
                    {
                        "name": "Incline Push-ups",
                        "instructions": "Hands on elevated surface (bench, stairs). Great for targeting upper chest. Keep core tight.",
                        "sets": 3,
                        "reps": "45 seconds",
                        "category": "Push",
                    },
                    {
                        "name": "Plank Hold",
                        "instructions": "Maintain straight line from head to heels. Engage core by drawing belly button toward spine. Don't let hips sag.",
                        "sets": 3,
                        "reps": "45 seconds",
                        "category": "Core",
                    },
                    {
                        "name": "Dead Bug",
                        "instructions": "Lie on back with arms extended up. Lower opposite arm and leg while keeping lower back pressed to floor.",
                        "sets": 3,
                        "reps": "45 seconds",
                        "category": "Core",
                    },
                ],
            },
            # Tuesday - Back & Biceps (Pull)
            {
                "id": "tuesday",
                "dayOfWeek": 2,
                "name": "Back & Biceps (Pull)",
                "focus": "Hypertrophy (Muscle Growth)",
                "format": "Circuit: 3 rounds, 45 seconds work, 15 seconds rest",
                "duration": 35,
                "isRestDay": False,
                "sortOrder": 2,
                "exercises": [
                    {
                        "name": "Inverted Rows (Table/Bar)",
                        "instructions": "Use sturdy table or bar. Pull chest to the bar, squeezing shoulder blades together. Keep body straight.",
                        "sets": 3,
                        "reps": "45 seconds",
                        "category": "Pull",
                    },
                    {
                        "name": "Superman Hold",
                        "instructions": "Lie face down, lift arms and legs off ground simultaneously. Squeeze glutes and lower back. Hold position.",
                        "sets": 3,
                        "reps": "45 seconds",
                        "category": "Pull",
                    },
                    {
                        "name": "Resistance Band Rows",
                        "instructions": "Anchor band at mid-height. Pull elbows back, squeezing shoulder blades. Control the return.",
                        "sets": 3,
                        "reps": "45 seconds",
                        "notes": "Use door anchor or wrap around sturdy post",
                        "category": "Pull",
                    },
                    {
                        "name": "Bicep Curls (Band/Dumbbells)",
                        "instructions": "Keep elbows pinned to sides. Full range of motion - fully extend and fully contract. Slow tempo.",
                        "sets": 3,
                        "reps": "45 seconds",
                        "tempo": "2 seconds up, 2 seconds down",
                        "category": "Pull",
                    },
                    {
                        "name": "Reverse Snow Angels",
                        "instructions": "Lie face down, arms at sides. Lift arms and sweep overhead while keeping them elevated. Great for posture.",
                        "sets": 3,
                        "reps": "45 seconds",
                        "category": "Pull",
                    },
                    {
                        "name": "Isometric Bicep Hold",
                        "instructions": "Hold bicep curl at 90 degrees. Maintain tension throughout. Switch arms if needed.",
                        "sets": 3,
                        "reps": "45 seconds",
                        "category": "Pull",
                    },
                ],
            },
            # Wednesday - Low Impact Cardio
            {
                "id": "wednesday",
                "dayOfWeek": 3,
                "name": "Low Impact Cardio & Core",
                "focus": "Cardiovascular Health (Knee-Friendly)",
                "format": "Steady state or intervals",
                "duration": 30,
                "isRestDay": False,
                "sortOrder": 3,
                "exercises": [
                    {
                        "name": "Stationary Bike / Elliptical",
                        "instructions": "20-30 minutes at moderate intensity. Keep resistance low to moderate. Focus on smooth, circular motion.",
                        "reps": "20-30 minutes",
                        "notes": "Heart rate zone 2-3 (60-75% max HR)",
                        "category": "Cardio",
                    },
                    {
                        "name": "Swimming (Optional)",
                        "instructions": "If pool available, swim laps or do water walking. Zero impact on joints.",
                        "reps": "20-30 minutes",
                        "category": "Cardio",
                    },
                    {
                        "name": "Seated Core: Russian Twists",
                        "instructions": "Sit with knees bent, lean back slightly. Rotate torso side to side. Add weight for challenge.",
                        "sets": 3,
                        "reps": "45 seconds",
                        "category": "Core",
                    },
                    {
                        "name": "Bird Dog",
                        "instructions": "On hands and knees, extend opposite arm and leg. Keep hips level. Alternate sides.",
                        "sets": 3,
                        "reps": "45 seconds",
                        "category": "Core",
                    },
                ],
            },
            # Thursday - Shoulders & Arms
            {
                "id": "thursday",
                "dayOfWeek": 4,
                "name": "Shoulders & Arms",
                "focus": "Hypertrophy (Muscle Growth)",
                "format": "Circuit: 3 rounds, 45 seconds work, 15 seconds rest",
                "duration": 35,
                "isRestDay": False,
                "sortOrder": 4,
                "exercises": [
                    {
                        "name": "Pike Push-ups",
                        "instructions": "Hips high in inverted V position. Lower head toward ground between hands. Great shoulder builder.",
                        "sets": 3,
                        "reps": "45 seconds",
                        "category": "Shoulders",
                    },
                    {
                        "name": "Lateral Raises (Band/Dumbbells)",
                        "instructions": "Raise arms to sides until parallel with ground. Control the descent. Slight bend in elbows.",
                        "sets": 3,
                        "reps": "45 seconds",
                        "category": "Shoulders",
                    },
                    {
                        "name": "Front Raises (Alternating)",
                        "instructions": "Raise arms straight in front to shoulder height. Alternate arms. Keep core engaged.",
                        "sets": 3,
                        "reps": "45 seconds",
                        "category": "Shoulders",
                    },
                    {
                        "name": "Tricep Kickbacks",
                        "instructions": "Hinge at hips, elbows at 90 degrees. Extend arm back, squeezing tricep. Control the return.",
                        "sets": 3,
                        "reps": "45 seconds",
                        "category": "Arms",
                    },
                    {
                        "name": "Hammer Curls",
                        "instructions": "Palms facing each other throughout. Targets brachialis and forearms. Full range of motion.",
                        "sets": 3,
                        "reps": "45 seconds",
                        "category": "Arms",
                    },
                    {
                        "name": "Plank Shoulder Taps",
                        "instructions": "In plank position, tap opposite shoulder with each hand. Minimize hip rotation.",
                        "sets": 3,
                        "reps": "45 seconds",
                        "category": "Core",
                    },
                ],
            },
            # Friday - Full Body MetCon
            {
                "id": "friday",
                "dayOfWeek": 5,
                "name": "Full Body MetCon",
                "focus": "Metabolic Conditioning (Low Impact)",
                "format": "AMRAP or timed circuits",
                "duration": 30,
                "isRestDay": False,
                "sortOrder": 5,
                "exercises": [
                    {
                        "name": "Inchworms",
                        "instructions": "Stand, walk hands out to plank, walk back to standing. Keep legs as straight as possible.",
                        "sets": 3,
                        "reps": "45 seconds",
                        "category": "Full Body",
                    },
                    {
                        "name": "Mountain Climbers (Slow)",
                        "instructions": "From plank, bring knees toward chest alternately. Keep hips low and controlled pace.",
                        "sets": 3,
                        "reps": "45 seconds",
                        "notes": "Modify: step instead of hop if needed for knees",
                        "category": "Cardio",
                    },
                    {
                        "name": "Bear Crawls",
                        "instructions": "On hands and feet, knees hovering. Move forward/backward keeping hips low. Great full-body burn.",
                        "sets": 3,
                        "reps": "45 seconds",
                        "category": "Full Body",
                    },
                    {
                        "name": "Glute Bridges",
                        "instructions": "Lie on back, feet flat. Drive hips up squeezing glutes at top. Pause and lower with control.",
                        "sets": 3,
                        "reps": "45 seconds",
                        "category": "Lower",
                    },
                    {
                        "name": "Side Plank (Each Side)",
                        "instructions": "Stack feet or stagger for stability. Keep hips lifted. 45 seconds each side.",
                        "sets": 3,
                        "reps": "45 seconds each side",
                        "category": "Core",
                    },
                    {
                        "name": "Seated Leg Extensions",
                        "instructions": "Sit on chair, extend legs straight out. Hold briefly, lower with control. Strengthens quads safely.",
                        "sets": 3,
                        "reps": "45 seconds",
                        "notes": "Great for knee rehab - controlled movement",
                        "category": "Lower",
                    },
                ],
            },
            # Saturday - Active Recovery
            {
                "id": "saturday",
                "dayOfWeek": 6,
                "name": "Active Recovery",
                "focus": "Mobility & Flexibility",
                "format": "Gentle stretching and mobility work",
                "duration": 25,
                "isRestDay": True,
                "sortOrder": 6,
                "exercises": [
                    {
                        "name": "Quad Stretch (Standing/Lying)",
                        "instructions": "Hold foot behind you, pull heel toward glutes. Keep knees together. Hold 60 seconds each side.",
                        "reps": "60 seconds each side",
                        "category": "Stretch",
                    },
                    {
                        "name": "Hamstring Stretch",
                        "instructions": "Seated or standing. Keep back straight, hinge at hips. Feel stretch in back of thigh.",
                        "reps": "60 seconds each side",
                        "category": "Stretch",
                    },
                    {
                        "name": "Hip Flexor Stretch",
                        "instructions": "Kneeling lunge position. Push hips forward gently. Keep torso upright.",
                        "reps": "60 seconds each side",
                        "category": "Stretch",
                    },
                    {
                        "name": "Pigeon Pose",
                        "instructions": "Front leg bent, back leg extended. Fold forward over front leg. Deep hip opener.",
                        "reps": "60 seconds each side",
                        "category": "Stretch",
                    },
                    {
                        "name": "Cat-Cow Stretches",
                        "instructions": "On hands and knees. Alternate arching and rounding spine. Move slowly with breath.",
                        "reps": "10 cycles",
                        "category": "Mobility",
                    },
                    {
                        "name": "Foam Rolling (Optional)",
                        "instructions": "Roll quads, hamstrings, IT band, and calves. Spend extra time on tight spots.",
                        "reps": "5-10 minutes",
                        "category": "Recovery",
                    },
                ],
            },
        ],
    }
