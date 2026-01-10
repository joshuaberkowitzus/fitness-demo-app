/**
 * Progress Chart Component (T095)
 * 
 * A simple visual representation of workout frequency.
 * Shows a bar chart or dot matrix for the last few weeks.
 */

import { motion } from 'framer-motion';
import { Card } from '../common';

interface ProgressChartProps {
  workoutsThisWeek: number;
}

export function ProgressChart({ workoutsThisWeek }: ProgressChartProps) {
  // Generate mock data for the last 4 weeks
  // In a real app, this would come from the API
  const weeks = generateWeeklyData(workoutsThisWeek);
  const maxWorkouts = Math.max(...weeks.map(w => w.workouts), 5);
  
  return (
    <Card>
      <h2 className="text-sm font-medium text-text-secondary mb-4">
        📈 Weekly Activity
      </h2>

      {/* Bar Chart */}
      <div className="flex items-end justify-between h-32 gap-2">
        {weeks.map((week, index) => {
          const height = (week.workouts / maxWorkouts) * 100;
          const isCurrentWeek = index === weeks.length - 1;
          
          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-2">
              <motion.div
                className={`w-full rounded-t-md ${
                  isCurrentWeek
                    ? 'bg-gradient-to-t from-fitness-primary to-fitness-primary/60'
                    : 'bg-background-hover'
                }`}
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                style={{ minHeight: week.workouts > 0 ? '8px' : '0px' }}
              >
                <span className="sr-only">{week.workouts} workouts</span>
              </motion.div>
              <div className="text-center">
                <p className={`text-xs font-medium ${
                  isCurrentWeek ? 'text-fitness-primary' : 'text-text-muted'
                }`}>
                  {week.workouts}
                </p>
                <p className="text-xs text-text-muted">{week.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-800 flex items-center justify-center gap-4 text-xs text-text-muted">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-fitness-primary" />
          This Week
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-background-hover" />
          Previous Weeks
        </span>
      </div>

      {/* Insight */}
      {workoutsThisWeek > 0 && (
        <motion.div
          className="mt-4 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <p className="text-sm text-text-secondary">
            {getInsightMessage(weeks)}
          </p>
        </motion.div>
      )}
    </Card>
  );
}

interface WeekData {
  label: string;
  workouts: number;
}

function generateWeeklyData(currentWeekWorkouts: number): WeekData[] {
  // Generate realistic mock data for previous weeks
  // This would be replaced with actual API data
  const previousWeeks = [
    Math.floor(Math.random() * 4) + 2,
    Math.floor(Math.random() * 4) + 1,
    Math.floor(Math.random() * 4) + 2,
  ];
  
  // Get week labels
  const labels = getWeekLabels();
  
  return [
    { label: labels[0], workouts: previousWeeks[0] },
    { label: labels[1], workouts: previousWeeks[1] },
    { label: labels[2], workouts: previousWeeks[2] },
    { label: labels[3], workouts: currentWeekWorkouts },
  ];
}

function getWeekLabels(): string[] {
  const now = new Date();
  const labels: string[] = [];
  
  for (let i = 3; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - (i * 7));
    
    if (i === 0) {
      labels.push('Now');
    } else if (i === 1) {
      labels.push('Last');
    } else {
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      const day = date.getDate();
      labels.push(`${month} ${day}`);
    }
  }
  
  return labels;
}

function getInsightMessage(weeks: WeekData[]): string {
  const current = weeks[weeks.length - 1].workouts;
  const previous = weeks[weeks.length - 2].workouts;
  
  if (current > previous) {
    const increase = Math.round(((current - previous) / Math.max(previous, 1)) * 100);
    return `📈 ${increase}% more workouts than last week! Keep it up!`;
  } else if (current === previous) {
    return '➡️ Maintaining steady progress!';
  } else if (current > 0) {
    return '💪 Every workout counts. You got this!';
  }
  return '';
}
