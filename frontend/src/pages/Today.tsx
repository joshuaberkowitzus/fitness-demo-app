/**
 * Today's Workout Page - MVP Core Feature
 * 
 * Shows the current day's workout with exercises that can be marked complete.
 */

import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Button, LoadingSpinner } from '../components/common';
import { WorkoutHeader, WorkoutProgress, WorkoutFormatBanner } from '../components/workout';
import { ExerciseCard, ExerciseDetail } from '../components/exercise';
import { HealthMetricsCard } from '../components/health';
import { useTodayWorkout } from '../hooks/useWorkout';
import { useCurrentSession, useStartSession, useCompleteExercise, useUndoExerciseCompletion, useCompleteSession } from '../hooks/useSession';
import type { Exercise } from '../types';

export default function Today() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: workout, isLoading: workoutLoading, error: workoutError } = useTodayWorkout();
  const { data: session, isLoading: sessionLoading } = useCurrentSession();
  const startSession = useStartSession();
  const completeExercise = useCompleteExercise();
  const undoCompletion = useUndoExerciseCompletion();
  const completeSession = useCompleteSession();
  
  // Track optimistic updates for immediate UI feedback
  const [optimisticCompletions, setOptimisticCompletions] = useState<Set<string>>(new Set());
  
  // Exercise detail modal state
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  
  // Warmup prompt state
  const [showWarmupPrompt, setShowWarmupPrompt] = useState(false);
  const [warmupDismissed, setWarmupDismissed] = useState(false);

  // Handle warmup return from WarmupRoutine page
  useEffect(() => {
    const state = location.state as { warmupCompleted?: boolean; warmupSkipped?: boolean } | null;
    if (state?.warmupCompleted || state?.warmupSkipped) {
      setWarmupDismissed(true);
      // Clear the location state
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, navigate, location.pathname]);
  
  // Compute completed exercises from session + optimistic updates
  const completedExerciseIds = useMemo(() => {
    const ids = new Set<string>();
    session?.exerciseCompletions?.forEach((c) => ids.add(c.exerciseId));
    optimisticCompletions.forEach((id) => ids.add(id));
    return ids;
  }, [session?.exerciseCompletions, optimisticCompletions]);
  
  const completedCount = completedExerciseIds.size;
  const totalCount = workout?.exercises?.length || 0;
  
  // Loading state
  if (workoutLoading || sessionLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  // Error state
  if (workoutError) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Card className="text-center py-8">
          <p className="text-fitness-error mb-4">Failed to load today's workout</p>
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Card>
      </div>
    );
  }
  
  // Rest day or no workout
  if (!workout || workout.isRestDay) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <header className="mb-6">
            <p className="text-text-secondary text-sm">
              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()]}
            </p>
            <h1 className="text-2xl font-bold text-text-primary">Rest Day</h1>
          </header>
          
          <Card className="text-center py-12">
            <motion.span
              className="text-6xl mb-4 block"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🧘
            </motion.span>
            <h2 className="text-xl font-semibold text-text-primary mb-2">
              {workout?.name || 'Recovery Day'}
            </h2>
            <p className="text-text-secondary">
              {workout?.focus || 'Take it easy today. Your muscles need time to recover and grow.'}
            </p>
          </Card>
        </motion.div>
        
        <BottomNav />
        <div className="h-20" />
      </div>
    );
  }
  
  // Handle exercise toggle
  const handleExerciseToggle = async (exercise: Exercise) => {
    // Show warmup prompt if no session yet and warmup not dismissed
    if (!session && !warmupDismissed && !showWarmupPrompt) {
      setShowWarmupPrompt(true);
      return;
    }

    if (!session) {
      // Start a new session first
      try {
        const warmupCompleted = (location.state as { warmupCompleted?: boolean } | null)?.warmupCompleted || false;
        const newSession = await startSession.mutateAsync({
          workoutDayId: workout.id,
          warmupCompleted,
        });
        
        // Complete the exercise
        setOptimisticCompletions((prev) => new Set([...prev, exercise.id]));
        await completeExercise.mutateAsync({
          sessionId: newSession.id,
          exerciseId: exercise.id,
        });
        setOptimisticCompletions((prev) => {
          const next = new Set(prev);
          next.delete(exercise.id);
          return next;
        });
      } catch (error) {
        console.error('Failed to start session:', error);
      }
      return;
    }
    
    const isCompleted = completedExerciseIds.has(exercise.id);
    
    if (isCompleted) {
      // Undo completion
      try {
        await undoCompletion.mutateAsync({
          sessionId: session.id,
          exerciseId: exercise.id,
        });
      } catch (error) {
        console.error('Failed to undo completion:', error);
      }
    } else {
      // Mark complete with optimistic update
      setOptimisticCompletions((prev) => new Set([...prev, exercise.id]));
      try {
        await completeExercise.mutateAsync({
          sessionId: session.id,
          exerciseId: exercise.id,
        });
      } catch (error) {
        console.error('Failed to complete exercise:', error);
      } finally {
        setOptimisticCompletions((prev) => {
          const next = new Set(prev);
          next.delete(exercise.id);
          return next;
        });
      }
    }
  };
  
  // Handle workout completion
  const handleCompleteWorkout = async () => {
    if (!session) return;
    
    try {
      await completeSession.mutateAsync(session.id);
    } catch (error) {
      console.error('Failed to complete workout:', error);
    }
  };
  
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header with day name, focus, and badges */}
      <WorkoutHeader workout={workout} />
      
      {/* Progress bar showing completion status */}
      <WorkoutProgress
        completed={completedCount}
        total={totalCount}
        className="mb-6"
      />
      
      {/* Health Metrics Display (T082) */}
      {session && (
        <div className="mb-6">
          <HealthMetricsCard
            metrics={session.healthMetrics}
            showConnectPrompt={session.status === 'completed' && !session.healthMetrics}
            onConnect={() => navigate('/settings')}
          />
        </div>
      )}
      
      {/* Format instructions banner (e.g., "3 rounds circuit") */}
      {workout.format && (
        <div className="mb-6">
          <WorkoutFormatBanner format={workout.format} />
        </div>
      )}

      {/* Warmup Prompt (T102) - Show before first exercise if no session */}
      <AnimatePresence>
        {showWarmupPrompt && !session && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="border-fitness-primary/30 bg-fitness-primary/5">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🦵</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-text-primary mb-1">
                    Start with a Warmup?
                  </h3>
                  <p className="text-sm text-text-secondary mb-3">
                    The Knee Shield warmup takes ~5 min and helps protect your joints during today's workout.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        navigate('/warmup', {
                          state: { workoutDayId: workout.id, returnTo: '/today' },
                        });
                      }}
                    >
                      Do Warmup
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setShowWarmupPrompt(false);
                        setWarmupDismissed(true);
                      }}
                    >
                      Skip
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Warmup Status Badge - Show if warmup was completed */}
      {session?.warmupCompleted && (
        <motion.div
          className="mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-fitness-success/20 text-fitness-success text-sm rounded-full">
            ✓ Warmup completed
          </span>
        </motion.div>
      )}
      
      {/* Exercise List with animations */}
      <motion.div className="space-y-3" layout>
        <AnimatePresence mode="popLayout">
          {workout.exercises?.map((exercise, index) => {
            const isCompleted = completedExerciseIds.has(exercise.id);
            const isPending = optimisticCompletions.has(exercise.id);
            
            return (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                index={index}
                isCompleted={isCompleted}
                isPending={isPending}
                onToggle={() => handleExerciseToggle(exercise)}
                onShowDetails={() => setSelectedExercise(exercise)}
                disabled={completeExercise.isPending || undoCompletion.isPending}
              />
            );
          })}
        </AnimatePresence>
      </motion.div>
      
      {/* Exercise Detail Modal */}
      <ExerciseDetail
        exercise={selectedExercise}
        isCompleted={selectedExercise ? completedExerciseIds.has(selectedExercise.id) : false}
        onClose={() => setSelectedExercise(null)}
        onToggleComplete={() => {
          if (selectedExercise) {
            handleExerciseToggle(selectedExercise);
          }
        }}
      />
      
      {/* Complete Workout Button */}
      {completedCount === totalCount && totalCount > 0 && session && (
        <div className="mt-6">
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleCompleteWorkout}
            disabled={completeSession.isPending}
          >
            {completeSession.isPending ? (
              <LoadingSpinner size="sm" />
            ) : (
              '🎉 Complete Workout'
            )}
          </Button>
        </div>
      )}
      
      <BottomNav />
      <div className="h-20" />
    </div>
  );
}

function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background-card border-t border-gray-800 px-4 py-3">
      <div className="max-w-2xl mx-auto flex justify-around">
        <NavLink to="/today" icon="🏋️" label="Today" />
        <NavLink to="/plan" icon="📋" label="Plan" />
        <NavLink to="/history" icon="📊" label="History" />
        <NavLink to="/settings" icon="⚙️" label="Settings" />
      </div>
    </nav>
  );
}

function NavLink({ to, icon, label }: { to: string; icon: string; label: string }) {
  const isActive = window.location.pathname === to;
  
  return (
    <Link
      to={to}
      className={`flex flex-col items-center gap-1 px-4 py-1 rounded-lg transition-colors ${
        isActive ? 'text-fitness-primary' : 'text-text-muted hover:text-text-secondary'
      }`}
    >
      <span className="text-xl">{icon}</span>
      <span className="text-xs">{label}</span>
    </Link>
  );
}
