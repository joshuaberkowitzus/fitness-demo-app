````markdown
# Tasks: Fitness Tracker App

**Input**: Design documents from `/specs/001-fitness-tracker-app/`  
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓, quickstart.md ✓

**Tests**: Optional (not explicitly requested in spec - tests can be added per story if needed)

**Organization**: Tasks grouped by user story from spec.md (P1-P6) to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Based on plan.md structure:
- **Backend**: `backend/app/`, `backend/tests/`
- **Frontend**: `frontend/src/`, `frontend/tests/`
- **Firebase**: `firebase/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, configuration, and basic structure

- [X] T001 Create backend directory structure per plan.md: `backend/app/{models,routers,services,seed}/__init__.py`
- [X] T002 [P] Create frontend project with Vite + React + TypeScript in `frontend/`
- [X] T003 [P] Create firebase directory structure: `firebase/{firebase.json,firestore.rules,firestore.indexes.json,.firebaserc}`
- [X] T004 Initialize Python project with FastAPI dependencies in `backend/pyproject.toml`
- [X] T005 [P] Configure frontend dependencies (React Query, Firebase SDK, Tailwind, shadcn/ui) in `frontend/package.json`
- [X] T006 [P] Configure Tailwind CSS with fitness theme tokens in `frontend/tailwind.config.js`
- [X] T007 [P] Setup TypeScript configuration in `frontend/tsconfig.json`
- [X] T008 Create environment configuration module in `backend/app/config.py`
- [X] T009 [P] Create Firebase client configuration in `frontend/src/config/firebase.ts`
- [X] T010 [P] Create shared TypeScript type definitions in `frontend/src/types/index.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T011 Implement Firebase Admin SDK singleton wrapper in `backend/app/services/firebase.py`
- [X] T012 Create FastAPI application entry point with CORS in `backend/app/main.py`
- [X] T013 [P] Implement JWT token verification middleware in `backend/app/routers/auth.py`
- [X] T014 Setup Firestore security rules for user data isolation in `firebase/firestore.rules`
- [X] T015 [P] Configure Firestore composite indexes in `firebase/firestore.indexes.json`
- [X] T016 Create base Pydantic models for API responses in `backend/app/models/__init__.py`
- [X] T017 [P] Create authenticated API client with token injection in `frontend/src/services/api.ts`
- [X] T018 [P] Setup React Query provider and configuration in `frontend/src/App.tsx`
- [X] T019 [P] Create base UI components (Button, Card, Input) using shadcn/ui in `frontend/src/components/common/`
- [X] T020 Setup React Router with protected routes in `frontend/src/App.tsx`

**Checkpoint**: Foundation ready - user story implementation can now begin ✅

---

## Phase 3: User Story 1 - Daily Workout Execution & Logging (Priority: P1) 🎯 MVP

**Goal**: Users can view today's scheduled workout, see all exercises with instructions, and mark exercises complete

**Independent Test**: Open app on Monday → see "Chest & Triceps" workout → complete exercises → verify checkmarks persist after app reload

### Backend for User Story 1

- [X] T021 [US1] Create Workout Pydantic models (WorkoutPlan, WorkoutDay, Exercise) in `backend/app/models/workout.py`
- [X] T022 [US1] Create Session Pydantic models (WorkoutSession, ExerciseCompletion) in `backend/app/models/session.py`
- [X] T023 [US1] Implement WorkoutService with get_today_workout, get_workout_day in `backend/app/services/workout_service.py`
- [X] T024 [US1] Implement SessionService with start_session, complete_exercise, get_current_session in `backend/app/services/session_service.py`
- [X] T025 [US1] Create GET /api/v1/workouts/today endpoint in `backend/app/routers/workouts.py`
- [X] T026 [US1] Create GET /api/v1/workouts/days/{dayId} endpoint in `backend/app/routers/workouts.py`
- [X] T027 [US1] Create POST /api/v1/sessions (start session) endpoint in `backend/app/routers/sessions.py`
- [X] T028 [US1] Create GET /api/v1/sessions/current endpoint in `backend/app/routers/sessions.py`
- [X] T029 [US1] Create POST /api/v1/sessions/{sessionId}/exercises/{exerciseId}/complete endpoint in `backend/app/routers/sessions.py`
- [X] T030 [US1] Create POST /api/v1/sessions/{sessionId}/exercises/{exerciseId}/undo endpoint in `backend/app/routers/sessions.py`
- [X] T031 [US1] Create default workout plan seed data from workoutplan-guide.md in `backend/app/seed/default_plan.py`

