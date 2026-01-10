# Research: Fitness Tracker App

**Feature**: 001-fitness-tracker-app  
**Date**: 2026-01-10  
**Purpose**: Resolve technical unknowns and document best practices for implementation

---

## Research Topics

### 1. Google Fit / Health Connect API Integration

**Question**: How do we integrate Google Fit health metrics (heart rate, calories, activity) into a web application?

**Decision**: Use Google Fit REST API via backend OAuth 2.0 flow

**Rationale**: 
- Google Fit REST API is accessible from server-side applications
- OAuth 2.0 authorization code flow provides secure token management
- Backend handles token refresh and API calls, frontend remains simple
- Health Connect (Android API) is for native Android apps only; REST API works for web

**Implementation Approach**:
1. User initiates Google Fit connection from Settings page
2. Frontend redirects to Google OAuth consent screen
3. Google redirects back with authorization code
4. Backend exchanges code for access/refresh tokens
5. Backend stores encrypted tokens in Firestore (per-user)
6. Backend fetches health data on-demand or after workout completion
7. Data aggregated and returned to frontend for display

**API Endpoints Used**:
- `fitness.googleapis.com/v1/users/me/dataset:aggregate` - Heart rate, calories, steps
- OAuth scopes: `fitness.heart_rate.read`, `fitness.activity.read`, `fitness.body.read`

**Alternatives Considered**:
- **Health Connect SDK**: Rejected - requires native Android app, not web-compatible
- **Client-side Google Fit JS**: Rejected - exposes tokens to browser, security concern

---

### 2. Firebase Authentication Patterns

**Question**: What's the best approach for Firebase Auth with a React + FastAPI stack?

**Decision**: Firebase Auth on frontend with ID token verification on backend

**Rationale**:
- Firebase Auth SDK provides complete UI flows (sign-up, login, password reset)
- ID tokens are JWTs that FastAPI can verify using Firebase Admin SDK
- No need to build custom auth flows; Firebase handles security best practices
- Supports future social login additions without backend changes

**Implementation Approach**:
1. Frontend uses `firebase/auth` SDK for all auth operations
2. After login, frontend obtains ID token: `getIdToken()`
3. Frontend sends ID token in `Authorization: Bearer <token>` header
4. Backend middleware verifies token using `firebase_admin.auth.verify_id_token()`
5. Backend extracts `uid` from verified token for user identification
6. Firestore documents keyed by `uid` for data isolation

**Token Refresh Strategy**:
- Firebase SDK auto-refreshes ID tokens (valid 1 hour)
- Frontend uses `onIdTokenChanged()` listener to update stored token
- Failed API calls with 401 trigger token refresh and retry

**Alternatives Considered**:
- **Custom JWT auth**: Rejected - reinvents wheel, Firebase handles complexity
- **Session cookies**: Rejected - adds statefulness, complicates Firebase integration
- **Firebase Auth REST API only**: Rejected - SDK provides better UX with built-in UI

---

### 3. Offline Sync Strategy for Workout Logging

**Question**: How do we support offline workout logging with reliable sync-on-reconnect?

**Decision**: IndexedDB local storage with background sync queue

**Rationale**:
- Users may work out in gyms with poor connectivity
- Core use case (logging exercises) must not be blocked by network
- IndexedDB provides sufficient storage for workout sessions
- Service Worker can enable background sync when connection restored

**Implementation Approach**:
1. **Local-First Writes**: All exercise completions written to IndexedDB immediately
2. **Sync Queue**: Pending changes queued with timestamps and operation type
3. **Online Detection**: `navigator.onLine` + periodic heartbeat to API
4. **Background Sync**: When online, process queue in order (FIFO)
5. **Conflict Resolution**: Last-write-wins based on timestamp (simple, sufficient for single-user)
6. **Optimistic UI**: UI reflects local state immediately; sync happens invisibly

**Data Structure** (IndexedDB):
```javascript
// Store: pendingSyncs
{
  id: "uuid",
  type: "exercise_completion" | "session_start" | "session_end",
  payload: { ... },
  timestamp: "ISO8601",
  attempts: 0
}

// Store: workoutSessions
{
  id: "session-uuid",
  date: "2026-01-10",
  workoutDayId: "monday-chest",
  completedExercises: ["ex1", "ex2"],
  synced: false
}
```

**Sync Protocol**:
1. On app start: Check for pending syncs, attempt if online
2. On network change: If online, process queue
3. On exercise completion: Write local, queue sync, attempt if online
4. Retry with exponential backoff (max 3 attempts, then flag for manual retry)

**Alternatives Considered**:
- **localStorage**: Rejected - 5MB limit, no indexing, synchronous API
- **Firebase Offline Persistence**: Considered - but Firestore offline is for reads, not queued writes
- **PouchDB/CouchDB sync**: Rejected - adds complexity, overkill for single-user app

---

