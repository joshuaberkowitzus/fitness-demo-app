/**
 * WorkoutProgress Component (T037)
 * 
 * Displays workout completion progress with animated progress bar.
 */

import { motion } from 'framer-motion';
import { Card, ProgressBar } from '../common';

interface WorkoutProgressProps {
  completed: number;
  total: number;
  className?: string;
}

export function WorkoutProgress({ completed, total, className = '' }: WorkoutProgressProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isComplete = completed === total && total > 0;
  
  return (
    <Card className={`${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-text-secondary">Today's Progress</span>
        <motion.span
          className={`font-semibold ${isComplete ? 'text-fitness-success' : 'text-fitness-primary'}`}
          key={completed}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          {completed} / {total}
        </motion.span>
      </div>
      
      <ProgressBar value={completed} max={total} />
      
      {/* Completion Message */}
      {isComplete && (
        <motion.div
          className="mt-3 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <span className="text-fitness-success text-sm font-medium">
            🎉 Great job! All exercises complete!
          </span>
        </motion.div>
      )}
      
      {/* Progress Percentage */}
      {!isComplete && percentage > 0 && (
        <motion.div
          className="mt-2 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <span className="text-text-muted text-xs">
            {percentage}% complete
          </span>
        </motion.div>
      )}
    </Card>
  );
}

export default WorkoutProgress;
