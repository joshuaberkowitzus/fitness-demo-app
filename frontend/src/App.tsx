import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';

// Context
import { AuthProvider } from './context/AuthContext';

// Pages
import Today from './pages/Today';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Plan from './pages/Plan';
import EditWorkoutDay from './pages/EditWorkoutDay';
import Settings from './pages/Settings';
import History from './pages/History';
import SessionDetail from './pages/SessionDetail';
import Dashboard from './pages/Dashboard';
import WarmupRoutine from './pages/WarmupRoutine';

// Components
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ToastProvider } from './components/common/Toast';
import { OfflineIndicator } from './components/common/OfflineIndicator';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ToastProvider>
            <BrowserRouter>
              <OfflineIndicator />
              <div className="min-h-screen bg-background-dark pt-0">
                <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              
              {/* Protected routes */}
              <Route path="/" element={<ProtectedRoute><Navigate to="/today" replace /></ProtectedRoute>} />
              <Route path="/today" element={<ProtectedRoute><Today /></ProtectedRoute>} />
              <Route path="/plan" element={<ProtectedRoute><Plan /></ProtectedRoute>} />
              <Route path="/plan/:dayId" element={<ProtectedRoute><EditWorkoutDay /></ProtectedRoute>} />
              <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
              <Route path="/history/:sessionId" element={<ProtectedRoute><SessionDetail /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/warmup" element={<ProtectedRoute><WarmupRoutine /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              
              {/* 404 */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </div>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  </QueryClientProvider>
</ErrorBoundary>
  );
}

function NotFoundPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="card text-center">
        <h1 className="text-4xl font-bold text-fitness-danger mb-2">404</h1>
        <p className="text-text-secondary">Page not found</p>
        <a href="/" className="btn-primary mt-4 inline-block">
          Go Home
        </a>
      </div>
    </div>
  );
}

export default App;
