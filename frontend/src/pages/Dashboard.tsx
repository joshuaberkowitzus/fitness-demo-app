/**
 * Dashboard Page (T092)
 * 
 * Shows workout statistics overview including streaks, weekly summary,
 * and progress charts.
 */

import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, Button, LoadingSpinner } from '../components/common';
import { StreakDisplay, WeeklySummary, ProgressChart } from '../components/dashboard';
import { userApi } from '../services/api';
import { useAuthContext } from '../context/AuthContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user: authUser } = useAuthContext();

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['userStats'],
    queryFn: () => userApi.getStats(),
    staleTime: 60000, // 1 minute
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Card className="text-center py-8">
          <p className="text-fitness-danger mb-4">Failed to load stats</p>
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <motion.header
        className="mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="text-text-secondary text-sm">
          Welcome back,
        </p>
        <h1 className="text-2xl font-bold text-text-primary">
          {authUser?.displayName || authUser?.email?.split('@')[0] || 'Athlete'}
        </h1>
      </motion.header>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={() => navigate('/today')}
        >
          🏋️ Start Today's Workout
        </Button>
      </motion.div>

      {/* Stats Grid */}
      {stats && (
        <>
          {/* Streak Display */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-6"
          >
            <StreakDisplay
              currentStreak={stats.currentStreak}
              longestStreak={stats.longestStreak}
              lastWorkoutDate={stats.lastWorkoutDate}
            />
          </motion.div>

          {/* Weekly Summary */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <WeeklySummary
              workoutsThisWeek={stats.workoutsThisWeek}
              workoutsThisMonth={stats.workoutsThisMonth}
              totalWorkouts={stats.totalWorkouts}
              totalExercises={stats.totalExercisesCompleted}
            />
          </motion.div>

          {/* Progress Chart */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mb-6"
          >
            <ProgressChart workoutsThisWeek={stats.workoutsThisWeek} />
          </motion.div>

          {/* Recent Activity Link */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card
              variant="interactive"
              onClick={() => navigate('/history')}
              className="flex items-center justify-between"
            >
              <div>
                <h3 className="font-semibold text-text-primary">View History</h3>
                <p className="text-sm text-text-secondary">
                  See all your past workouts
                </p>
              </div>
              <span className="text-2xl">→</span>
            </Card>
          </motion.div>
        </>
      )}

      {/* Empty State */}
      {stats && stats.totalWorkouts === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="text-center py-12">
            <motion.span
              className="text-6xl mb-4 block"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🚀
            </motion.span>
            <h2 className="text-xl font-semibold text-text-primary mb-2">
              Ready to start?
            </h2>
            <p className="text-text-secondary mb-4">
              Complete your first workout to see your stats here!
            </p>
            <Button variant="primary" onClick={() => navigate('/today')}>
              Start First Workout
            </Button>
          </Card>
        </motion.div>
      )}

      <BottomNav />
      <div className="h-20" />
    </div>
  );
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
  const isActive = window.location.pathname === to;

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