### Frontend for User Story 1

- [X] T032 [P] [US1] Create useWorkout hook with React Query for workout data in `frontend/src/hooks/useWorkout.ts`
- [X] T033 [P] [US1] Create useSession hook for session management with optimistic updates in `frontend/src/hooks/useSession.ts`
- [X] T034 [US1] Create ExerciseCard component with completion state in `frontend/src/components/exercise/ExerciseCard.tsx`
- [X] T035 [P] [US1] Create ExerciseDetail modal component in `frontend/src/components/exercise/ExerciseDetail.tsx`
- [X] T036 [US1] Create WorkoutHeader component showing day name and focus in `frontend/src/components/workout/WorkoutHeader.tsx`
- [X] T037 [US1] Create WorkoutProgress component showing X/Y exercises in `frontend/src/components/workout/WorkoutProgress.tsx`
- [X] T038 [US1] Create Today page with workout display and exercise list in `frontend/src/pages/Today.tsx`
- [X] T039 [US1] Add Framer Motion animations for exercise completion in `frontend/src/components/exercise/ExerciseCard.tsx`
- [X] T040 [US1] Handle rest day display (Saturday/Sunday) in `frontend/src/pages/Today.tsx`

**Checkpoint**: User Story 1 complete - users can view and log today's workout ✅

---

## Phase 4: User Story 2 - User Registration & Secure Login (Priority: P2)

**Goal**: Users can create accounts, log in securely, and their data persists across sessions

**Independent Test**: Create account → log out → log back in → verify identity maintained

### Backend for User Story 2

- [X] T041 [US2] Create User Pydantic models in `backend/app/models/user.py`
- [X] T042 [US2] Create GET /api/v1/auth/verify endpoint in `backend/app/routers/auth.py`
- [X] T042b [US2] Create users router file with router setup in `backend/app/routers/users.py`
- [X] T043 [US2] Create GET /api/v1/users/me endpoint in `backend/app/routers/users.py`
- [X] T044 [US2] Create POST /api/v1/users/me/initialize endpoint (seeds default plan) in `backend/app/routers/users.py`
- [X] T045 [US2] Implement UserService with initialize_user, get_user in `backend/app/services/user_service.py`

### Frontend for User Story 2

- [X] T046 [US2] Create useAuth hook with Firebase Auth in `frontend/src/hooks/useAuth.ts`
- [X] T047 [US2] Create AuthContext for global auth state in `frontend/src/context/AuthContext.tsx`
- [X] T048 [US2] Create Login page with email/password form in `frontend/src/pages/Login.tsx`
- [X] T049 [P] [US2] Create Register page with validation in `frontend/src/pages/Register.tsx`
- [X] T050 [P] [US2] Create ForgotPassword page in `frontend/src/pages/ForgotPassword.tsx`
- [X] T051 [US2] Implement protected route wrapper component in `frontend/src/components/common/ProtectedRoute.tsx`
- [X] T052 [US2] Add auth state persistence check on app load in `frontend/src/App.tsx`
- [X] T053 [US2] Auto-initialize new users on first login (call /users/me/initialize) in `frontend/src/hooks/useAuth.ts`

**Checkpoint**: User Story 2 complete - secure auth flow working ✅

---

## Phase 5: User Story 3 - Workout Plan Management (Priority: P3)

**Goal**: Users can view, edit, customize their workout plan and reset to defaults

**Independent Test**: Edit Tuesday workout → add exercise → save → verify changes persist

### Backend for User Story 3

- [X] T054 [US3] Create GET /api/v1/workouts/plan endpoint in `backend/app/routers/workouts.py`
- [X] T055 [US3] Create PUT /api/v1/workouts/plan endpoint in `backend/app/routers/workouts.py`
- [X] T056 [US3] Create POST /api/v1/workouts/plan/reset endpoint in `backend/app/routers/workouts.py`
- [X] T057 [US3] Create PUT /api/v1/workouts/days/{dayId} endpoint in `backend/app/routers/workouts.py`
- [X] T058 [US3] Create GET /api/v1/workouts/days/{dayId}/exercises endpoint in `backend/app/routers/workouts.py`
- [X] T059 [US3] Create POST /api/v1/workouts/days/{dayId}/exercises endpoint in `backend/app/routers/workouts.py`
- [X] T060 [US3] Create PUT /api/v1/workouts/days/{dayId}/exercises/{exerciseId} endpoint in `backend/app/routers/workouts.py`
- [X] T061 [US3] Create DELETE /api/v1/workouts/days/{dayId}/exercises/{exerciseId} endpoint in `backend/app/routers/workouts.py`
- [X] T062 [US3] Add update/reset methods to WorkoutService in `backend/app/services/workout_service.py`

