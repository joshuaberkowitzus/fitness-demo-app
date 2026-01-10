"""Knee-shield warmup routine seed data.

Based on the warmup-guide.md from the fitness tracker specification.
This is the Dr. Aaron Horschig knee-shield warmup routine.
"""

from app.models.warmup import WarmupMovement, WarmupRoutine


def get_default_warmup_routine() -> WarmupRoutine:
    """Get the default knee-shield warmup routine.
    
    Returns:
        WarmupRoutine with the 6-movement knee protection sequence
    """
    movements = [
        WarmupMovement(
            name="Tibialis Raises",
            instructions="Stand with back against wall, feet 6-8 inches away. "
                        "Raise toes toward shins, keeping heels on ground. "
                        "Hold briefly at top, lower with control. "
                        "Focus on the front of your shins engaging.",
            duration="15-20 reps",
            purpose="Strengthens tibialis anterior muscle to balance calf strength and protect knee alignment",
            sort_order=0,
        ),
        WarmupMovement(
            name="FHL (Flexor Hallucis Longus) Calf Raises",
            instructions="Stand on edge of step or elevated surface. "
                        "Lower heels below step level, then raise up onto toes. "
                        "At the top, emphasize pushing through big toe. "
                        "Hold 1-2 seconds at peak contraction.",
            duration="15-20 reps",
            purpose="Activates deep calf muscle that supports arch and knee stability during squatting movements",
            sort_order=1,
        ),
        WarmupMovement(
            name="Single Leg Romanian Deadlift (RDL)",
            instructions="Stand on one leg with slight knee bend. "
                        "Hinge at hips, extending opposite leg behind for balance. "
                        "Keep back flat, reach toward ground with hands. "
                        "Feel hamstring stretch on standing leg. Return to start.",
            duration="8-10 reps each leg",
            purpose="Activates posterior chain (hamstrings, glutes) to counterbalance quad dominance and protect ACL",
            sort_order=2,
        ),
        WarmupMovement(
            name="Single Leg Glute Bridge",
            instructions="Lie on back, one foot flat on floor, other leg extended. "
                        "Drive through heel to lift hips off ground. "
                        "Squeeze glute at top, hold 2 seconds. "
                        "Lower with control. Keep core engaged throughout.",
            duration="10-12 reps each leg",
            purpose="Isolates gluteus maximus for hip stability and proper knee tracking during leg exercises",
            sort_order=3,
        ),
        WarmupMovement(
            name="Hip Airplane",
            instructions="Stand on one leg, hinge forward at hips (like RDL position). "
                        "Rotate torso and hips to open toward ceiling, then rotate closed. "
                        "Keep standing leg stable, move slowly and controlled. "
                        "Feel hip muscles working to maintain balance.",
            duration="6-8 reps each leg",
            purpose="Activates hip external rotators (gluteus medius) for lateral knee stability",
            sort_order=4,
        ),
        WarmupMovement(
            name="ATG Split Squat",
            instructions="Take a lunge position with back knee on ground or pad. "
                        "Shift weight forward, driving front knee past toes. "
                        "Keep heel down, feel stretch in back hip flexor. "
                        "Push through front foot to return. Go as deep as comfortable.",
            duration="8-10 reps each leg",
            purpose="Builds strength through full knee range of motion while stretching hip flexors",
            sort_order=5,
        ),
    ]
    
    return WarmupRoutine(
        id="knee-shield-warmup",
        name="Knee Shield Warmup",
        description="Dr. Aaron Horschig's 6-movement sequence designed to bulletproof your knees. "
                   "This routine activates key stabilizers, improves mobility, and prepares your "
                   "lower body for intense training. Complete before every leg workout.",
        duration=5,
        movements=movements,
    )
