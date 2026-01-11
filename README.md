# Fitness Tracker App

A modern, full-stack fitness tracking application with progressive overload support, warm-up guidance, and Google Fit integration.

## Features

- **🏋️ Exercise Tracking**: Track your workouts with sets, reps, and weights
- **📈 Progressive Overload**: Automatic tracking and suggestions for progression
- **🔥 Warm-up Guidance**: Knee-friendly warm-up routines before workouts
- **📊 Progress Dashboard**: Visualize your fitness journey
- **🔄 Google Fit Integration**: Sync with Google Fit for comprehensive health data
- **📱 Offline Support**: Continue tracking even without internet connection
- **🔐 Secure Authentication**: Firebase Auth with Google and email/password

## Tech Stack

### Backend
- **Python 3.11** with FastAPI
- **Firebase Admin SDK** for Firestore & Authentication
- **Pydantic 2.x** for data validation
- **Google API Client** for Google Fit integration

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **TailwindCSS 4.x** for styling
- **React Query** for server state management
- **Framer Motion** for animations
- **IndexedDB** for offline storage

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- Firebase project with Firestore and Authentication enabled
- (Optional) Google Cloud project for Google Fit API

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file with your configuration:
   ```env
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
   GOOGLE_FIT_CLIENT_ID=your-client-id
   GOOGLE_FIT_CLIENT_SECRET=your-client-secret
   CORS_ORIGINS=http://localhost:5173
   ```

5. Run the development server:
   ```bash
   uvicorn app.main:app --reload
   ```

The API will be available at `http://localhost:8000`.

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with your Firebase config:
   ```env
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   VITE_API_URL=http://localhost:8000
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

The app will be available at `http://localhost:5173`.

### Docker Setup

To run the backend with Docker:

```bash
cd backend
docker build -t fitness-tracker-api .
docker run -p 8000:8000 --env-file .env fitness-tracker-api
```

## Google Fit Integration Setup

To enable Google Fit integration for health metrics (heart rate, calories, steps), follow these steps:

### 1. Enable Required APIs

```bash
gcloud services enable fitness.googleapis.com secretmanager.googleapis.com --project=YOUR_PROJECT_ID
```

### 2. Create OAuth Consent Screen