### Frontend for User Story 3

- [X] T063 [US3] Create Plan page with weekly overview in `frontend/src/pages/Plan.tsx`
- [X] T064 [US3] Create WorkoutDayCard component (clickable to edit) in `frontend/src/components/workout/WorkoutDayCard.tsx`
- [X] T065 [US3] Create EditWorkoutDay page/modal in `frontend/src/pages/EditWorkoutDay.tsx`
- [X] T066 [US3] Create ExerciseForm component for add/edit in `frontend/src/components/exercise/ExerciseForm.tsx`
- [X] T067 [US3] Create drag-and-drop exercise reordering in `frontend/src/pages/EditWorkoutDay.tsx` (using Framer Motion Reorder)
- [X] T068 [US3] Add reset to default confirmation dialog in `frontend/src/components/workout/ResetPlanDialog.tsx`
- [X] T069 [US3] Implement unsaved changes warning on navigate away in `frontend/src/hooks/useUnsavedChanges.ts`

**Checkpoint**: User Story 3 complete - workout customization working ✅

---

## Phase 6: User Story 4 - Google Fit Integration (Priority: P4)

**Goal**: Users can connect Google Fit and see health metrics (heart rate, calories) alongside workout logs

**Independent Test**: Connect Google Fit → complete workout → verify synced metrics appear

### Backend for User Story 4

- [X] T070 [US4] Create GoogleFitTokens model in `backend/app/models/health.py`
- [X] T071 [US4] Implement GoogleFitService with OAuth flow in `backend/app/services/google_fit.py`
- [X] T072 [US4] Create GET /api/v1/health/google-fit/auth-url endpoint in `backend/app/routers/health.py`
- [X] T073 [US4] Create POST /api/v1/health/google-fit/callback endpoint in `backend/app/routers/health.py`
- [X] T074 [US4] Create GET /api/v1/health/google-fit/status endpoint in `backend/app/routers/health.py`
- [X] T075 [US4] Create DELETE /api/v1/health/google-fit/disconnect endpoint in `backend/app/routers/health.py`
- [X] T076 [US4] Create GET /api/v1/health/metrics endpoint (fetch from Google Fit API) in `backend/app/routers/health.py`
- [X] T077 [US4] Add encrypted token storage/retrieval to GoogleFitService in `backend/app/services/google_fit.py`
- [X] T078 [US4] Implement automatic health metrics fetch on session completion in `backend/app/services/session_service.py`

### Frontend for User Story 4

- [X] T079 [US4] Create Settings page with Google Fit section in `frontend/src/pages/Settings.tsx`
- [X] T080 [US4] Create GoogleFitConnect component with OAuth redirect in `frontend/src/components/health/GoogleFitConnect.tsx`
- [X] T081 [US4] Create HealthMetricsCard component for workout sessions in `frontend/src/components/health/HealthMetricsCard.tsx`
- [X] T082 [US4] Integrate health metrics display into workout session view in `frontend/src/pages/Today.tsx`
- [X] T083 [US4] Handle Google Fit unavailable state gracefully in `frontend/src/components/health/HealthMetricsCard.tsx`

**Checkpoint**: User Story 4 complete - Google Fit integration working ✅

---

## Phase 7: User Story 5 - Progress Dashboard & History (Priority: P5)

**Goal**: Users can view workout history, streaks, and progress trends

**Independent Test**: Log workouts over multiple days → view history → verify accurate records with dates

### Backend for User Story 5

- [X] T084 [US5] Create GET /api/v1/sessions (list with pagination) endpoint in `backend/app/routers/sessions.py`
- [X] T085 [US5] Create GET /api/v1/sessions/{sessionId} endpoint in `backend/app/routers/sessions.py`
- [X] T086 [US5] Create GET /api/v1/users/me/stats endpoint (streaks, totals) in `backend/app/routers/users.py`
- [X] T087 [US5] Add calculate_streaks, calculate_stats methods to UserService in `backend/app/services/user_service.py`
- [X] T088 [US5] Add list_sessions method with date filtering to SessionService in `backend/app/services/session_service.py`

### Frontend for User Story 5

