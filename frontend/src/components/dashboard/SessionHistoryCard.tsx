/**
 * Session History Card Component (T090)
 * 
 * Displays a summary card for a workout session in the history list.
 */

import { motion } from 'framer-motion';
import { Badge } from '../common';
import type { WorkoutSession, SessionStatus } from '../../types';

interface SessionHistoryCardProps {
  session: WorkoutSession;
  index: number;
  onClick: () => void;
}

export function SessionHistoryCard({ session, index, onClick }: SessionHistoryCardProps) {
  const formattedDate = formatDate(session.date);
  const formattedTime = formatTime(session.startedAt);
  const duration = session.completedAt 
    ? calculateDuration(session.startedAt, session.completedAt)
    : null;

  return (
    <motion.div
      className="bg-background-card rounded-xl p-4 border border-gray-800 cursor-pointer hover:bg-background-hover hover:border-gray-700 transition-colors"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index }}
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-text-primary">
              {session.workoutDayName}
            </h3>
            <StatusBadge status={session.status} />
          </div>
          
          <p className="text-sm text-text-secondary">
            {formattedDate} at {formattedTime}
          </p>
          
          {duration && (
            <p className="text-xs text-text-muted mt-1">
              Duration: {duration}
            </p>
          )}
          
          {/* Health metrics preview if available */}
          {session.healthMetrics && (
            <div className="flex gap-3 mt-2 text-xs">
              {session.healthMetrics.heartRateAvg && (
                <span className="text-fitness-danger">
                  ❤️ {session.healthMetrics.heartRateAvg} bpm
                </span>
              )}
              {session.healthMetrics.caloriesBurned && (
                <span className="text-fitness-warning">
                  🔥 {session.healthMetrics.caloriesBurned} cal
                </span>
              )}
              {session.healthMetrics.steps && (
                <span className="text-fitness-success">
                  👟 {session.healthMetrics.steps}
                </span>
              )}
            </div>
          )}
        </div>

        <span className="text-text-muted text-xl">→</span>
      </div>

      {/* Notes preview if available */}
      {session.notes && (
        <p className="text-sm text-text-muted mt-2 line-clamp-2 italic">
          "{session.notes}"
        </p>
      )}
    </motion.div>
  );
}

interface StatusBadgeProps {
  status: SessionStatus;
}

function StatusBadge({ status }: StatusBadgeProps) {
  const variants = {
    completed: { variant: 'success' as const, label: '✓' },
    in_progress: { variant: 'warning' as const, label: '⋯' },
    cancelled: { variant: 'danger' as const, label: '✕' },
  };

  const { variant, label } = variants[status];

  return <Badge variant={variant} size="sm">{label}</Badge>;
}

// Helper functions
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function calculateDuration(startStr: string, endStr: string): string {
  const start = new Date(startStr);
  const end = new Date(endStr);
  const diffMs = end.getTime() - start.getTime();
  const diffMins = Math.round(diffMs / 60000);
  
  if (diffMins < 60) {
    return `${diffMins} min`;
  }
  
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}
