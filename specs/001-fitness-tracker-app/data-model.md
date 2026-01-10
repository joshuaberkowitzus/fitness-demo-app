# Data Model: Fitness Tracker App

**Feature**: 001-fitness-tracker-app  
**Date**: 2026-01-10  
**Storage**: Firebase Firestore (NoSQL Document Database)

---

## Overview

This document defines the Firestore data model for the fitness tracker application. The design prioritizes:
- **Read efficiency**: Most queries are per-user, per-day
- **Offline support**: Documents sized for efficient sync
- **Security**: User data isolated by `uid` at collection level

---

## Collections

### 1. `users`

Stores user profile and preferences.

**Document ID**: Firebase Auth `uid`

```typescript
interface User {
  uid: string;                    // Firebase Auth UID (document ID)
  email: string;                  // User email
  displayName?: string;           // Optional display name
  createdAt: Timestamp;           // Account creation date
  preferences: {
    showWarmup: boolean;          // Show warm-up before workouts (default: true)
    darkMode: boolean;            // UI theme preference
    weekStartsOn: 0 | 1;          // 0 = Sunday, 1 = Monday
  };
  googleFit?: {
    connected: boolean;           // Whether Google Fit is linked
    lastSyncAt?: Timestamp;       // Last successful sync
    // Tokens stored in separate secure collection
  };
  stats: {
    totalWorkouts: number;        // Lifetime workout count
    currentStreak: number;        // Current consecutive days
    longestStreak: number;        // Best streak ever
    lastWorkoutAt?: Timestamp;    // Most recent workout completion
  };
}
```

**Example Document**:
```json
{
  "uid": "abc123",
  "email": "user@example.com",
  "displayName": "John",
  "createdAt": "2026-01-10T10:00:00Z",
  "preferences": {
    "showWarmup": true,
    "darkMode": true,
    "weekStartsOn": 1
  },
  "googleFit": {
    "connected": true,
    "lastSyncAt": "2026-01-10T08:30:00Z"
  },
  "stats": {
    "totalWorkouts": 15,
    "currentStreak": 3,
    "longestStreak": 7,
    "lastWorkoutAt": "2026-01-09T18:00:00Z"
  }
}
```

---

### 2. `users/{uid}/workoutPlans`

Stores user's workout plans. Each user has one active plan.

**Document ID**: Auto-generated or `"default"` for system plan

