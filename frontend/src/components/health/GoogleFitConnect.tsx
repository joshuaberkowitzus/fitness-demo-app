/**
 * GoogleFitConnect Component (T080)
 * 
 * Component for connecting/disconnecting Google Fit integration.
 * Handles OAuth redirect flow and displays connection status.
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, Button, LoadingSpinner } from '../common';
import { healthApi } from '../../services/api';

interface GoogleFitStatus {
  connected: boolean;
  lastSyncAt?: string;
  scopes?: string[];
}

export function GoogleFitConnect() {
  const [status, setStatus] = useState<GoogleFitStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch initial status
  useEffect(() => {
    fetchStatus();
  }, []);
  
  // Handle OAuth callback (check URL params on mount)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (code && state) {
      handleOAuthCallback(code, state);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);
  
  const fetchStatus = async () => {
    try {
      setIsLoading(true);
      const data = await healthApi.getGoogleFitStatus();
      setStatus(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch Google Fit status:', err);
      setError('Failed to load status');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      
      // Get OAuth URL
      const redirectUri = `${window.location.origin}/settings`;
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/health/google-fit/auth-url?redirect_uri=${encodeURIComponent(redirectUri)}`,
        {
          headers: {
            'Authorization': `Bearer ${await getAuthToken()}`,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to get auth URL');
      }
      
      const data = await response.json();
      
      // Redirect to Google OAuth
      window.location.href = data.url;
    } catch (err) {
      console.error('Failed to initiate Google Fit connection:', err);
      setError('Failed to connect. Please try again.');
      setIsConnecting(false);
    }
  };
  
  const handleOAuthCallback = async (code: string, state: string) => {
    try {
      setIsConnecting(true);
      setError(null);
      
      const redirectUri = `${window.location.origin}/settings`;
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/health/google-fit/callback?redirect_uri=${encodeURIComponent(redirectUri)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await getAuthToken()}`,
          },
          body: JSON.stringify({ code, state }),
        }
      );
      
      if (!response.ok) {
        throw new Error('OAuth callback failed');
      }
      
      // Refresh status
      await fetchStatus();
    } catch (err) {
      console.error('OAuth callback error:', err);
      setError('Failed to complete connection. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };
  
  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Google Fit?')) {
      return;
    }
    
    try {
      setIsDisconnecting(true);
      setError(null);
      await healthApi.disconnectGoogleFit();
      setStatus({ connected: false });
    } catch (err) {
      console.error('Failed to disconnect Google Fit:', err);
      setError('Failed to disconnect. Please try again.');
    } finally {
      setIsDisconnecting(false);
    }
  };
  
  // Loading state
  if (isLoading) {
    return (
      <Card className="flex items-center justify-center py-8">
        <LoadingSpinner size="md" />
      </Card>
    );
  }
  
  return (
    <Card>
      <div className="flex items-center gap-4">
        {/* Google Fit Icon */}
        <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
          <GoogleFitIcon className="w-6 h-6 text-green-500" />
        </div>
        
        {/* Info */}
        <div className="flex-1">
          <p className="font-medium text-text-primary">Google Fit</p>
          <p className="text-text-secondary text-sm">
            {status?.connected
              ? status.lastSyncAt
                ? `Last synced ${formatRelativeTime(status.lastSyncAt)}`
                : 'Connected'
              : 'Track heart rate, calories, and steps'}
          </p>
        </div>
        
        {/* Action Button */}
        {status?.connected ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleDisconnect}
            disabled={isDisconnecting}
          >
            {isDisconnecting ? <LoadingSpinner size="sm" /> : 'Disconnect'}
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            onClick={handleConnect}
            disabled={isConnecting}
          >
            {isConnecting ? <LoadingSpinner size="sm" /> : 'Connect'}
          </Button>
        )}
      </div>
      
      {/* Error message */}
      {error && (
        <motion.p
          className="mt-3 text-fitness-danger text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {error}
        </motion.p>
      )}
      
      {/* Connected benefits */}
      {!status?.connected && (
        <motion.div
          className="mt-4 pt-4 border-t border-gray-800"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p className="text-text-muted text-xs mb-2">When connected, you'll see:</p>
          <div className="flex flex-wrap gap-2">
            <MetricBadge icon="❤️" label="Heart Rate" />
            <MetricBadge icon="🔥" label="Calories" />
            <MetricBadge icon="👟" label="Steps" />
          </div>
        </motion.div>
      )}
    </Card>
  );
}

function MetricBadge({ icon, label }: { icon: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-background-hover rounded text-xs text-text-secondary">
      <span>{icon}</span>
      <span>{label}</span>
    </span>
  );
}

function GoogleFitIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
    </svg>
  );
}

// Helper to get auth token
async function getAuthToken(): Promise<string> {
  const { auth } = await import('../../config/firebase');
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  return user.getIdToken();
}

// Helper to format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}

export default GoogleFitConnect;
