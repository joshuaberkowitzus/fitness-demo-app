import { auth } from '../config/firebase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

/**
 * Get the current user's Firebase ID token for API authentication.
 */
async function getAuthToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  
  try {
    return await user.getIdToken();
  } catch (error) {
    console.error('Failed to get auth token:', error);
    return null;
  }
}

/**
 * Make an authenticated API request.
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new ApiError(error.detail || `HTTP ${response.status}`, response.status);
  }
  
  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }
  
  return response.json();
}

/**
 * Custom error class for API errors.
 */
export class ApiError extends Error {
  status: number;
  
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// ============================================================================
// Auth API
// ============================================================================

export const authApi = {
  verify: () => apiRequest<{ authenticated: boolean; uid: string }>('/auth/verify'),
};

// ============================================================================
// User API
// ============================================================================

export const userApi = {
  getMe: () => apiRequest<import('../types').User>('/users/me'),
  initialize: () => apiRequest<import('../types').User>('/users/me/initialize', { method: 'POST' }),
  update: (data: Partial<import('../types').User>) =>
    apiRequest<import('../types').User>('/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  getStats: () => apiRequest<import('../types').UserStats>('/users/me/stats'),
};

// ============================================================================
// Workout API
// ============================================================================

export const workoutApi = {
  getTodayWorkout: () => apiRequest<import('../types').WorkoutDayFull>('/workouts/today'),
  getPlan: () => apiRequest<import('../types').WorkoutPlanFull>('/workouts/plan'),
  getDay: (dayId: string) => apiRequest<import('../types').WorkoutDayFull>(`/workouts/days/${dayId}`),
  updateDay: (dayId: string, data: Partial<import('../types').WorkoutDay>) =>
    apiRequest<import('../types').WorkoutDay>(`/workouts/days/${dayId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  resetPlan: () => apiRequest<import('../types').WorkoutPlanFull>('/workouts/plan/reset', { method: 'POST' }),
  
  // Exercise management
  getExercises: (dayId: string) => apiRequest<import('../types').Exercise[]>(`/workouts/days/${dayId}/exercises`),
  addExercise: (dayId: string, data: import('../types').ExerciseCreate) =>
    apiRequest<import('../types').Exercise>(`/workouts/days/${dayId}/exercises`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateExercise: (dayId: string, exerciseId: string, data: import('../types').ExerciseUpdate) =>
    apiRequest<import('../types').Exercise>(`/workouts/days/${dayId}/exercises/${exerciseId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteExercise: (dayId: string, exerciseId: string) =>
    apiRequest<void>(`/workouts/days/${dayId}/exercises/${exerciseId}`, { method: 'DELETE' }),
};

// ============================================================================
// Session API
// ============================================================================

export const sessionApi = {
  getCurrent: () => apiRequest<import('../types').WorkoutSessionFull>('/sessions/current'),
  start: (data: import('../types').SessionCreate) =>
    apiRequest<import('../types').WorkoutSession>('/sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  get: (sessionId: string) => apiRequest<import('../types').WorkoutSessionFull>(`/sessions/${sessionId}`),
  update: (sessionId: string, data: import('../types').SessionUpdate) =>
    apiRequest<import('../types').WorkoutSession>(`/sessions/${sessionId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  list: (params?: { limit?: number; offset?: number; status?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    if (params?.status) searchParams.set('status', params.status);
    const query = searchParams.toString();
    return apiRequest<import('../types').SessionList>(`/sessions${query ? `?${query}` : ''}`);
  },
  
  // Exercise completion
  completeExercise: (sessionId: string, exerciseId: string, data?: import('../types').ExerciseCompletionCreate) =>
    apiRequest<import('../types').ExerciseCompletion>(`/sessions/${sessionId}/exercises/${exerciseId}/complete`, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),
  undoExercise: (sessionId: string, exerciseId: string) =>
    apiRequest<void>(`/sessions/${sessionId}/exercises/${exerciseId}/undo`, { method: 'POST' }),
};

// ============================================================================
// Health/Google Fit API
// ============================================================================

export const healthApi = {
  getGoogleFitStatus: () => apiRequest<{ connected: boolean; lastSyncAt?: string }>('/health/google-fit/status'),
  getGoogleFitAuthUrl: () => apiRequest<{ url: string }>('/health/google-fit/auth-url'),
  disconnectGoogleFit: () => apiRequest<void>('/health/google-fit/disconnect', { method: 'DELETE' }),
  getMetrics: (startTime: string, endTime: string) =>
    apiRequest<import('../types').HealthMetrics>(`/health/metrics?start=${startTime}&end=${endTime}`),
};

// ============================================================================
// Warmup API
// ============================================================================

export const warmupApi = {
  getRoutine: () => apiRequest<import('../types').WarmupRoutine>('/warmup'),
};

export default {
  auth: authApi,
  user: userApi,
  workout: workoutApi,
  session: sessionApi,
  health: healthApi,
  warmup: warmupApi,
};