```typescript
interface WorkoutPlan {
  id: string;                     // Document ID
  name: string;                   // Plan name (e.g., "Knee-Preservation Program")
  description?: string;           // Optional description
  isActive: boolean;              // Only one plan active per user
  isDefault: boolean;             // Whether this is the system default
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

### 3. `users/{uid}/workoutPlans/{planId}/workoutDays`

Stores the 7 workout days within a plan.

**Document ID**: Day identifier (e.g., `"monday"`, `"tuesday"`)

```typescript
interface WorkoutDay {
  id: string;                     // Document ID (day name)
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;  // 0 = Sunday, 6 = Saturday
  name: string;                   // Display name (e.g., "Chest & Triceps (Push) + Abs")
  focus: string;                  // Focus area (e.g., "Hypertrophy", "Low Impact HIIT")
  format?: string;                // Workout format (e.g., "Circuit: 3 rounds, 45s work, 15s rest")
  duration?: number;              // Estimated duration in minutes
  isRestDay: boolean;             // True for Saturday/Sunday rest days
  sortOrder: number;              // For custom ordering (0-6)
}
```

**Example Document** (`monday`):
```json
{
  "id": "monday",
  "dayOfWeek": 1,
  "name": "Chest & Triceps (Push) + Abs",
  "focus": "Hypertrophy (Muscle Growth)",
  "format": "Circuit: 3 rounds, 45 seconds work, 15 seconds rest",
  "duration": 35,
  "isRestDay": false,
  "sortOrder": 0
}
```

---

### 4. `users/{uid}/workoutPlans/{planId}/workoutDays/{dayId}/exercises`

Stores exercises for each workout day.

**Document ID**: Auto-generated

```typescript
interface Exercise {
  id: string;                     // Document ID
  name: string;                   // Exercise name
  instructions: string;           // Full instructions with form cues
  sets?: number;                  // Number of sets (if applicable)
  reps?: number | string;         // Reps per set or duration (e.g., 12, "45 seconds")
  tempo?: string;                 // Tempo instructions (e.g., "3 seconds down, 1 second up")
  notes?: string;                 // Additional notes or modifications
  sortOrder: number;              // Order within the workout
  category?: string;              // Optional category (e.g., "Core", "Upper", "Lower")
}
```

**Example Document**:
```json
{
  "id": "ex001",
  "name": "Push-ups (Slow Tempo)",
  "instructions": "3 seconds down, 1 second up. If too easy, elevate your feet on a chair.",
  "sets": 3,
  "reps": "45 seconds",
  "tempo": "3 seconds down, 1 second up",
  "sortOrder": 0,
  "category": "Push"
}
```

---

### 5. `users/{uid}/workoutSessions`

Logs each workout session performed by the user.

**Document ID**: Auto-generated

```typescript
interface WorkoutSession {
  id: string;                     // Document ID
  date: string;                   // ISO date (YYYY-MM-DD)
  workoutPlanId: string;          // Reference to workout plan
  workoutDayId: string;           // Reference to workout day (e.g., "monday")
  workoutDayName: string;         // Denormalized name for display
  startedAt: Timestamp;           // Session start time
  completedAt?: Timestamp;        // Session end time (null if in progress)
  status: 'in_progress' | 'completed' | 'cancelled';
  warmupCompleted: boolean;       // Whether warm-up was done
  notes?: string;                 // User notes for this session
  healthMetrics?: {
    heartRateAvg?: number;        // Average heart rate (from Google Fit)
    heartRateMax?: number;        // Max heart rate
    caloriesBurned?: number;      // Calories (from Google Fit)
    steps?: number;               // Steps during workout window
  };
  syncedAt?: Timestamp;           // When synced (for offline support)
}
```

**Example Document**:
```json
{
  "id": "sess-20260110-001",
  "date": "2026-01-10",
  "workoutPlanId": "default",
  "workoutDayId": "friday",
  "workoutDayName": "Full Body MetCon",
  "startedAt": "2026-01-10T06:30:00Z",
  "completedAt": "2026-01-10T07:05:00Z",
  "status": "completed",
  "warmupCompleted": true,
  "notes": "Felt strong today, increased dumbbell weight",
  "healthMetrics": {
    "heartRateAvg": 142,
    "heartRateMax": 168,
    "caloriesBurned": 285,
    "steps": 1200
  },
  "syncedAt": "2026-01-10T07:06:00Z"
}
```

---

### 6. `users/{uid}/workoutSessions/{sessionId}/exerciseCompletions`

Tracks completion of individual exercises within a session.

**Document ID**: Exercise ID from the workout day

```typescript
interface ExerciseCompletion {
  id: string;                     // Exercise ID (document ID)
  exerciseName: string;           // Denormalized name
  completedAt: Timestamp;         // When marked complete
  setsCompleted?: number;         // Actual sets completed (if tracking)
  repsCompleted?: number;         // Actual reps (if tracking)
  weight?: number;                // Weight used (for future enhancement)
  notes?: string;                 // Per-exercise notes
  skipped: boolean;               // True if explicitly skipped
  skipReason?: string;            // Why skipped (e.g., "knee pain")
}
```

---

### 7. `users/{uid}/googleFitTokens` (Secure Collection)

Stores encrypted Google Fit OAuth tokens. Separate collection for security.

**Document ID**: `"tokens"` (single document per user)

```typescript
interface GoogleFitTokens {
  accessToken: string;            // Encrypted access token
  refreshToken: string;           // Encrypted refresh token
  expiresAt: Timestamp;           // Token expiration
  scopes: string[];               // Granted OAuth scopes
  updatedAt: Timestamp;
}
```

**Security Note**: This collection has stricter Firestore rules - only backend service account can read/write.

---

### 8. `warmupRoutines` (Global Collection)

Stores the warm-up routine(s). Read-only for users.

**Document ID**: `"knee-shield"` (or other routine identifiers)

```typescript
interface WarmupRoutine {
  id: string;
  name: string;                   // "Knee-Shield Warm-Up Routine"
  description: string;
  duration: number;               // Estimated minutes
  movements: WarmupMovement[];
}

interface WarmupMovement {
  name: string;
  instructions: string;
  duration: string;               // e.g., "1 minute", "20 reps"
  purpose: string;                // Why this movement helps
  sortOrder: number;
}
```

---

## Indexes

### Composite Indexes Required

```json
{
  "indexes": [
    {
      "collectionGroup": "workoutSessions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "date", "order": "DESCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "exerciseCompletions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "completedAt", "order": "ASCENDING" }
      ]
    }
  ]
}
```

---

## Security Rules Summary

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Subcollections inherit user isolation
      match /{subcollection=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
    
    // Google Fit tokens - backend only (no client access)
    match /users/{userId}/googleFitTokens/{doc} {
      allow read, write: if false; // Only service account via Admin SDK
    }
    
    // Warm-up routines - read-only for authenticated users
    match /warmupRoutines/{routineId} {
      allow read: if request.auth != null;
      allow write: if false; // Admin only
    }
  }
}
```

---

## Entity Relationships

```
User (1) ────────────┬──────────────── (*) WorkoutSession
                     │                         │
                     │                         └──── (*) ExerciseCompletion
                     │
                     └──── (1) WorkoutPlan (active)
                                  │
                                  └──── (7) WorkoutDay
                                              │
                                              └──── (*) Exercise

WarmupRoutine (global, read-only)
     │
     └──── (*) WarmupMovement
```

---

## Migration: Default Workout Plan

On first user login, the system seeds their account with the default "Knee-Preservation Program" from `workoutplan-guide.md`. This is handled by:

1. Backend detects new user (no workout plan exists)
2. Copies from `seed/default_plan.py` to user's Firestore subcollections
3. Sets `isDefault: true` and `isActive: true`

Users can modify their copy without affecting the template.
