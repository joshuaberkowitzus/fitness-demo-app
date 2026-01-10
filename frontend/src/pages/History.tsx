/**
 * History Page - Workout Session History (T089)
 * 
 * Shows a list of past workout sessions with pagination.
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Card, Button, LoadingSpinner } from '../components/common';
import { SessionHistoryCard } from '../components/dashboard/SessionHistoryCard';
import { sessionApi } from '../services/api';
import type { WorkoutSession, SessionStatus } from '../types';

const SESSIONS_PER_PAGE = 10;

export default function History() {
  const navigate = useNavigate();
  const [offset, setOffset] = useState(0);
  const [statusFilter, setStatusFilter] = useState<SessionStatus | ''>('');

  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ['sessions', offset, statusFilter],
    queryFn: () => sessionApi.list({
      limit: SESSIONS_PER_PAGE,
      offset,
      status: statusFilter || undefined,
    }),
    staleTime: 30000,
  });

  const sessions = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / SESSIONS_PER_PAGE);
  const currentPage = Math.floor(offset / SESSIONS_PER_PAGE) + 1;

  const handlePreviousPage = () => {
    setOffset(Math.max(0, offset - SESSIONS_PER_PAGE));
  };

  const handleNextPage = () => {
    if (offset + SESSIONS_PER_PAGE < total) {
      setOffset(offset + SESSIONS_PER_PAGE);
    }
  };

  const handleSessionClick = (session: WorkoutSession) => {
    navigate(`/history/${session.id}`);
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
          <p className="text-fitness-danger mb-4">Failed to load workout history</p>
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
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Workout History</h1>
        <p className="text-text-secondary text-sm mt-1">
          {total} {total === 1 ? 'workout' : 'workouts'} logged
        </p>
      </header>

      {/* Status Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <FilterButton
          active={statusFilter === ''}
          onClick={() => { setStatusFilter(''); setOffset(0); }}
        >
          All
        </FilterButton>
        <FilterButton
          active={statusFilter === 'completed'}
          onClick={() => { setStatusFilter('completed'); setOffset(0); }}
        >
          Completed
        </FilterButton>
        <FilterButton
          active={statusFilter === 'in_progress'}
          onClick={() => { setStatusFilter('in_progress'); setOffset(0); }}
        >
          In Progress
        </FilterButton>
        <FilterButton
          active={statusFilter === 'cancelled'}
          onClick={() => { setStatusFilter('cancelled'); setOffset(0); }}
        >
          Cancelled
        </FilterButton>
      </div>

      {/* Sessions List */}
      {sessions.length === 0 ? (
        <Card className="text-center py-12">
          <motion.span
            className="text-5xl mb-4 block"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            📊
          </motion.span>
          <h2 className="text-lg font-semibold text-text-primary mb-2">
            No workouts yet
          </h2>
          <p className="text-text-secondary mb-4">
            Start your first workout to see it here!
          </p>
          <Button variant="primary" onClick={() => navigate('/today')}>
            Start Today's Workout
          </Button>
        </Card>
      ) : (
        <motion.div className="space-y-3" layout>
          <AnimatePresence mode="popLayout">
            {sessions.map((session, index) => (
              <SessionHistoryCard
                key={session.id}
                session={session}
                index={index}
                onClick={() => handleSessionClick(session)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Loading overlay for pagination */}
      {isFetching && !isLoading && (
        <div className="fixed inset-0 bg-background-dark/50 flex items-center justify-center z-50">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="secondary"
            size="sm"
            onClick={handlePreviousPage}
            disabled={offset === 0 || isFetching}
          >
            ← Previous
          </Button>
          <span className="text-text-secondary text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleNextPage}
            disabled={offset + SESSIONS_PER_PAGE >= total || isFetching}
          >
            Next →
          </Button>
        </div>
      )}

      <BottomNav />
      <div className="h-20" />
    </div>
  );
}

interface FilterButtonProps {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}

function FilterButton({ children, active, onClick }: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
        active
          ? 'bg-fitness-primary text-white'
          : 'bg-background-card text-text-secondary hover:bg-background-hover'
      }`}
    >
      {children}
    </button>
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
