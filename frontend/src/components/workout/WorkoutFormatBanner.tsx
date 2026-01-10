/**
 * WorkoutFormatBanner Component
 * 
 * Displays the workout format instructions (e.g., circuit details).
 */

import { motion } from 'framer-motion';
import { Card } from '../common';

interface WorkoutFormatBannerProps {
  format: string;
}

export function WorkoutFormatBanner({ format }: WorkoutFormatBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="bg-fitness-warning/10 border-fitness-warning/30">
        <p className="text-fitness-warning text-sm font-medium flex items-center gap-2">
          <span>📋</span>
          {format}
        </p>
      </Card>
    </motion.div>
  );
}

export default WorkoutFormatBanner;
