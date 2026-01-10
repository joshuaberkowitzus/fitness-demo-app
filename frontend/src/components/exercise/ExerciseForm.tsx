/**
 * ExerciseForm Component (T066)
 * 
 * Form for adding or editing exercises.
 * Supports all exercise fields: name, instructions, sets, reps, tempo, notes, category.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button, LoadingSpinner } from '../common';
import type { Exercise, ExerciseCreate } from '../../types';

interface ExerciseFormProps {
  exercise?: Exercise;
  onSubmit: (data: ExerciseCreate) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const EXERCISE_CATEGORIES = [
  'Warm-up',
  'Lower Body',
  'Upper Body',
  'Core',
  'Mobility',
  'Cardio',
  'Balance',
  'Flexibility',
  'Other',
];

export function ExerciseForm({ exercise, onSubmit, onCancel, isLoading }: ExerciseFormProps) {
  const isEditing = !!exercise;
  
  // Form state
  const [name, setName] = useState(exercise?.name || '');
  const [instructions, setInstructions] = useState(exercise?.instructions || '');
  const [sets, setSets] = useState<string>(exercise?.sets?.toString() || '');
  const [reps, setReps] = useState<string>(exercise?.reps?.toString() || '');
  const [tempo, setTempo] = useState(exercise?.tempo || '');
  const [notes, setNotes] = useState(exercise?.notes || '');
  const [category, setCategory] = useState(exercise?.category || '');
  
  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) {
      newErrors.name = 'Exercise name is required';
    }
    
    if (!instructions.trim()) {
      newErrors.instructions = 'Instructions are required';
    }
    
    if (sets && isNaN(parseInt(sets))) {
      newErrors.sets = 'Sets must be a number';
    }
    
    if (reps && isNaN(parseInt(reps)) && !/^\d+(-\d+)?$/.test(reps)) {
      newErrors.reps = 'Reps must be a number or range (e.g., 8-12)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    const data: ExerciseCreate = {
      name: name.trim(),
      instructions: instructions.trim(),
      ...(sets && { sets: parseInt(sets) }),
      ...(reps && { reps: reps.trim() }),
      ...(tempo && { tempo: tempo.trim() }),
      ...(notes && { notes: notes.trim() }),
      ...(category && { category }),
    };
    
    onSubmit(data);
  };
  
  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 bg-black/60 z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
      />
      
      {/* Modal */}
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-background-card rounded-xl shadow-xl max-w-lg w-full p-6 border border-gray-800 my-8"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <h2 className="text-xl font-bold text-text-primary mb-4">
            {isEditing ? 'Edit Exercise' : 'Add Exercise'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-1">
                Exercise Name *
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field w-full"
                placeholder="e.g., Bulgarian Split Squats"
              />
              {errors.name && (
                <p className="text-fitness-danger text-sm mt-1">{errors.name}</p>
              )}
            </div>
            
            {/* Instructions */}
            <div>
              <label htmlFor="instructions" className="block text-sm font-medium text-text-secondary mb-1">
                Instructions *
              </label>
              <textarea
                id="instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="input-field w-full min-h-[100px] resize-none"
                placeholder="Step by step instructions for the exercise..."
              />
              {errors.instructions && (
                <p className="text-fitness-danger text-sm mt-1">{errors.instructions}</p>
              )}
            </div>
            
            {/* Sets and Reps */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="sets" className="block text-sm font-medium text-text-secondary mb-1">
                  Sets
                </label>
                <input
                  id="sets"
                  type="text"
                  value={sets}
                  onChange={(e) => setSets(e.target.value)}
                  className="input-field w-full"
                  placeholder="e.g., 3"
                />
                {errors.sets && (
                  <p className="text-fitness-danger text-sm mt-1">{errors.sets}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="reps" className="block text-sm font-medium text-text-secondary mb-1">
                  Reps
                </label>
                <input
                  id="reps"
                  type="text"
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  className="input-field w-full"
                  placeholder="e.g., 8-12"
                />
                {errors.reps && (
                  <p className="text-fitness-danger text-sm mt-1">{errors.reps}</p>
                )}
              </div>
            </div>
            
            {/* Tempo */}
            <div>
              <label htmlFor="tempo" className="block text-sm font-medium text-text-secondary mb-1">
                Tempo
              </label>
              <input
                id="tempo"
                type="text"
                value={tempo}
                onChange={(e) => setTempo(e.target.value)}
                className="input-field w-full"
                placeholder="e.g., 3-1-1-0 (down-pause-up-pause)"
              />
              <p className="text-text-muted text-xs mt-1">
                Format: eccentric-pause-concentric-pause
              </p>
            </div>
            
            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-text-secondary mb-1">
                Category
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input-field w-full"
              >
                <option value="">Select category...</option>
                {EXERCISE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-text-secondary mb-1">
                Notes
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input-field w-full min-h-[80px] resize-none"
                placeholder="Additional notes, modifications, or cues..."
              />
            </div>
            
            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="flex-1"
                disabled={isLoading}
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : isEditing ? (
                  'Save Changes'
                ) : (
                  'Add Exercise'
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </>
  );
}

export default ExerciseForm;
