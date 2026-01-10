/**
 * WorkoutDayCard Component (T064)
 * 
 * Displays a workout day summary card in the Plan view.
 * Shows day name, workout focus, exercise count, and duration.
 * Clickable to navigate to edit view.
 */

import { motion } from 'framer-motion';
import { Badge } from '../common';
import type { WorkoutDayFull } from '../../types';

interface WorkoutDayCardProps {
  day: WorkoutDayFull;
  dayName: string;
  isToday?: boolean;
  onClick: () => void;
}

export function WorkoutDayCard({ day, dayName, isToday, onClick }: WorkoutDayCardProps) {
  const exerciseCount = day.exercises?.length || 0;
  
  return (
    <motion.button
      onClick={onClick}
      className={`w-full text-left card group transition-all duration-200 ${
        isToday 
          ? 'ring-2 ring-fitness-primary ring-offset-2 ring-offset-background-dark' 
          : 'hover:bg-background-hover'
      }`}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex items-center justify-between">
        {/* Left side: Day info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-text-secondary text-sm">{dayName}</span>
            {isToday && (
              <Badge variant="success" size="sm">Today</Badge>
            )}
          </div>
          
          <h3 className="text-lg font-semibold text-text-primary truncate">
            {day.name}
          </h3>
          
          <div className="flex items-center gap-3 mt-2">
            <span className="text-text-secondary text-sm flex items-center gap-1">
              <TargetIcon className="w-4 h-4" />
              {day.focus}
            </span>
            
            {!day.isRestDay && (
              <span className="text-text-muted text-sm flex items-center gap-1">
                <ListIcon className="w-4 h-4" />
                {exerciseCount} {exerciseCount === 1 ? 'exercise' : 'exercises'}
              </span>
            )}
            
            {day.duration && (
              <span className="text-text-muted text-sm flex items-center gap-1">
                <ClockIcon className="w-4 h-4" />
                {day.duration} min
              </span>
            )}
          </div>
        </div>
        
        {/* Right side: Rest day badge or chevron */}
        <div className="flex items-center gap-2 ml-4">
          {day.isRestDay ? (
            <Badge variant="warning">Rest</Badge>
          ) : day.format ? (
            <Badge variant="default" size="sm">{day.format}</Badge>
          ) : null}
          
          <ChevronRightIcon className="w-5 h-5 text-text-muted group-hover:text-text-secondary transition-colors" />
        </div>
      </div>
    </motion.button>
  );
}

// Icons
function TargetIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  );
}

function ListIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6h16M4 10h16M4 14h16M4 18h16"
      />
    </svg>
  );
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

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5l7 7-7 7"
      />
    </svg>
  );
}

export default WorkoutDayCard;
