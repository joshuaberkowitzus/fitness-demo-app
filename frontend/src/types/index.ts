// ============================================================================
// Core Entity Types - Based on data-model.md
// ============================================================================

/** User profile and preferences */
export interface User {
  uid: string;
  email: string;
  displayName?: string;
  createdAt: string;
  preferences: UserPreferences;
  googleFit?: GoogleFitStatus;
  stats: UserStats;
}

export interface UserPreferences {
  showWarmup: boolean;
  darkMode: boolean;
  weekStartsOn: 0 | 1;
}

export interface GoogleFitStatus {
  connected: boolean;
  lastSyncAt?: string;
}

export interface UserStats {
  totalWorkouts: number;
  totalExercisesCompleted: number;
  currentStreak: number;
  longestStreak: number;
  lastWorkoutDate?: string;
  workoutsThisWeek: number;
  workoutsThisMonth: number;
}

// ============================================================================
// Workout Plan Types
// ============================================================================

export interface WorkoutPlan {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutPlanFull extends WorkoutPlan {
  days: WorkoutDayFull[];
}

export interface WorkoutDay {
  id: string;
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  name: string;
  focus: string;
  format?: string;
  duration?: number;
  isRestDay: boolean;
  sortOrder: number;
}

export interface WorkoutDayFull extends WorkoutDay {
  exercises: Exercise[];
}

export interface Exercise {
  id: string;
  name: string;
  instructions: string;
  sets?: number;
  reps?: number | string;
  tempo?: string;
  notes?: string;
  sortOrder: number;
  category?: string;
}

// ============================================================================
// Workout Session Types
// ============================================================================

export type SessionStatus = 'in_progress' | 'completed' | 'cancelled';

export interface WorkoutSession {
  id: string;
  date: string;
  workoutPlanId: string;
  workoutDayId: string;
  workoutDayName: string;
  startedAt: string;
  completedAt?: string;
  status: SessionStatus;
  warmupCompleted: boolean;
  notes?: string;
  healthMetrics?: HealthMetrics;
  syncedAt?: string;
}

export interface WorkoutSessionFull extends WorkoutSession {
  exerciseCompletions: ExerciseCompletion[];
}

export interface ExerciseCompletion {
  id: string;
  exerciseId: string;
  exerciseName: string;
  completedAt: string;
  setsCompleted?: number;
  repsCompleted?: number;
  weight?: number;
  notes?: string;
  skipped: boolean;
  skipReason?: string;
}

export interface HealthMetrics {
  heartRateAvg?: number;
  heartRateMax?: number;
  caloriesBurned?: number;
  steps?: number;
}

// ============================================================================
// Warmup Types
// ============================================================================

export interface WarmupRoutine {
  id: string;
  name: string;
  description: string;
  duration: number;
  movements: WarmupMovement[];
}

export interface WarmupMovement {
  name: string;
  instructions: string;
  duration: string;
  purpose: string;
  sortOrder: number;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiError {
  detail: string;
  code?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  offset: number;
  limit: number;
}

export interface SessionList extends PaginatedResponse<WorkoutSession> {}

// ============================================================================
// Form/Input Types
// ============================================================================

export interface ExerciseCreate {
  name: string;
  instructions: string;
  sets?: number;
  reps?: number | string;
  tempo?: string;
  notes?: string;
  category?: string;
}

export interface ExerciseUpdate extends Partial<ExerciseCreate> {
  sortOrder?: number;
}

export interface SessionCreate {
  workoutDayId: string;
  warmupCompleted?: boolean;
}

export interface SessionUpdate {
  status?: SessionStatus;
  notes?: string;
  warmupCompleted?: boolean;
}

export interface ExerciseCompletionCreate {
  setsCompleted?: number;
  repsCompleted?: number;
  weight?: number;
  notes?: string;
}
