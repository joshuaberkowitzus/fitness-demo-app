/**
 * useOffline Hook (T107)
 * 
 * Provides online/offline status detection and pending operation count.
 */

import { useState, useEffect, useCallback } from 'react';
import { getPendingOperationCount } from '../services/storage';
import { syncPendingOperations, onSyncComplete, setupAutoSync } from '../services/syncQueue';

interface OfflineState {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  lastSyncResult: {
    success: boolean;
    synced: number;
    failed: number;
  } | null;
}

/**
 * Hook for managing offline state and sync operations.
 */
export function useOffline() {
  const [state, setState] = useState<OfflineState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    pendingCount: 0,
    isSyncing: false,
    lastSyncResult: null,
  });

  // Update pending count
  const refreshPendingCount = useCallback(async () => {
    try {
      const count = await getPendingOperationCount();
      setState((prev) => ({ ...prev, pendingCount: count }));
    } catch (error) {
      console.error('Failed to get pending count:', error);
    }
  }, []);

  // Manual sync trigger
  const sync = useCallback(async () => {
    if (!state.isOnline || state.isSyncing) return;

    setState((prev) => ({ ...prev, isSyncing: true }));
    try {
      const result = await syncPendingOperations();
      setState((prev) => ({
        ...prev,
        isSyncing: false,
        lastSyncResult: {
          success: result.success,
          synced: result.synced,
          failed: result.failed,
        },
      }));
      await refreshPendingCount();
    } catch (error) {
      console.error('Sync failed:', error);
      setState((prev) => ({ ...prev, isSyncing: false }));
    }
  }, [state.isOnline, state.isSyncing, refreshPendingCount]);

  useEffect(() => {
    // Online/offline event handlers
    const handleOnline = () => {
      setState((prev) => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setState((prev) => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Setup auto-sync
    const cleanupAutoSync = setupAutoSync();

    // Listen for sync completion
    const cleanupSyncListener = onSyncComplete((result) => {
      setState((prev) => ({
        ...prev,
        isSyncing: false,
        lastSyncResult: {
          success: result.success,
          synced: result.synced,
          failed: result.failed,
        },
      }));
      refreshPendingCount();
    });

    // Initial pending count
    refreshPendingCount();

    // Poll for pending count changes
    const pollInterval = setInterval(refreshPendingCount, 10000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      cleanupAutoSync();
      cleanupSyncListener();
      clearInterval(pollInterval);
    };
  }, [refreshPendingCount]);

  return {
    ...state,
    sync,
    refreshPendingCount,
  };
}
