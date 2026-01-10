/**
 * Session Notes Input Component (T091b)
 * 
 * Allows users to add notes to their workout sessions.
 * Auto-saves on blur or after a delay.
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, Button } from '../common';

interface SessionNotesInputProps {
  initialNotes: string;
  onSave: (notes: string) => Promise<void>;
  isSaving?: boolean;
  placeholder?: string;
}

export function SessionNotesInput({
  initialNotes,
  onSave,
  isSaving = false,
  placeholder = 'Add notes about your workout...',
}: SessionNotesInputProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [hasChanges, setHasChanges] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  // Track changes
  useEffect(() => {
    setHasChanges(notes !== initialNotes);
  }, [notes, initialNotes]);

  // Auto-save with debounce
  const handleSave = useCallback(async () => {
    if (!hasChanges || isSaving) return;
    
    try {
      await onSave(notes);
      setHasChanges(false);
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save notes:', error);
    }
  }, [notes, hasChanges, isSaving, onSave]);

  // Save on blur
  const handleBlur = () => {
    if (hasChanges) {
      handleSave();
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-text-secondary flex items-center gap-2">
          📝 Notes
          {isSaving && (
            <span className="text-xs text-text-muted animate-pulse">Saving...</span>
          )}
          {showSaved && !isSaving && (
            <motion.span
              className="text-xs text-fitness-success"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              ✓ Saved
            </motion.span>
          )}
        </h3>
        
        {hasChanges && !isSaving && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
          >
            Save
          </Button>
        )}
      </div>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={handleBlur}
        placeholder={placeholder}
        rows={3}
        className="w-full bg-background-hover border border-gray-700 rounded-lg px-3 py-2 text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-fitness-primary focus:border-transparent resize-none transition-all"
        disabled={isSaving}
      />

      <p className="text-xs text-text-muted mt-2">
        Record how you felt, what went well, or areas to improve.
      </p>
    </Card>
  );
}
