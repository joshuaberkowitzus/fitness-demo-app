/**
 * WorkoutHeader Component (T036)
 * 
 * Displays workout day name, focus, and metadata.
 */

import { motion } from 'framer-motion';
import { Badge } from '../common';
import type { WorkoutDay } from '../../types';

interface WorkoutHeaderProps {
  workout: WorkoutDay;
  dayName?: string;
}

export function WorkoutHeader({ workout, dayName }: WorkoutHeaderProps) {
  // Get current day name if not provided
  const currentDayName = dayName || getDayName();
  
  return (
    <motion.header
      className="mb-6"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Day Label */}
      <p className="text-text-secondary text-sm">{currentDayName}</p>
      
      {/* Workout Name */}
      <h1 className="text-2xl font-bold text-text-primary mt-1">
        {workout.name}
      </h1>
      
      {/* Badges */}
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <Badge variant="success">{workout.focus}</Badge>
        
        {workout.duration && (
          <Badge variant="default">
            <ClockIcon className="w-3 h-3 mr-1" />
            {workout.duration} min
          </Badge>
        )}
        
        {workout.isRestDay && (
          <Badge variant="warning">Rest Day</Badge>
        )}
      </div>
    </motion.header>
  );
}

function getDayName(): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date().getDay()];
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

export default WorkoutHeader;