- [X] T089 [US5] Create History page with session list in `frontend/src/pages/History.tsx`
- [X] T090 [US5] Create SessionHistoryCard component in `frontend/src/components/dashboard/SessionHistoryCard.tsx`
- [X] T091 [US5] Create SessionDetail page/modal showing completed exercises in `frontend/src/pages/SessionDetail.tsx`
- [X] T091b [US5] Create SessionNotesInput component for adding notes to workouts (FR-030) in `frontend/src/components/session/SessionNotesInput.tsx`
- [X] T092 [US5] Create Dashboard page with stats overview in `frontend/src/pages/Dashboard.tsx`
- [X] T093 [US5] Create StreakDisplay component in `frontend/src/components/dashboard/StreakDisplay.tsx`
- [X] T094 [US5] Create WeeklySummary component in `frontend/src/components/dashboard/WeeklySummary.tsx`
- [X] T095 [US5] Create simple progress chart (workout frequency) in `frontend/src/components/dashboard/ProgressChart.tsx`

**Checkpoint**: User Story 5 complete - history and progress working ✅

---

## Phase 8: User Story 6 - Warm-up Guidance Integration (Priority: P6)

**Goal**: Users are prompted with the knee-shield warm-up routine before main workouts

**Independent Test**: Start workout → see warm-up routine with 6 movements → complete or skip → proceed to main workout

### Backend for User Story 6

- [X] T096 [US6] Create WarmupRoutine model in `backend/app/models/warmup.py`
- [X] T097 [US6] Create GET /api/v1/warmup endpoint in `backend/app/routers/warmup.py`
- [X] T098 [US6] Create knee-shield warm-up seed data in `backend/app/seed/warmup_routine.py`
- [X] T099 [US6] Add warmupCompleted field handling to SessionService in `backend/app/services/session_service.py`

### Frontend for User Story 6

- [X] T100 [US6] Create WarmupRoutine page/modal in `frontend/src/pages/WarmupRoutine.tsx`
- [X] T101 [US6] Create WarmupMovementCard component in `frontend/src/components/warmup/WarmupMovementCard.tsx`
- [X] T102 [US6] Integrate warm-up prompt before workout start in `frontend/src/pages/Today.tsx`
- [X] T103 [US6] Add skip warm-up option with reminder message in `frontend/src/pages/WarmupRoutine.tsx`
- [X] T104 [US6] Track warmupCompleted status in session in `frontend/src/hooks/useSession.ts`

**Checkpoint**: User Story 6 complete - warm-up guidance working ✅

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Offline support, error handling, and final polish

### Offline Support

- [X] T105 [P] Implement IndexedDB storage service in `frontend/src/services/storage.ts`
- [X] T106 Create offline sync queue with pending operations in `frontend/src/services/syncQueue.ts`
- [X] T107 Implement useOffline hook with online detection in `frontend/src/hooks/useOffline.ts`
- [X] T108 Add offline-first write logic to useSession hook in `frontend/src/hooks/useSession.ts`
- [X] T109 Create offline indicator UI component in `frontend/src/components/common/OfflineIndicator.tsx`

### Error Handling & UX

- [X] T110 [P] Create global error boundary in `frontend/src/components/common/ErrorBoundary.tsx`
- [X] T111 [P] Create Toast notification system in `frontend/src/components/common/Toast.tsx`
- [X] T112 Add loading states to all pages in `frontend/src/components/common/LoadingSpinner.tsx`
- [X] T113 [P] Add 404 and error pages in `frontend/src/pages/NotFound.tsx`

### Backend Polish

- [X] T114 [P] Add request logging middleware in `backend/app/main.py`
- [X] T115 [P] Add comprehensive error responses (HTTPException details) in `backend/app/main.py`
- [X] T116 Create Dockerfile for backend deployment in `backend/Dockerfile`
- [X] T117 Create requirements.txt from pyproject.toml in `backend/requirements.txt`

### Documentation & Validation

- [X] T118 [P] Update README.md with setup and run instructions in `README.md`
- [X] T119 Run quickstart.md validation checklist
- [X] T120 Final code review and cleanup across all files

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1: Setup ──────────────────────────────────────────────────────────────────►
                 │
Phase 2: Foundational ─────────────────────► (BLOCKS ALL USER STORIES)
                 │
                 ▼
         ┌──────────────────────────────────────────────────────────────────────┐
         │                    USER STORIES CAN PARALLELIZE                       │
         │                                                                       │
         │   Phase 3: US1 (MVP) ──► Phase 4: US2 ──► Phase 5: US3              │
         │                          │                  │                        │
         │                          │   Phase 6: US4 ──┘                        │
         │                          │        │                                  │
         │                          │   Phase 7: US5                           │
         │                          │        │                                  │
         │                          │   Phase 8: US6                           │
         └──────────────────────────────────────────────────────────────────────┘
                 │
