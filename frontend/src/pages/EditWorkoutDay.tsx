/**
 * EditWorkoutDay Page (T065)
 * 
 * Page for editing a specific workout day.
 * Shows exercise list with add/edit/delete/reorder capabilities.
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import { Card, Button, LoadingSpinner, Badge } from '../components/common';
import { ExerciseForm } from '../components/exercise';
import { useWorkoutDay, useAddExercise, useUpdateExercise, useDeleteExercise } from '../hooks/useWorkout';
import { useUnsavedChanges } from '../hooks';
import type { Exercise, ExerciseCreate } from '../types';

export default function EditWorkoutDay() {
  const { dayId } = useParams<{ dayId: string }>();
  const navigate = useNavigate();
  
  const { data: workoutDay, isLoading, error, refetch } = useWorkoutDay(dayId || '');
  const addExercise = useAddExercise();
  const updateExercise = useUpdateExercise();
  const deleteExercise = useDeleteExercise();
  
  // Local state for reorderable exercises
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [hasOrderChanges, setHasOrderChanges] = useState(false);
  
  // Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [deletingExercise, setDeletingExercise] = useState<Exercise | null>(null);
  
  // Unsaved changes warning
  const { setHasChanges } = useUnsavedChanges(hasOrderChanges, 'You have unsaved exercise order changes. Are you sure you want to leave?');
  
  // Sync exercises from server data
  useEffect(() => {
    if (workoutDay?.exercises) {
      setExercises([...workoutDay.exercises].sort((a, b) => a.sortOrder - b.sortOrder));
      setHasOrderChanges(false);
    }
  }, [workoutDay?.exercises]);
  
  // Handle exercise reorder
  const handleReorder = useCallback((newOrder: Exercise[]) => {
    setExercises(newOrder);
    setHasOrderChanges(true);
    setHasChanges(true);
  }, [setHasChanges]);
  
  // Save new exercise order
  const handleSaveOrder = async () => {
    if (!dayId) return;
    
    try {
      // Update each exercise with new sort order
      for (let i = 0; i < exercises.length; i++) {
        const exercise = exercises[i];
        if (exercise.sortOrder !== i) {
          await updateExercise.mutateAsync({
            dayId,
            exerciseId: exercise.id,
            data: { sortOrder: i },
          });
        }
      }
      setHasOrderChanges(false);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save exercise order:', error);
    }
  };
  
  // Add new exercise
  const handleAddExercise = async (data: ExerciseCreate) => {
    if (!dayId) return;
    
    try {
      await addExercise.mutateAsync({ dayId, exercise: data });
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to add exercise:', error);
    }
  };
  
  // Update existing exercise
  const handleUpdateExercise = async (data: ExerciseCreate) => {
    if (!dayId || !editingExercise) return;
    
    try {
      await updateExercise.mutateAsync({
        dayId,
        exerciseId: editingExercise.id,
        data,
      });
      setEditingExercise(null);
    } catch (error) {
      console.error('Failed to update exercise:', error);
    }
  };
  
  // Delete exercise
  const handleDeleteExercise = async () => {
    if (!dayId || !deletingExercise) return;
    
    try {
      await deleteExercise.mutateAsync({
        dayId,
        exerciseId: deletingExercise.id,
      });
      setDeletingExercise(null);
    } catch (error) {
      console.error('Failed to delete exercise:', error);
    }
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
  if (error || !workoutDay) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Card className="text-center py-8">
          <p className="text-fitness-danger mb-4">Failed to load workout day</p>
          <Button variant="secondary" onClick={() => refetch()}>
            Retry
          </Button>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
      {/* Header */}
      <motion.header
        className="mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <button
          onClick={() => navigate('/plan')}
          className="flex items-center text-text-secondary hover:text-text-primary transition-colors mb-2"
        >
          <ChevronLeftIcon className="w-5 h-5 mr-1" />
          Back to Plan
        </button>
        
        <h1 className="text-2xl font-bold text-text-primary">{workoutDay.name}</h1>
        
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="success">{workoutDay.focus}</Badge>
          {workoutDay.format && (
            <Badge variant="default">{workoutDay.format}</Badge>
          )}
          {workoutDay.isRestDay && (
            <Badge variant="warning">Rest Day</Badge>
          )}
        </div>
      </motion.header>
      
      {/* Exercises Section */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary">
            Exercises ({exercises.length})
          </h2>
          
          {hasOrderChanges && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveOrder}
              disabled={updateExercise.isPending}
            >
              {updateExercise.isPending ? <LoadingSpinner size="sm" /> : 'Save Order'}
            </Button>
          )}
        </div>
        
        {/* Reorderable Exercise List */}
        {exercises.length > 0 ? (
          <Reorder.Group
            axis="y"
            values={exercises}
            onReorder={handleReorder}
            className="space-y-2"
          >
            {exercises.map((exercise, index) => (
              <Reorder.Item
                key={exercise.id}
                value={exercise}
                className="touch-none"
              >
                <Card className="flex items-center gap-3 group cursor-grab active:cursor-grabbing">
                  {/* Drag Handle */}
                  <div className="text-text-muted">
                    <DragHandleIcon className="w-5 h-5" />
                  </div>
                  
                  {/* Exercise Number */}
                  <div className="w-8 h-8 rounded-full bg-fitness-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-fitness-primary font-semibold text-sm">
                      {index + 1}
                    </span>
                  </div>
                  
                  {/* Exercise Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-primary truncate">
                      {exercise.name}
                    </p>
                    <p className="text-text-secondary text-sm">
                      {formatExerciseDetails(exercise)}
                    </p>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingExercise(exercise);
                      }}
                      className="p-2 rounded-lg hover:bg-background-hover text-text-muted hover:text-text-primary transition-colors"
                    >
                      <EditIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingExercise(exercise);
                      }}
                      className="p-2 rounded-lg hover:bg-fitness-danger/10 text-text-muted hover:text-fitness-danger transition-colors"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </Card>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        ) : (
          <Card className="text-center py-8">
            <p className="text-text-secondary">No exercises yet</p>
          </Card>
        )}
        
        {/* Add Exercise Button */}
        {!showAddForm && (
          <motion.div
            className="mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => setShowAddForm(true)}
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Add Exercise
            </Button>
          </motion.div>
        )}
      </section>
      
      {/* Add Exercise Form Modal */}
      <AnimatePresence>
        {showAddForm && (
          <ExerciseForm
            onSubmit={handleAddExercise}
            onCancel={() => setShowAddForm(false)}
            isLoading={addExercise.isPending}
          />
        )}
      </AnimatePresence>
      
      {/* Edit Exercise Form Modal */}
      <AnimatePresence>
        {editingExercise && (
          <ExerciseForm
            exercise={editingExercise}
            onSubmit={handleUpdateExercise}
            onCancel={() => setEditingExercise(null)}
            isLoading={updateExercise.isPending}
          />
        )}
      </AnimatePresence>
      
      {/* Delete Confirmation */}
      <AnimatePresence>
        {deletingExercise && (
          <DeleteConfirmation
            exerciseName={deletingExercise.name}
            onConfirm={handleDeleteExercise}
            onCancel={() => setDeletingExercise(null)}
            isLoading={deleteExercise.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper function to format exercise details
function formatExerciseDetails(exercise: Exercise): string {
  const parts: string[] = [];
  
  if (exercise.sets) {
    parts.push(`${exercise.sets} sets`);
  }
  if (exercise.reps) {
    parts.push(`${exercise.reps} reps`);
  }
  if (exercise.tempo) {
    parts.push(exercise.tempo);
  }
  
  return parts.length > 0 ? parts.join(' · ') : 'No details';
}

// Delete confirmation modal
function DeleteConfirmation({
  exerciseName,
  onConfirm,
  onCancel,
  isLoading,
}: {
  exerciseName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}) {
  return (
    <>
      <motion.div
        className="fixed inset-0 bg-black/60 z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
      />
      
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-background-card rounded-xl shadow-xl max-w-sm w-full p-6 border border-gray-800"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
        >
          <h3 className="text-lg font-bold text-text-primary mb-2">
            Delete Exercise?
          </h3>
          <p className="text-text-secondary mb-6">
            Are you sure you want to delete "{exerciseName}"? This action cannot be undone.
          </p>
          
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1 bg-fitness-danger hover:bg-red-700"
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? <LoadingSpinner size="sm" /> : 'Delete'}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}

// Icons
function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function DragHandleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <circle cx="8" cy="6" r="1.5" />
      <circle cx="16" cy="6" r="1.5" />
      <circle cx="8" cy="12" r="1.5" />
      <circle cx="16" cy="12" r="1.5" />
      <circle cx="8" cy="18" r="1.5" />
      <circle cx="16" cy="18" r="1.5" />
    </svg>
  );
}

function EditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
      />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}
