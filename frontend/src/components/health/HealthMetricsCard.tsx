/**
 * HealthMetricsCard Component (T081, T083)
 * 
 * Displays health metrics from Google Fit for a workout session.
 * Handles unavailable state gracefully.
 */

import { motion } from 'framer-motion';
import { Card } from '../common';
import type { HealthMetrics } from '../../types';

interface HealthMetricsCardProps {
  metrics?: HealthMetrics | null;
  isLoading?: boolean;
  showConnectPrompt?: boolean;
  onConnect?: () => void;
}

export function HealthMetricsCard({ 
  metrics, 
  isLoading, 
  showConnectPrompt,
  onConnect 
}: HealthMetricsCardProps) {
  // Loading state
  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded-full bg-gray-700" />
          <div className="h-4 w-24 bg-gray-700 rounded" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-center">
              <div className="h-6 w-12 bg-gray-700 rounded mx-auto mb-1" />
              <div className="h-3 w-16 bg-gray-700 rounded mx-auto" />
            </div>
          ))}
        </div>
      </Card>
    );
  }
  
  // Not connected prompt
  if (showConnectPrompt && !metrics) {
    return (
      <Card className="bg-gradient-to-r from-green-900/20 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <GoogleFitIcon className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="font-medium text-text-primary text-sm">Track your health metrics</p>
              <p className="text-text-muted text-xs">Connect Google Fit for heart rate & calories</p>
            </div>
          </div>
          {onConnect && (
            <button
              onClick={onConnect}
              className="text-fitness-primary text-sm font-medium hover:underline"
            >
              Connect
            </button>
          )}
        </div>
      </Card>
    );
  }
  
  // No metrics available
  if (!metrics || !hasAnyMetrics(metrics)) {
    return null;
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card>
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <GoogleFitIcon className="w-4 h-4 text-green-500" />
          <span className="text-text-secondary text-sm font-medium">Health Metrics</span>
        </div>
        
        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-4">
          {metrics.heartRateAvg && (
            <MetricItem
              icon="❤️"
              value={metrics.heartRateAvg}
              unit="bpm"
              label="Avg HR"
              color="text-red-400"
            />
          )}
          
          {metrics.heartRateMax && (
            <MetricItem
              icon="📈"
              value={metrics.heartRateMax}
              unit="bpm"
              label="Max HR"
              color="text-orange-400"
            />
          )}
          
          {metrics.caloriesBurned && (
            <MetricItem
              icon="🔥"
              value={metrics.caloriesBurned}
              unit="kcal"
              label="Calories"
              color="text-yellow-400"
            />
          )}
          
          {metrics.steps && (
            <MetricItem
              icon="👟"
              value={metrics.steps}
              unit=""
              label="Steps"
              color="text-blue-400"
            />
          )}
        </div>
      </Card>
    </motion.div>
  );
}

interface MetricItemProps {
  icon: string;
  value: number;
  unit: string;
  label: string;
  color: string;
}

function MetricItem({ icon, value, unit, label, color }: MetricItemProps) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1 mb-1">
        <span className="text-sm">{icon}</span>
        <span className={`text-lg font-bold ${color}`}>
          {formatNumber(value)}
        </span>
        {unit && <span className="text-text-muted text-xs">{unit}</span>}
      </div>
      <p className="text-text-muted text-xs">{label}</p>
    </div>
  );
}

function GoogleFitIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
    </svg>
  );
}

// Helper to check if any metrics are present
function hasAnyMetrics(metrics: HealthMetrics): boolean {
  return !!(
    metrics.heartRateAvg ||
    metrics.heartRateMax ||
    metrics.caloriesBurned ||
    metrics.steps
  );
}

// Format large numbers with commas
function formatNumber(num: number): string {
  return num.toLocaleString();
}

export default HealthMetricsCard;