Phase 9: Polish ─────────────────────────────────────────────────────────────────►
```

### User Story Dependencies

| Story | Can Start After | Dependencies on Other Stories |
|-------|-----------------|------------------------------|
| **US1** (P1) | Phase 2 complete | None - fully independent |
| **US2** (P2) | Phase 2 complete | None - can parallelize with US1 |
| **US3** (P3) | Phase 2 complete | Uses workout models from US1 implementation |
| **US4** (P4) | Phase 2 complete | Integrates with sessions (US1) |
| **US5** (P5) | Phase 2 complete | Reads sessions created by US1 |
| **US6** (P6) | Phase 2 complete | Integrates with workout flow (US1) |

### Within Each User Story

1. Backend models before services
2. Backend services before endpoints
3. Backend endpoints before frontend hooks
4. Frontend hooks before components
5. Components before pages

### Parallel Opportunities

**Setup Phase (T001-T010)**:
- T002, T003, T006, T007, T009, T010 can all run in parallel

**Foundational Phase (T011-T020)**:
- T013, T015, T017, T018, T019 can run in parallel after T011, T012

**User Story 1 Backend (T021-T031)**:
- T021, T022 can run in parallel (models)
- T025, T026 can run in parallel after T023

**User Story 1 Frontend (T032-T040)**:
- T032, T033 can run in parallel (hooks)
- T034, T035, T036, T037 can run in parallel (components)

---

## Parallel Example: User Story 1

```bash
# Launch all models together:
Task T021: "Create Workout Pydantic models in backend/app/models/workout.py"
Task T022: "Create Session Pydantic models in backend/app/models/session.py"

# After models complete, launch services:
Task T023: "Implement WorkoutService in backend/app/services/workout_service.py"
Task T024: "Implement SessionService in backend/app/services/session_service.py"

# After services complete, launch endpoints:
Task T025: "GET /api/v1/workouts/today endpoint in backend/app/routers/workouts.py"
Task T027: "POST /api/v1/sessions endpoint in backend/app/routers/sessions.py"

# Frontend can start once endpoints exist:
Task T032: "Create useWorkout hook in frontend/src/hooks/useWorkout.ts"
Task T033: "Create useSession hook in frontend/src/hooks/useSession.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. **Complete Phase 1**: Setup (~10 tasks)
2. **Complete Phase 2**: Foundational (~10 tasks) - CRITICAL GATE
3. **Complete Phase 3**: User Story 1 (~20 tasks)
4. **STOP and VALIDATE**: Test US1 independently
   - Can view today's workout
   - Can complete exercises
   - Progress persists after refresh
5. **Deploy/Demo MVP** ✅

### Incremental Delivery

| Increment | Stories Included | Total Tasks | Value Delivered |
|-----------|------------------|-------------|-----------------|
| MVP | US1 | ~40 | View & log workouts |
| Auth | US1 + US2 | ~53 | + Secure login, persistence |
| Customize | US1-3 | ~69 | + Plan editing |
| Health | US1-4 | ~83 | + Google Fit metrics |
| Progress | US1-5 | ~95 | + History & dashboards |
| Complete | US1-6 | ~104 | + Warm-up guidance |
| Polished | All | ~120 | + Offline, error handling |

### Parallel Team Strategy

With 2 developers after Phase 2:

- **Developer A**: US1 (MVP) → US3 (Customize)
- **Developer B**: US2 (Auth) → US4 (Google Fit)

With 3 developers:

- **Developer A**: US1 (MVP core)
- **Developer B**: US2 (Auth) → US5 (Dashboard)
- **Developer C**: US3 (Customize) → US6 (Warm-up)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Firebase config requires manual Firebase Console setup (see quickstart.md)
- Google Fit OAuth requires Google Cloud Console credentials setup

---

## Summary

| Metric | Value |
|--------|-------|
| **Total Tasks** | 120 |
| **Setup Tasks** | 10 |
| **Foundational Tasks** | 10 |
| **US1 Tasks (MVP)** | 20 |
| **US2 Tasks** | 13 |
| **US3 Tasks** | 16 |
| **US4 Tasks** | 14 |
| **US5 Tasks** | 12 |
| **US6 Tasks** | 9 |
| **Polish Tasks** | 16 |
| **Parallel Opportunities** | 45+ tasks marked [P] |
| **MVP Scope** | Phase 1 + 2 + 3 (~40 tasks) |

````