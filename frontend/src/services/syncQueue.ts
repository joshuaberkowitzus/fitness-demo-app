/**
 * Offline Sync Queue Service (T106)
 * 
 * Manages pending operations when offline and syncs them when back online.
 */

import {
  getPendingOperations,
  removePendingOperation,
  updatePendingOperation,
  addPendingOperation,
  getPendingOperationCount,
} from './storage';
import { sessionApi } from './api';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

type OperationType = 'complete_exercise' | 'undo_exercise' | 'update_session' | 'start_session';

interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: string[];
}

let isSyncing = false;
let syncListeners: Array<(result: SyncResult) => void> = [];

/**
 * Add a listener for sync completion events.
 */
export function onSyncComplete(listener: (result: SyncResult) => void): () => void {
  syncListeners.push(listener);
  return () => {
    syncListeners = syncListeners.filter((l) => l !== listener);
  };
}

/**
 * Notify all listeners of sync completion.
 */
function notifySyncComplete(result: SyncResult): void {
  syncListeners.forEach((listener) => listener(result));
}

/**
 * Queue an operation for offline sync.
 */
export async function queueOperation(
  type: OperationType,
  data: Record<string, unknown>
): Promise<string> {
  return addPendingOperation({ type, data });
}

/**
 * Execute a single operation against the API.
 */
async function executeOperation(
  type: OperationType,
  data: Record<string, unknown>
): Promise<void> {
  switch (type) {
    case 'complete_exercise':
      await sessionApi.completeExercise(
        data.sessionId as string,
        data.exerciseId as string,
        data.completion as Record<string, unknown> | undefined
      );
      break;

    case 'undo_exercise':
      await sessionApi.undoExercise(
        data.sessionId as string,
        data.exerciseId as string
      );
      break;

    case 'update_session':
      await sessionApi.update(
        data.sessionId as string,
        data.update as Record<string, unknown>
      );
      break;

    case 'start_session':
      await sessionApi.start(data.sessionCreate as { workoutDayId: string; warmupCompleted?: boolean });
      break;

    default:
      throw new Error(`Unknown operation type: ${type}`);
  }
}

/**
 * Sync all pending operations.
 * 
 * Processes operations in order (FIFO) and handles retries.
 */
export async function syncPendingOperations(): Promise<SyncResult> {
  if (isSyncing) {
    return { success: false, synced: 0, failed: 0, errors: ['Sync already in progress'] };
  }

  if (!navigator.onLine) {
    return { success: false, synced: 0, failed: 0, errors: ['Device is offline'] };
  }

  isSyncing = true;
  let synced = 0;
  let failed = 0;
  const errors: string[] = [];

  try {
    const operations = await getPendingOperations();

    for (const op of operations) {
      try {
        await executeOperation(op.type, op.data);
        await removePendingOperation(op.id);
        synced++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        if (op.retries < MAX_RETRIES) {
          // Retry later
          await updatePendingOperation(op.id, { retries: op.retries + 1 });
          errors.push(`Operation ${op.type} will retry (attempt ${op.retries + 1}/${MAX_RETRIES})`);
        } else {
          // Max retries exceeded, remove operation
          await removePendingOperation(op.id);
          failed++;
          errors.push(`Operation ${op.type} failed after ${MAX_RETRIES} retries: ${errorMessage}`);
        }
      }

      // Small delay between operations to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }

    const result: SyncResult = {
      success: failed === 0,
      synced,
      failed,
      errors,
    };

    notifySyncComplete(result);
    return result;
  } finally {
    isSyncing = false;
  }
}

/**
 * Check if there are pending operations.
 */
export async function hasPendingOperations(): Promise<boolean> {
  const count = await getPendingOperationCount();
  return count > 0;
}

/**
 * Get the number of pending operations.
 */
export { getPendingOperationCount };

/**
 * Setup automatic sync on online event.
 */
export function setupAutoSync(): () => void {
  const handleOnline = () => {
    console.log('Device is online, syncing pending operations...');
    syncPendingOperations().catch(console.error);
  };

  window.addEventListener('online', handleOnline);

  // Initial sync if online
  if (navigator.onLine) {
    syncPendingOperations().catch(console.error);
  }

  return () => {
    window.removeEventListener('online', handleOnline);
  };
}
