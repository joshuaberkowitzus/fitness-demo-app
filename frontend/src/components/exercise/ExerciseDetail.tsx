/**
 * ExerciseDetail Modal Component (T035)
 * 
 * Shows full exercise details in a modal overlay.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Button, Badge } from '../common';
import type { Exercise } from '../../types';

interface ExerciseDetailProps {
  exercise: Exercise | null;
  onClose: () => void;
  isCompleted: boolean;
  onToggleComplete: () => void;
  isPending?: boolean;
}

export function ExerciseDetail({
  exercise,
  onClose,
  isCompleted,
  onToggleComplete,
  isPending = false,
}: ExerciseDetailProps) {
  // When exercise is null, modal is closed
  const isOpen = exercise !== null;
  
  return (
    <AnimatePresence>
      {isOpen && exercise && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            className="fixed inset-x-4 bottom-4 max-w-lg mx-auto bg-background-card rounded-2xl shadow-xl z-50 overflow-hidden"
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-800">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-text-primary">
                    {exercise.name}
                  </h2>
                  {exercise.category && (
                    <Badge variant="default" className="mt-1">
                      {exercise.category}
                    </Badge>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-text-muted hover:text-text-secondary transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {/* Instructions */}
              <section className="mb-6">
                <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  Instructions
                </h3>
                <p className="text-text-primary leading-relaxed">
                  {exercise.instructions}
                </p>
              </section>
              
              {/* Details Grid */}
              <section className="grid grid-cols-2 gap-4 mb-6">
                {exercise.sets && (
                  <DetailCard label="Sets" value={`${exercise.sets}`} icon="🔄" />
                )}
                {exercise.reps && (
                  <DetailCard label="Reps/Duration" value={exercise.reps.toString()} icon="⏱️" />
                )}
                {exercise.tempo && (
                  <DetailCard label="Tempo" value={exercise.tempo} icon="🎵" />
                )}
              </section>
              
              {/* Notes */}
              {exercise.notes && (
                <section className="mb-6">
                  <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-2">
                    Notes
                  </h3>
                  <div className="bg-fitness-warning/10 border border-fitness-warning/30 rounded-lg p-3">
                    <p className="text-fitness-warning text-sm">
                      💡 {exercise.notes}
                    </p>
                  </div>
                </section>
              )}
            </div>
            
            {/* Footer Actions */}
            <div className="p-4 border-t border-gray-800 bg-background-dark/50">
              <Button
                variant={isCompleted ? 'secondary' : 'primary'}
                size="lg"
                className="w-full"
                onClick={onToggleComplete}
                disabled={isPending}
              >
                {isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <LoadingSpinner />
                    Processing...
                  </span>
                ) : isCompleted ? (
                  '↩️ Mark Incomplete'
                ) : (
                  '✓ Mark Complete'
                )}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function DetailCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="bg-background-dark rounded-lg p-3">
      <div className="flex items-center gap-2 mb-1">
        <span>{icon}</span>
        <span className="text-xs text-text-muted uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-text-primary font-semibold">{value}</p>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export default ExerciseDetail;
