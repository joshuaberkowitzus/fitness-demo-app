/**
 * Warmup Movement Card Component (T101)
 * 
 * Displays a single movement in the warmup routine with
 * instructions, duration, and completion state.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../common';

interface WarmupMovementCardProps {
  name: string;
  instructions: string;
  duration: string;
  purpose: string;
  index: number;
  isCompleted: boolean;
  onToggle: () => void;
}

export function WarmupMovementCard({
  name,
  instructions,
  duration,
  purpose,
  index,
  isCompleted,
  onToggle,
}: WarmupMovementCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.05 * index }}
      layout
    >
      <Card
        className={`transition-all duration-300 ${
          isCompleted
            ? 'bg-fitness-success/10 border-fitness-success/30'
            : 'hover:bg-background-hover'
        }`}
      >
        {/* Header - Always visible */}
        <div className="flex items-start gap-3">
          {/* Completion checkbox */}
          <button
            onClick={onToggle}
            className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
              isCompleted
                ? 'bg-fitness-success border-fitness-success text-white'
                : 'border-gray-600 hover:border-fitness-primary'
            }`}
          >
            {isCompleted && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              >
                ✓
              </motion.span>
            )}
          </button>

          {/* Content */}
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3
                className={`font-semibold ${
                  isCompleted ? 'text-fitness-success' : 'text-text-primary'
                }`}
              >
                {index + 1}. {name}
              </h3>
              <span className="text-sm text-fitness-primary font-medium">
                {duration}
              </span>
            </div>

            {/* Purpose - Brief description */}
            <p className="text-sm text-text-secondary mt-1">{purpose}</p>

            {/* Expand/Collapse for instructions */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-sm text-fitness-primary mt-2 hover:underline"
            >
              {isExpanded ? 'Hide instructions ▲' : 'Show instructions ▼'}
            </button>

            {/* Expandable instructions */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 p-3 bg-background-hover rounded-lg">
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {instructions}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
