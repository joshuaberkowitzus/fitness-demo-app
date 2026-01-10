/**
 * Streak Display Component (T093)
 * 
 * Shows the user's current and longest workout streaks with visual flair.
 */

import { motion } from 'framer-motion';
import { Card } from '../common';

interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
  lastWorkoutDate?: string;
}

export function StreakDisplay({ currentStreak, longestStreak, lastWorkoutDate }: StreakDisplayProps) {
  const isOnStreak = currentStreak > 0;
  const isNewRecord = currentStreak >= longestStreak && currentStreak > 0;
  
  return (
    <Card className="relative overflow-hidden">
      {/* Background gradient for active streak */}
      {isOnStreak && (
        <div className="absolute inset-0 bg-gradient-to-br from-fitness-primary/10 to-transparent" />
      )}

      <div className="relative">
        <h2 className="text-sm font-medium text-text-secondary mb-4 flex items-center gap-2">
          🔥 Workout Streak
          {isNewRecord && (
            <span className="px-2 py-0.5 bg-fitness-warning/20 text-fitness-warning text-xs rounded-full">
              New Record!
            </span>
          )}
        </h2>

        <div className="flex items-center gap-8">
          {/* Current Streak */}
          <div className="flex-1 text-center">
            <motion.div
              className="text-4xl font-bold text-fitness-primary mb-1"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              {currentStreak}
            </motion.div>
            <p className="text-xs text-text-muted">Current</p>
          </div>

          {/* Divider */}
          <div className="h-12 w-px bg-gray-700" />

          {/* Longest Streak */}
          <div className="flex-1 text-center">
            <div className="text-4xl font-bold text-text-secondary mb-1">
              {longestStreak}
            </div>
            <p className="text-xs text-text-muted">Best</p>
          </div>
        </div>

        {/* Streak flame animation for active streaks */}
        {isOnStreak && (
          <motion.div
            className="absolute top-2 right-4 text-3xl"
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            🔥
          </motion.div>
        )}

        {/* Last workout info */}
        {lastWorkoutDate && (
          <p className="text-xs text-text-muted text-center mt-4 pt-4 border-t border-gray-800">
            Last workout: {formatLastWorkout(lastWorkoutDate)}
          </p>
        )}

        {/* Encouragement message */}
        {!isOnStreak && (
          <p className="text-sm text-text-secondary text-center mt-4 pt-4 border-t border-gray-800">
            Complete a workout today to start your streak!
          </p>
        )}
      </div>
    </Card>
  );
}

function formatLastWorkout(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }
}