1. Go to [OAuth Consent Screen](https://console.cloud.google.com/apis/credentials/consent)
2. Select **External** user type
3. Fill in the required fields:
   - App name: "Fitness Tracker"
   - User support email: Your email
   - Developer contact: Your email
4. Add the following scopes:
   - `https://www.googleapis.com/auth/fitness.heart_rate.read`
   - `https://www.googleapis.com/auth/fitness.activity.read`
   - `https://www.googleapis.com/auth/fitness.body.read`
5. Add your email as a **test user** (required while app is in testing mode)

### 3. Create OAuth Client ID

1. Go to [Credentials](https://console.cloud.google.com/apis/credentials)
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. Select **Web application**
4. Name: "Fitness Tracker Web"
5. Add **Authorized JavaScript origins**:
   - `https://your-frontend-url` (e.g., `https://fitness-demo-8be1a.web.app`)
6. Add **Authorized redirect URIs**:
   - `https://your-frontend-url/settings` (e.g., `https://fitness-demo-8be1a.web.app/settings`)
7. Click **Create** and save the **Client ID** and **Client Secret**

### 4. Store Credentials in Secret Manager

```bash
# Store OAuth credentials
echo -n "YOUR_CLIENT_ID" | gcloud secrets create google-client-id --data-file=- --project=YOUR_PROJECT_ID
echo -n "YOUR_CLIENT_SECRET" | gcloud secrets create google-client-secret --data-file=- --project=YOUR_PROJECT_ID

# Generate and store encryption key for token storage
# PowerShell:
$bytes = New-Object byte[] 32; (New-Object Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytes); $key = [Convert]::ToBase64String($bytes); $key | gcloud secrets create google-fit-encryption-key --data-file=- --project=YOUR_PROJECT_ID

# Bash/Linux:
openssl rand -base64 32 | gcloud secrets create google-fit-encryption-key --data-file=- --project=YOUR_PROJECT_ID
```

### 5. Grant Cloud Run Access to Secrets

```bash
# Get your project number
PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID --format="value(projectNumber)")

# Grant access to each secret
gcloud secrets add-iam-policy-binding google-client-id \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=YOUR_PROJECT_ID

gcloud secrets add-iam-policy-binding google-client-secret \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=YOUR_PROJECT_ID

gcloud secrets add-iam-policy-binding google-fit-encryption-key \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=YOUR_PROJECT_ID
```

### 6. Deploy with Secrets

The `cloudbuild.yaml` is already configured to use these secrets. Deploy with:

```bash
cd backend
gcloud builds submit --config=cloudbuild.yaml --project=YOUR_PROJECT_ID
```

Or manually include secrets in your deploy command:

```bash
gcloud run deploy fitness-tracker-api \
  --source . \
  --region us-central1 \
  --set-secrets "GOOGLE_CLIENT_ID=google-client-id:latest,GOOGLE_CLIENT_SECRET=google-client-secret:latest,GOOGLE_FIT_ENCRYPTION_KEY=google-fit-encryption-key:latest"
```

## Deployment

### Backend (Cloud Run)

Deploy the backend using Cloud Build (recommended for production):

```bash
cd backend
gcloud builds submit --config=cloudbuild.yaml --project=YOUR_PROJECT_ID
```

Or deploy directly from source:

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
  --set-env-vars "FIREBASE_PROJECT_ID=your-project-id,CORS_ORIGINS_STR=https://your-frontend-url,DEBUG=false"
```

### Frontend (Firebase Hosting)

Build and deploy the frontend to Firebase Hosting:

```bash
cd frontend
npm run build
cd ../firebase
firebase deploy --only hosting
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/health` | Health check |
| POST | `/api/v1/auth/verify` | Verify Firebase token |
| GET | `/api/v1/users/me` | Get current user profile |
| PUT | `/api/v1/users/me` | Update user profile |
| GET | `/api/v1/workouts/plan` | Get workout plan |
| PUT | `/api/v1/workouts/plan` | Update workout plan |
| GET | `/api/v1/sessions` | List workout sessions |
| POST | `/api/v1/sessions` | Create new session |
| GET | `/api/v1/sessions/{id}` | Get session details |
| PUT | `/api/v1/sessions/{id}` | Update session |
| GET | `/api/v1/warmup` | Get warm-up routine |
| POST | `/api/v1/health/google-fit/connect` | Connect Google Fit |
| GET | `/api/v1/health/google-fit/data` | Get Google Fit data |

## Project Structure

```
fitness-demo-app/
├── backend/
│   ├── app/
│   │   ├── models/       # Pydantic models
│   │   ├── routers/      # API endpoints
│   │   ├── services/     # Business logic
│   │   ├── middleware/   # Auth middleware
│   │   └── main.py       # App entry point
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── hooks/        # Custom hooks
│   │   ├── services/     # API & storage services
│   │   └── context/      # React contexts
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## Testing

### Backend
```bash
cd backend
pytest --cov=app tests/
```

### Frontend
```bash
cd frontend
npm test
```

## Environment Variables

### Backend

| Variable | Description | Required |
|----------|-------------|----------|
| `FIREBASE_PROJECT_ID` | Firebase project ID | Yes |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | Path to service account JSON | Yes |
| `GOOGLE_FIT_CLIENT_ID` | Google Fit OAuth client ID | No |
| `GOOGLE_FIT_CLIENT_SECRET` | Google Fit OAuth client secret | No |
| `CORS_ORIGINS` | Allowed CORS origins | Yes |

### Frontend

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_FIREBASE_API_KEY` | Firebase API key | Yes |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | Yes |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID | Yes |
| `VITE_API_URL` | Backend API URL | Yes |

## License

MIT License - see [LICENSE](LICENSE) for details.
