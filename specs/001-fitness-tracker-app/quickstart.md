# Quickstart: Fitness Tracker App

**Feature**: 001-fitness-tracker-app  
**Date**: 2026-01-10  
**Purpose**: Get the development environment running from scratch

---

## Prerequisites

Ensure you have the following installed:

| Tool | Version | Check Command |
|------|---------|---------------|
| Node.js | 18.x or 20.x | `node --version` |
| Python | 3.11+ | `python --version` |
| Git | 2.x+ | `git --version` |
| Firebase CLI | Latest | `firebase --version` |

### Install Firebase CLI (if needed)

```bash
npm install -g firebase-tools
firebase login
```

---

## 1. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/joshuaberkowitzus/fitness-demo-app.git
cd fitness-demo-app

# Checkout the feature branch
git checkout 001-fitness-tracker-app
```

---

## 2. Firebase Project Setup

### Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or select existing project
3. Enable the following services:
   - **Authentication** → Enable Email/Password provider
   - **Firestore Database** → Create in production mode
   - **Hosting** → Set up hosting

### Get Configuration Files

```bash
# Initialize Firebase in the project (select existing project)
firebase init

# Select these features:
# - Firestore
# - Hosting
# - Emulators (optional, for local development)
```

### Download Service Account Key

1. Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Save as `backend/service-account.json`
4. **⚠️ Never commit this file!** (already in .gitignore)

---

## 3. Backend Setup (Python/FastAPI)

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
```

### Configure Backend Environment

Edit `backend/.env`:

```env
# Firebase
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
FIREBASE_PROJECT_ID=your-project-id

# Google Fit OAuth (get from Google Cloud Console)
GOOGLE_FIT_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_FIT_CLIENT_SECRET=your-client-secret
GOOGLE_FIT_REDIRECT_URI=http://localhost:8000/api/v1/health/google-fit/callback

# Environment
ENVIRONMENT=development
DEBUG=true
```

### Google Fit API Setup (Optional)

If you want Google Fit integration:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable "Fitness API"
3. Create OAuth 2.0 credentials (Web application)
4. Add authorized redirect URIs:
   - `http://localhost:8000/api/v1/health/google-fit/callback`
5. Copy Client ID and Secret to `.env`

### Run Backend

```bash
# From backend/ directory with venv activated
uvicorn app.main:app --reload --port 8000

# API available at http://localhost:8000
# Docs at http://localhost:8000/docs
```

---

## 4. Frontend Setup (React)

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env.local
```

### Configure Frontend Environment

Edit `frontend/.env.local`:

```env
# Firebase Config (from Firebase Console → Project Settings → Your apps → Web app)
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123

# API
VITE_API_URL=http://localhost:8000
```

### Run Frontend

```bash
# From frontend/ directory
npm run dev

# App available at http://localhost:5173
```

---

## 5. Database Seed (First Run)

The backend automatically seeds the default workout plan on first user login. To manually seed:

```bash
cd backend

# With venv activated
python -m app.seed.default_plan --user-id YOUR_UID
```

Or let it happen automatically when a new user signs up.

---

## 6. Verify Setup

### Backend Health Check

```bash
curl http://localhost:8000/health
# Should return: {"status": "healthy"}
```

### Frontend Check

1. Open http://localhost:5173
2. You should see the login page
3. Create an account with email/password
4. After login, you should see today's workout

### Full Integration Test

1. Create account in frontend
2. Verify user appears in Firebase Auth Console
3. Verify user document created in Firestore
4. Complete an exercise
5. Verify session document created in Firestore

---

## 7. Firebase Emulators (Optional)

For fully local development without hitting production Firebase:

```bash
# Start emulators
firebase emulators:start

# Emulator UI at http://localhost:4000
```

Update `.env` files to point to emulators:

```env
# Backend .env
FIRESTORE_EMULATOR_HOST=localhost:8080
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099

# Frontend .env.local
VITE_USE_FIREBASE_EMULATOR=true
```

---

## Common Issues

### "Firebase app not initialized"

- Ensure `service-account.json` exists in `backend/`
- Check `GOOGLE_APPLICATION_CREDENTIALS` path in `.env`

### "CORS error" in browser

- Backend must have CORS configured for `http://localhost:5173`
- Check `app/main.py` CORS middleware

### "401 Unauthorized" on API calls

- Ensure Firebase Auth is working in frontend
- Check that ID token is being sent in Authorization header
- Verify backend can reach Firebase Auth API

### "Firestore permission denied"

- Deploy Firestore rules: `firebase deploy --only firestore:rules`
- Ensure user is authenticated before making requests

---

## Project Structure

```
fitness-demo-app/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI entry
│   │   ├── routers/         # API endpoints
│   │   ├── services/        # Business logic
│   │   └── models/          # Pydantic models
│   ├── tests/
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Route pages
│   │   ├── hooks/           # Custom hooks
│   │   └── services/        # API client
│   ├── package.json
│   └── .env.local
├── firebase/
│   ├── firestore.rules
│   └── firebase.json
└── specs/
    └── 001-fitness-tracker-app/
        ├── spec.md
        ├── plan.md
        ├── research.md
        ├── data-model.md
        └── contracts/
            └── api.yaml
```

---

## Next Steps

After setup is complete:

1. Run `/speckit.tasks` to generate implementation tasks
2. Follow the task sequence to build features
3. Run tests: `pytest` (backend), `npm test` (frontend)
4. Deploy: `firebase deploy`

---

## Useful Commands

```bash
# Backend
cd backend && source venv/bin/activate
uvicorn app.main:app --reload          # Run dev server
pytest                                   # Run tests
pytest --cov=app                        # Run tests with coverage

# Frontend
cd frontend
npm run dev                             # Run dev server
npm test                                # Run tests
npm run build                           # Production build
npm run lint                            # Lint check

# Firebase
firebase emulators:start                # Local emulators
firebase deploy                         # Deploy all
firebase deploy --only hosting          # Deploy frontend only
firebase deploy --only firestore:rules  # Deploy rules only
```