### 4. FastAPI with Firebase Admin SDK

**Question**: Best practices for integrating Firebase Admin SDK with FastAPI?

**Decision**: Singleton Firebase app initialization with dependency injection

**Rationale**:
- Firebase Admin SDK should initialize once at startup
- FastAPI's dependency injection provides clean access to Firebase services
- Async-compatible patterns needed for FastAPI's async endpoints

**Implementation Approach**:
```python
# app/services/firebase.py
import firebase_admin
from firebase_admin import credentials, firestore, auth
from functools import lru_cache

@lru_cache()
def get_firebase_app():
    cred = credentials.Certificate("service-account.json")
    return firebase_admin.initialize_app(cred)

def get_firestore_client():
    get_firebase_app()  # Ensure initialized
    return firestore.client()

def get_auth_client():
    get_firebase_app()
    return auth

# app/routers/auth.py
from fastapi import Depends, HTTPException, Header
from app.services.firebase import get_auth_client

async def verify_token(authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    try:
        decoded = get_auth_client().verify_id_token(token)
        return decoded["uid"]
    except Exception:
        raise HTTPException(401, "Invalid token")

@router.get("/me")
async def get_current_user(uid: str = Depends(verify_token)):
    # uid is verified user ID
    ...
```

**Alternatives Considered**:
- **Initialize per-request**: Rejected - wasteful, SDK designed for singleton
- **Global variable**: Works but dependency injection is more testable

---

### 5. React State Management for Workout Data

**Question**: What state management approach for workout plan and session data?

**Decision**: React Query (TanStack Query) for server state + Context for UI state

**Rationale**:
- Workout data is server state (fetched from API) - React Query excels here
- React Query provides caching, background refetch, optimistic updates
- Simple Context sufficient for UI state (current workout, exercise index)
- Avoids Redux complexity for a focused single-user app

**Implementation Approach**:
```typescript
// hooks/useWorkout.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useTodayWorkout() {
  return useQuery({
    queryKey: ['workout', 'today'],
    queryFn: () => api.getTodayWorkout(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCompleteExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (exerciseId: string) => api.completeExercise(exerciseId),
    onMutate: async (exerciseId) => {
      // Optimistic update
      await queryClient.cancelQueries(['workout', 'today']);
      const previous = queryClient.getQueryData(['workout', 'today']);
      queryClient.setQueryData(['workout', 'today'], (old) => ({
        ...old,
        completedExercises: [...old.completedExercises, exerciseId]
      }));
      return { previous };
    },
    onError: (err, _, context) => {
      // Rollback on error
      queryClient.setQueryData(['workout', 'today'], context.previous);
    },
  });
}
```

**Alternatives Considered**:
- **Redux Toolkit**: Rejected - overkill for single-user app with limited state
- **Zustand**: Good option, but React Query handles server state better
- **useState only**: Rejected - no caching, manual refetch logic needed

---

### 6. UI Framework for Attractive Design

**Question**: What UI approach for an attractive, modern fitness app interface?

**Decision**: Tailwind CSS + shadcn/ui components + custom fitness-themed design tokens

**Rationale**:
- Tailwind provides utility-first styling for rapid iteration
- shadcn/ui offers accessible, customizable React components (not a npm dependency)
- Design tokens allow consistent fitness-app branding (energetic colors, bold typography)
- Mobile-first responsive design built into Tailwind

**Design Token Examples**:
```css
/* tailwind.config.js theme extension */
colors: {
  fitness: {
    primary: '#10B981',    // Energetic green for completion
    secondary: '#6366F1',  // Purple for streaks/achievements
    warning: '#F59E0B',    // Orange for warm-up/caution
    background: '#0F172A', // Dark mode default
  }
}
```

**Component Strategy**:
- Copy shadcn/ui components as needed (Button, Card, Dialog, etc.)
- Custom components: ExerciseCard, WorkoutTimer, ProgressRing
- Animation: Framer Motion for completion celebrations, transitions

**Alternatives Considered**:
- **Material UI**: Rejected - heavier bundle, Google's design language less customizable
- **Chakra UI**: Good option, but shadcn/ui is more lightweight (copy, don't install)
- **Plain CSS/Sass**: Rejected - slower iteration, harder to maintain consistency

---

## Summary: Key Decisions

| Area | Decision | Confidence |
|------|----------|------------|
| Health Integration | Google Fit REST API (backend OAuth flow) | High |
| Authentication | Firebase Auth (frontend) + ID token verification (backend) | High |
| Offline Support | IndexedDB + sync queue with background sync | High |
| Backend Firebase | Singleton initialization + dependency injection | High |
| State Management | React Query for server state, Context for UI | High |
| UI Framework | Tailwind CSS + shadcn/ui + Framer Motion | High |

---

## Open Questions (None)

All technical unknowns have been resolved. Ready for Phase 1: Design.
