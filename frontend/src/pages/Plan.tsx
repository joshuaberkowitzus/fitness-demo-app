/**
 * Plan Page - Workout Plan Management (T063)
 * 
 * Displays weekly workout overview with editable workout days.
 * Users can view their full week, edit individual days, and reset to defaults.
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, Button, LoadingSpinner } from '../components/common';
import { WorkoutDayCard, ResetPlanDialog } from '../components/workout';
import { useWorkoutPlan, useResetPlan } from '../hooks/useWorkout';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function Plan() {
  const navigate = useNavigate();
  const { data: plan, isLoading, error, refetch } = useWorkoutPlan();
  const resetPlan = useResetPlan();
  const [showResetDialog, setShowResetDialog] = useState(false);
  
  // Handle reset to defaults
  const handleResetPlan = async () => {
    try {
      await resetPlan.mutateAsync();
      setShowResetDialog(false);
    } catch (error) {
      console.error('Failed to reset plan:', error);
    }
  };
  
  // Handle day card click - navigate to edit page
  const handleDayClick = (dayId: string) => {
    navigate(`/plan/${dayId}`);
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
  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Card className="text-center py-8">
          <p className="text-fitness-danger mb-4">Failed to load workout plan</p>
          <Button variant="secondary" onClick={() => refetch()}>
            Retry
          </Button>
        </Card>
        <BottomNav />
        <div className="h-20" />
      </div>
    );
  }
  
  // Get today's day of week (0 = Sunday)
  const today = new Date().getDay();
  
  // Sort days by day of week
  const sortedDays = [...(plan?.days || [])].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <motion.header
        className="mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-text-primary">{plan?.name || 'Workout Plan'}</h1>
        {plan?.description && (
          <p className="text-text-secondary mt-1 text-sm">{plan.description}</p>
        )}
      </motion.header>
      
      {/* Week Overview */}
      <motion.div
        className="space-y-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {sortedDays.map((day, index) => (
          <motion.div
            key={day.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 * index }}
          >
            <WorkoutDayCard
              day={day}
              dayName={DAY_NAMES[day.dayOfWeek]}
              isToday={day.dayOfWeek === today}
              onClick={() => handleDayClick(day.id)}
            />
          </motion.div>
        ))}
      </motion.div>
      
      {/* Reset Button */}
      <motion.div
        className="mt-8 pt-6 border-t border-gray-800"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <div className="text-center">
          <p className="text-text-secondary text-sm mb-3">
            Want to start fresh with the default program?
          </p>
          <Button
            variant="secondary"
            onClick={() => setShowResetDialog(true)}
            className="text-fitness-danger border-fitness-danger/30 hover:bg-fitness-danger/10"
          >
            Reset to Default Plan
          </Button>
        </div>
      </motion.div>
      
      {/* Reset Confirmation Dialog */}
      <ResetPlanDialog
        isOpen={showResetDialog}
        onClose={() => setShowResetDialog(false)}
        onConfirm={handleResetPlan}
        isLoading={resetPlan.isPending}
      />
      
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
