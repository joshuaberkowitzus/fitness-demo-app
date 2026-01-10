/**
 * React Query hooks for workout data.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workoutApi } from '../services/api';
import type { WorkoutDay, ExerciseCreate, ExerciseUpdate } from '../types';

// Query keys
export const workoutKeys = {
  all: ['workouts'] as const,
  plan: () => [...workoutKeys.all, 'plan'] as const,
  today: () => [...workoutKeys.all, 'today'] as const,
  day: (dayId: string) => [...workoutKeys.all, 'day', dayId] as const,
  exercises: (dayId: string) => [...workoutKeys.all, 'exercises', dayId] as const,
};

/**
 * Hook to get the active workout plan with all days and exercises.
 */
export function useWorkoutPlan() {
  return useQuery({
    queryKey: workoutKeys.plan(),
    queryFn: workoutApi.getPlan,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to get today's workout based on day of week.
 */
export function useTodayWorkout() {
  return useQuery({
    queryKey: workoutKeys.today(),
    queryFn: workoutApi.getTodayWorkout,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook to get a specific workout day.
 */
export function useWorkoutDay(dayId: string) {
  return useQuery({
    queryKey: workoutKeys.day(dayId),
    queryFn: () => workoutApi.getDay(dayId),
    enabled: !!dayId,
  });
}

/**
 * Hook to reset the plan to default.
 */
export function useResetPlan() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: workoutApi.resetPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workoutKeys.all });
    },
  });
}

/**
 * Hook to update a workout day.
 */
export function useUpdateWorkoutDay() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ dayId, data }: { dayId: string; data: Partial<WorkoutDay> }) =>
      workoutApi.updateDay(dayId, data),
    onSuccess: (_, { dayId }) => {
      queryClient.invalidateQueries({ queryKey: workoutKeys.day(dayId) });
      queryClient.invalidateQueries({ queryKey: workoutKeys.plan() });
      queryClient.invalidateQueries({ queryKey: workoutKeys.today() });
    },
  });
}

/**
 * Hook to add a new exercise to a workout day.
 */
export function useAddExercise() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ dayId, exercise }: { dayId: string; exercise: ExerciseCreate }) =>
      workoutApi.addExercise(dayId, exercise),
    onSuccess: (_, { dayId }) => {
      queryClient.invalidateQueries({ queryKey: workoutKeys.day(dayId) });
      queryClient.invalidateQueries({ queryKey: workoutKeys.exercises(dayId) });
      queryClient.invalidateQueries({ queryKey: workoutKeys.plan() });
      queryClient.invalidateQueries({ queryKey: workoutKeys.today() });
    },
  });
}

/**
 * Hook to update an existing exercise.
 */
export function useUpdateExercise() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({
      dayId,
      exerciseId,
      data,
    }: {
      dayId: string;
      exerciseId: string;
      data: ExerciseUpdate;
    }) => workoutApi.updateExercise(dayId, exerciseId, data),
    onSuccess: (_, { dayId }) => {
      queryClient.invalidateQueries({ queryKey: workoutKeys.day(dayId) });
      queryClient.invalidateQueries({ queryKey: workoutKeys.exercises(dayId) });
      queryClient.invalidateQueries({ queryKey: workoutKeys.plan() });
      queryClient.invalidateQueries({ queryKey: workoutKeys.today() });
    },
  });
}

/**
 * Hook to delete an exercise.
 */
export function useDeleteExercise() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ dayId, exerciseId }: { dayId: string; exerciseId: string }) =>
      workoutApi.deleteExercise(dayId, exerciseId),
    onSuccess: (_, { dayId }) => {
      queryClient.invalidateQueries({ queryKey: workoutKeys.day(dayId) });
      queryClient.invalidateQueries({ queryKey: workoutKeys.exercises(dayId) });
      queryClient.invalidateQueries({ queryKey: workoutKeys.plan() });
      queryClient.invalidateQueries({ queryKey: workoutKeys.today() });
    },
  });
}
