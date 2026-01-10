/**
 * Session Detail Page (T091)
 * 
 * Shows detailed information about a specific workout session including
 * all completed exercises, notes, and health metrics.
 */

// React hooks imported as needed
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, Button, LoadingSpinner, Badge } from '../components/common';
import { SessionNotesInput } from '../components/session';
import { HealthMetricsCard } from '../components/health';
import { sessionApi } from '../services/api';
import type { ExerciseCompletion, SessionStatus } from '../types';

export default function SessionDetail() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: session, isLoading, error } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => sessionApi.get(sessionId!),
    enabled: !!sessionId,
  });

  const updateNotes = useMutation({
    mutationFn: (notes: string) => sessionApi.update(sessionId!, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });

  const handleSaveNotes = async (notes: string) => {
    await updateNotes.mutateAsync(notes);
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
  if (error || !session) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Card className="text-center py-8">
          <p className="text-fitness-danger mb-4">Session not found</p>
          <Button variant="secondary" onClick={() => navigate('/history')}>
            Back to History
          </Button>
        </Card>
      </div>
    );
  }

  const completedExercises = session.exerciseCompletions.filter(c => !c.skipped);
  const skippedExercises = session.exerciseCompletions.filter(c => c.skipped);
  const formattedDate = formatSessionDate(session.startedAt);
  const duration = session.completedAt 
    ? calculateDuration(session.startedAt, session.completedAt)
    : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/history')}
        className="flex items-center gap-2 text-text-secondary hover:text-text-primary mb-4 transition-colors"
      >
        <span>←</span>
        <span>Back to History</span>
      </button>

      {/* Header */}
      <motion.header
        className="mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold text-text-primary">
            {session.workoutDayName}
          </h1>
          <StatusBadge status={session.status} />
        </div>
        <p className="text-text-secondary">{formattedDate}</p>
        {duration && (
          <p className="text-text-muted text-sm mt-1">Duration: {duration}</p>
        )}
      </motion.header>

      {/* Health Metrics */}
      {session.healthMetrics && (
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <HealthMetricsCard
            metrics={session.healthMetrics}
            showConnectPrompt={false}
          />
        </motion.div>
      )}

      {/* Session Notes */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <SessionNotesInput
          initialNotes={session.notes || ''}
          onSave={handleSaveNotes}
          isSaving={updateNotes.isPending}
        />
      </motion.div>

      {/* Summary Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="mb-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-fitness-primary">
                {completedExercises.length}
              </p>
              <p className="text-xs text-text-muted">Completed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-text-secondary">
                {skippedExercises.length}
              </p>
              <p className="text-xs text-text-muted">Skipped</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-fitness-success">
                {session.warmupCompleted ? '✓' : '—'}
              </p>
              <p className="text-xs text-text-muted">Warmup</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Completed Exercises */}
      {completedExercises.length > 0 && (
        <motion.section
          className="mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <h2 className="text-lg font-semibold text-text-primary mb-3">
            Completed Exercises
          </h2>
          <div className="space-y-2">
            {completedExercises.map((completion, index) => (
              <ExerciseCompletionCard
                key={completion.id}
                completion={completion}
                index={index}
              />
            ))}
          </div>
        </motion.section>
      )}

      {/* Skipped Exercises */}
      {skippedExercises.length > 0 && (
        <motion.section
          className="mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-lg font-semibold text-text-secondary mb-3">
            Skipped Exercises
          </h2>
          <div className="space-y-2">
            {skippedExercises.map((completion, index) => (
              <ExerciseCompletionCard
                key={completion.id}
                completion={completion}
                index={index}
                isSkipped
              />
            ))}
          </div>
        </motion.section>
      )}

      <BottomNav />
      <div className="h-20" />
    </div>
  );
}

interface StatusBadgeProps {
  status: SessionStatus;
}

function StatusBadge({ status }: StatusBadgeProps) {
  const variants = {
    completed: { variant: 'success' as const, label: 'Completed' },
    in_progress: { variant: 'warning' as const, label: 'In Progress' },
    cancelled: { variant: 'danger' as const, label: 'Cancelled' },
  };

  const { variant, label } = variants[status];

  return <Badge variant={variant}>{label}</Badge>;
}

interface ExerciseCompletionCardProps {
  completion: ExerciseCompletion;
  index: number;
  isSkipped?: boolean;
}

function ExerciseCompletionCard({ completion, index, isSkipped }: ExerciseCompletionCardProps) {
  return (
    <motion.div
      className={`p-3 rounded-lg ${
        isSkipped ? 'bg-background-hover opacity-60' : 'bg-background-card'
      }`}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.05 * index }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className={isSkipped ? 'text-text-muted' : 'text-fitness-success'}>
            {isSkipped ? '○' : '✓'}
          </span>
          <span className={`font-medium ${isSkipped ? 'text-text-muted line-through' : 'text-text-primary'}`}>
            {completion.exerciseName}
          </span>
        </div>
        <span className="text-xs text-text-muted">
          {formatTime(completion.completedAt)}
        </span>
      </div>

      {/* Exercise details if logged */}
      {!isSkipped && (completion.setsCompleted || completion.repsCompleted || completion.weight) && (
        <div className="mt-2 flex gap-4 text-sm text-text-secondary ml-6">
          {completion.setsCompleted && (
            <span>{completion.setsCompleted} sets</span>
          )}
          {completion.repsCompleted && (
            <span>{completion.repsCompleted} reps</span>
          )}
          {completion.weight && (
            <span>{completion.weight} lbs</span>
          )}
        </div>
      )}

      {/* Notes or skip reason */}
      {(completion.notes || completion.skipReason) && (
        <p className="mt-2 text-sm text-text-muted ml-6 italic">
          {isSkipped ? completion.skipReason : completion.notes}
        </p>
      )}
    </motion.div>
  );
}

// Helper functions
function formatSessionDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
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
  const isActive = window.location.pathname.startsWith(to);

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
