/**
 * Weekly Summary Component (T094)
 * 
 * Shows a summary of workout activity for the current week and month.
 */

import { motion } from 'framer-motion';
import { Card } from '../common';

interface WeeklySummaryProps {
  workoutsThisWeek: number;
  workoutsThisMonth: number;
  totalWorkouts: number;
  totalExercises: number;
}

export function WeeklySummary({
  workoutsThisWeek,
  workoutsThisMonth,
  totalWorkouts,
  totalExercises,
}: WeeklySummaryProps) {
  // Calculate goals (5 workouts per week is typical)
  const weeklyGoal = 5;
  const weeklyProgress = Math.min(100, (workoutsThisWeek / weeklyGoal) * 100);
  
  // Get current week dates for display
  const weekRange = getWeekDateRange();
  
  return (
    <Card>
      <h2 className="text-sm font-medium text-text-secondary mb-4">
        📅 This Week
      </h2>

      {/* Weekly Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-text-muted">{weekRange}</span>
          <span className="text-sm font-semibold text-fitness-primary">
            {workoutsThisWeek} / {weeklyGoal}
          </span>
        </div>
        <div className="h-3 bg-background-hover rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-fitness-primary to-fitness-success rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${weeklyProgress}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
          />
        </div>
        {weeklyProgress >= 100 && (
          <motion.p
            className="text-xs text-fitness-success mt-1 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            🎉 Weekly goal achieved!
          </motion.p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 text-center border-t border-gray-800 pt-4">
        <StatItem
          value={workoutsThisMonth}
          label="This Month"
          delay={0.1}
        />
        <StatItem
          value={totalWorkouts}
          label="Total Workouts"
          delay={0.2}
        />
        <StatItem
          value={totalExercises}
          label="Exercises"
          delay={0.3}
        />
      </div>

      {/* Day indicators */}
      <div className="mt-4 pt-4 border-t border-gray-800">
        <div className="flex justify-between">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => {
            // For demo, show first N days as completed based on workoutsThisWeek
            const isCompleted = index < workoutsThisWeek;
            const isToday = index === getCurrentDayIndex();
            
            return (
              <motion.div
                key={index}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                  isCompleted 
                    ? 'bg-fitness-primary text-white'
                    : isToday
                    ? 'bg-background-hover text-fitness-primary border border-fitness-primary'
                    : 'bg-background-hover text-text-muted'
                }`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1 * index + 0.3 }}
              >
                {isCompleted ? '✓' : day}
              </motion.div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

interface StatItemProps {
  value: number;
  label: string;
  delay: number;
}

function StatItem({ value, label, delay }: StatItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <p className="text-xl font-bold text-text-primary">{formatNumber(value)}</p>
      <p className="text-xs text-text-muted">{label}</p>
    </motion.div>
  );
}

// Helper functions
function getWeekDateRange(): string {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - now.getDay() + 1);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  
  const formatDate = (date: Date) => 
    date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  
  return `${formatDate(monday)} - ${formatDate(sunday)}`;
}

function getCurrentDayIndex(): number {
  const day = new Date().getDay();
  // Convert from Sunday = 0 to Monday = 0
  return day === 0 ? 6 : day - 1;
}

function formatNumber(num: number): string {
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k`;
  }
  return num.toString();
}
