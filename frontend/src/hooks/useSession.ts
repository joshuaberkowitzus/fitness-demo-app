/**
 * React Query hooks for workout sessions.
 * Includes offline-first support with optimistic updates and sync queue.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionApi } from '../services/api';
import { saveSession, getSession, getAllSessions } from '../services/storage';
import { queueOperation } from '../services/syncQueue';
import type { WorkoutSession, WorkoutSessionFull, ExerciseCompletion, SessionCreate, SessionList } from '../types';

// Query keys
export const sessionKeys = {
  all: ['sessions'] as const,
  current: () => [...sessionKeys.all, 'current'] as const,
  list: (filters?: { status?: string }) => [...sessionKeys.all, 'list', filters] as const,
  detail: (sessionId: string) => [...sessionKeys.all, 'detail', sessionId] as const,
};

/**
 * Check if we're online
 */
function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Hook to get the current in-progress session.
 * Falls back to IndexedDB when offline.
 */
export function useCurrentSession() {
  return useQuery<WorkoutSessionFull | null>({
    queryKey: sessionKeys.current(),
    queryFn: async (): Promise<WorkoutSessionFull | null> => {
      // If online, try API first
      if (isOnline()) {
        try {
          const session = await sessionApi.getCurrent();
          // Cache for offline use
          if (session) {
            await saveSession(session);
          }
          return session;
        } catch (error: unknown) {
          // 404 means no current session
          if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
            return null;
          }
          throw error;
        }
      }
      
      // Offline: check IndexedDB for in-progress sessions
      const cachedSessions = await getAllSessions<WorkoutSessionFull>();
      const inProgressSession = cachedSessions.find(s => s.status === 'in_progress');
      return inProgressSession || null;
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: isOnline() ? 60 * 1000 : false, // Only refetch when online
  });
}

/**
 * Hook to get a specific session by ID.
 * Falls back to IndexedDB when offline.
 */
export function useSession(sessionId: string) {
  return useQuery<WorkoutSessionFull>({
    queryKey: sessionKeys.detail(sessionId),
    queryFn: async (): Promise<WorkoutSessionFull> => {
      if (isOnline()) {
        const session = await sessionApi.get(sessionId);
        // Cache for offline use
        await saveSession(session);
        return session;
      }
      
      // Offline: try to get from IndexedDB
      const cachedSession = await getSession<WorkoutSessionFull>(sessionId);
      if (cachedSession) {
        return cachedSession;
      }
      throw new Error('Session not available offline');
    },
    enabled: !!sessionId,
  });
}

/**
 * Hook to list sessions with pagination.
 * Falls back to IndexedDB when offline.
 */
export function useSessions(options?: { limit?: number; offset?: number; status?: string }) {
  return useQuery<SessionList>({
    queryKey: sessionKeys.list({ status: options?.status }),
    queryFn: async (): Promise<SessionList> => {
      if (isOnline()) {
        const result = await sessionApi.list(options);
        // Cache sessions for offline use
        for (const session of result.items) {
          await saveSession(session);
        }
        return result;
      }
      
      // Offline: get from IndexedDB
      const cachedSessions = await getAllSessions<WorkoutSessionFull>();
      let sessions = [...cachedSessions];
      
      // Apply status filter
      if (options?.status) {
        sessions = sessions.filter(s => s.status === options.status);
      }
      
      // Sort by date descending
      sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      // Apply pagination
      const offset = options?.offset || 0;
      const limit = options?.limit || 20;
      const paginatedSessions = sessions.slice(offset, offset + limit);
      
      return {
        items: paginatedSessions,
        total: cachedSessions.length,
        limit,
        offset,
      };
    },
  });
}

/**
 * Hook to start a new workout session.
 */
export function useStartSession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: SessionCreate) => sessionApi.start(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.current() });
      queryClient.invalidateQueries({ queryKey: sessionKeys.list() });
    },
  });
}

/**
 * Hook to update a session (complete, cancel, notes).
 */
export function useUpdateSession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({
      sessionId,
      data,
    }: {
      sessionId: string;
      data: Partial<Pick<WorkoutSession, 'status' | 'notes' | 'warmupCompleted'>>;
    }) => sessionApi.update(sessionId, data),
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.current() });
      queryClient.invalidateQueries({ queryKey: sessionKeys.detail(sessionId) });
      queryClient.invalidateQueries({ queryKey: sessionKeys.list() });
    },
  });
}

/**
 * Hook to complete the current session.
 */
export function useCompleteSession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (sessionId: string) =>
      sessionApi.update(sessionId, { status: 'completed' }),
    onSuccess: (_, sessionId) => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.current() });
      queryClient.invalidateQueries({ queryKey: sessionKeys.detail(sessionId) });
      queryClient.invalidateQueries({ queryKey: sessionKeys.list() });
    },
  });
}

/**
 * Hook to mark an exercise as complete.
 * Uses optimistic updates and offline queue.
 */
export function useCompleteExercise() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      sessionId,
      exerciseId,
      data,
    }: {
      sessionId: string;
      exerciseId: string;
      data?: Partial<ExerciseCompletion>;
    }): Promise<ExerciseCompletion> => {
      if (isOnline()) {
        const result = await sessionApi.completeExercise(sessionId, exerciseId, data);
        return result;
      }
      
      // Offline: queue the operation and return optimistic result
      await queueOperation('complete_exercise', { sessionId, exerciseId, data });
      
      // Return an optimistic completion
      return {
        id: `temp_${Date.now()}`,
        exerciseId,
        exerciseName: '',
        completedAt: new Date().toISOString(),
        skipped: false,
        ...data,
      } as ExerciseCompletion;
    },
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.current() });
      queryClient.invalidateQueries({ queryKey: sessionKeys.detail(sessionId) });
    },
  });
}

/**
 * Hook to undo an exercise completion.
 * Uses optimistic updates and offline queue.
 */
export function useUndoExerciseCompletion() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ sessionId, exerciseId }: { sessionId: string; exerciseId: string }): Promise<void> => {
      if (isOnline()) {
        await sessionApi.undoExercise(sessionId, exerciseId);
        return;
      }
      
      // Offline: queue the operation
      await queueOperation('undo_exercise', { sessionId, exerciseId });
    },
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.current() });
      queryClient.invalidateQueries({ queryKey: sessionKeys.detail(sessionId) });
    },
  });
}
