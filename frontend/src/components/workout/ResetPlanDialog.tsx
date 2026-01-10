/**
 * ResetPlanDialog Component (T068)
 * 
 * Confirmation dialog for resetting workout plan to defaults.
 * Shows warning message and requires user confirmation.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Button, LoadingSpinner } from '../common';

interface ResetPlanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function ResetPlanDialog({ isOpen, onClose, onConfirm, isLoading }: ResetPlanDialogProps) {
  if (!isOpen) return null;
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Dialog */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-background-card rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-800"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Warning Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-fitness-danger/20 flex items-center justify-center">
                  <WarningIcon className="w-8 h-8 text-fitness-danger" />
                </div>
              </div>
              
              {/* Title */}
              <h2 className="text-xl font-bold text-text-primary text-center mb-2">
                Reset Workout Plan?
              </h2>
              
              {/* Description */}
              <p className="text-text-secondary text-center mb-6">
                This will delete all your customizations and restore the default knee-preservation workout program.
                This action cannot be undone.
              </p>
              
              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={onClose}
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
                  {isLoading ? <LoadingSpinner size="sm" /> : 'Reset Plan'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  );
}

export default ResetPlanDialog;
