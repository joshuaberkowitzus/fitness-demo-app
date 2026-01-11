# fitness-demo-app Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-01-10

## Active Technologies

- Python 3.11 (backend), TypeScript 5.x (frontend) + FastAPI 0.109+, React 18.x, Firebase SDK 10.x, Vite 5.x (001-fitness-tracker-app)

## Project Structure

```text
backend/
frontend/
firebase/
tests/
```

## Commands

cd src; pytest; ruff check .

## Deployment

### Backend (Cloud Run - Source Deploy)

Deploy directly from source without Artifact Registry:

```bash
cd backend
gcloud run deploy fitness-tracker-api \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8000 \
  --memory 512Mi \
  --timeout 60s \
  --cpu-boost \
  --set-env-vars "FIREBASE_PROJECT_ID=fitness-demo-8be1a,CORS_ORIGINS_STR=https://fitness-demo-8be1a.web.app,DEBUG=false"
```

### Frontend (Firebase Hosting)

```bash
cd frontend
npm run build
cd ../firebase
firebase deploy --only hosting
```

## Code Style

Python 3.11 (backend), TypeScript 5.x (frontend): Follow standard conventions

## Recent Changes

- 001-fitness-tracker-app: Added Python 3.11 (backend), TypeScript 5.x (frontend) + FastAPI 0.109+, React 18.x, Firebase SDK 10.x, Vite 5.x

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
