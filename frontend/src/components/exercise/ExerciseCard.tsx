/**
 * ExerciseCard Component (T034, T039)
 * 
 * Displays a single exercise with completion state and animations.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../common';
import type { Exercise } from '../../types';

interface ExerciseCardProps {
  exercise: Exercise;
  index: number;
  isCompleted: boolean;
  isPending?: boolean;
  onToggle: () => void;
  onShowDetails: () => void;
  disabled?: boolean;
}

export function ExerciseCard({
  exercise,
  index,
  isCompleted,
  isPending = false,
  onToggle,
  onShowDetails,
  disabled = false,
}: ExerciseCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
    >
      <Card
        variant="interactive"
        className={`transition-all duration-300 ${
          isCompleted ? 'border-fitness-success/50 bg-fitness-success/5' : ''
        }`}
      >
        <div className="flex items-start gap-4">
          {/* Completion Checkbox */}
          <CompletionCheckbox
            isCompleted={isCompleted}
            isPending={isPending}
            onToggle={onToggle}
            disabled={disabled}
          />
          
          {/* Exercise Info */}
          <button
            className="flex-1 min-w-0 text-left"
            onClick={onShowDetails}
          >
            <div className="flex items-center gap-2">
              <span className="text-text-muted text-sm">#{index + 1}</span>
              <motion.h3
                className={`font-semibold transition-colors duration-200 ${
                  isCompleted ? 'text-text-secondary line-through' : 'text-text-primary'
                }`}
                animate={{ scale: isCompleted ? 0.98 : 1 }}
              >
                {exercise.name}
              </motion.h3>
            </div>
            
            <p className="text-text-secondary text-sm mt-1 line-clamp-2">
              {exercise.instructions}
            </p>
            
            <ExerciseMetadata exercise={exercise} />
          </button>
          
          {/* Expand Arrow */}
          <button
            onClick={onShowDetails}
            className="flex-shrink-0 p-2 text-text-muted hover:text-text-secondary transition-colors"
            aria-label="View exercise details"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </Card>
    </motion.div>
  );
}

/**
 * Animated completion checkbox
 */
function CompletionCheckbox({
  isCompleted,
  isPending,
  onToggle,
  disabled,
}: {
  isCompleted: boolean;
  isPending: boolean;
  onToggle: () => void;
  disabled: boolean;
}) {
  return (
    <motion.button
      className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
        isCompleted
          ? 'bg-fitness-success border-fitness-success text-white'
          : isPending
          ? 'bg-fitness-primary/50 border-fitness-primary'
          : 'border-gray-600 hover:border-fitness-primary'
      }`}
      onClick={onToggle}
      disabled={disabled || isPending}
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.05 }}
    >
      <AnimatePresence mode="wait">
        {isPending ? (
          <motion.div
            key="pending"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1, rotate: 360 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ rotate: { duration: 1, repeat: Infinity, ease: 'linear' } }}
            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
          />
        ) : isCompleted ? (
          <motion.svg
            key="check"
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            initial={{ opacity: 0, scale: 0, pathLength: 0 }}
            animate={{ opacity: 1, scale: 1, pathLength: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            />
          </motion.svg>
        ) : null}
      </AnimatePresence>
    </motion.button>
  );
}

/**
 * Exercise metadata (sets, reps, tempo)
 */
function ExerciseMetadata({ exercise }: { exercise: Exercise }) {
  const metadata = [
    exercise.sets && `${exercise.sets} sets`,
    exercise.reps && exercise.reps,
    exercise.tempo && exercise.tempo,
  ].filter(Boolean);
  
  if (metadata.length === 0) return null;
  
  return (
    <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
      {metadata.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i === 0 && <SetIcon />}
          {item}
        </span>
      ))}
    </div>
  );
}

function SetIcon() {
  return (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

export default ExerciseCard;
