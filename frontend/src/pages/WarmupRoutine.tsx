/**
 * Warmup Routine Page (T100, T103)
 * 
 * Shows the knee-shield warmup routine with all movements.
 * User can complete movements, skip the warmup, or finish.
 */

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Button, LoadingSpinner, ProgressBar } from '../components/common';
import { WarmupMovementCard } from '../components/warmup';
import { warmupApi } from '../services/api';
import type { WarmupMovement } from '../types';

export default function WarmupRoutine() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get workout day ID from navigation state (passed from Today page)
  const workoutDayId = location.state?.workoutDayId as string | undefined;
  const returnTo = location.state?.returnTo || '/today';

  const [completedMovements, setCompletedMovements] = useState<Set<number>>(new Set());
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);

  const { data: routine, isLoading, error } = useQuery({
    queryKey: ['warmup'],
    queryFn: () => warmupApi.getRoutine(),
    staleTime: 60 * 60 * 1000, // Cache for 1 hour
  });

  const movements = routine?.movements || [];
  const completedCount = completedMovements.size;
  const totalCount = movements.length;
  const allComplete = completedCount === totalCount && totalCount > 0;

  const handleToggleMovement = (index: number) => {
    setCompletedMovements((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleComplete = () => {
    // Navigate back with warmup completed flag
    navigate(returnTo, {
      state: {
        warmupCompleted: true,
        workoutDayId,
      },
      replace: true,
    });
  };

  const handleSkip = () => {
    // Navigate back with warmup skipped
    navigate(returnTo, {
      state: {
        warmupCompleted: false,
        warmupSkipped: true,
        workoutDayId,
      },
      replace: true,
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Error state
  if (error || !routine) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Card className="text-center py-8">
          <p className="text-fitness-danger mb-4">Failed to load warmup routine</p>
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <motion.header
        className="mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <motion.span
            className="text-3xl"
            animate={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
          >
            🦵
          </motion.span>
          <h1 className="text-2xl font-bold text-text-primary">{routine.name}</h1>
        </div>
        <p className="text-text-secondary text-sm">{routine.description}</p>
        <div className="flex items-center gap-2 mt-2 text-sm text-text-muted">
          <span>⏱️ ~{routine.duration} min</span>
          <span>•</span>
          <span>{totalCount} movements</span>
        </div>
      </motion.header>

      {/* Progress */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex justify-between text-sm text-text-secondary mb-2">
          <span>Progress</span>
          <span>
            {completedCount} / {totalCount} complete
          </span>
        </div>
        <ProgressBar value={completedCount} max={totalCount} />
      </motion.div>

      {/* Movement List */}
      <div className="space-y-3 mb-6">
        {movements.map((movement: WarmupMovement, index: number) => (
          <WarmupMovementCard
            key={index}
            name={movement.name}
            instructions={movement.instructions}
            duration={movement.duration}
            purpose={movement.purpose}
            index={index}
            isCompleted={completedMovements.has(index)}
            onToggle={() => handleToggleMovement(index)}
          />
        ))}
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {/* Complete Button - Shown when all done */}
        <AnimatePresence>
          {allComplete && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={handleComplete}
              >
                ✅ Start Workout
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Skip Button */}
        {!showSkipConfirm ? (
          <Button
            variant="ghost"
            size="md"
            className="w-full text-text-muted"
            onClick={() => setShowSkipConfirm(true)}
          >
            Skip warmup →
          </Button>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Card className="border-fitness-warning/30 bg-fitness-warning/5">
              <p className="text-sm text-text-secondary mb-3">
                ⚠️ Skipping warmup increases injury risk. The knee-shield routine
                only takes ~5 minutes and significantly reduces strain on your joints.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => setShowSkipConfirm(false)}
                >
                  Continue Warmup
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  className="flex-1"
                  onClick={handleSkip}
                >
                  Skip Anyway
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="w-full text-center text-sm text-text-muted hover:text-text-secondary transition-colors py-2"
        >
          ← Go back
        </button>
      </div>

      <div className="h-8" />
    </div>
  );
}
