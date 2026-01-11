import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
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

// Root layout component that provides context and layout
function RootLayout() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ToastProvider>
            <OfflineIndicator />
            <div className="min-h-screen bg-background-dark pt-0">
              <Outlet />
            </div>
          </ToastProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

// Create data router with routes configuration
const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <NotFoundPage />,
    children: [
      // Public routes
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
      { path: 'forgot-password', element: <ForgotPassword /> },
      
      // Protected routes
      { index: true, element: <ProtectedRoute><Navigate to="/today" replace /></ProtectedRoute> },
      { path: 'today', element: <ProtectedRoute><Today /></ProtectedRoute> },
      { path: 'plan', element: <ProtectedRoute><Plan /></ProtectedRoute> },
      { path: 'plan/:dayId', element: <ProtectedRoute><EditWorkoutDay /></ProtectedRoute> },
      { path: 'history', element: <ProtectedRoute><History /></ProtectedRoute> },
      { path: 'history/:sessionId', element: <ProtectedRoute><SessionDetail /></ProtectedRoute> },
      { path: 'dashboard', element: <ProtectedRoute><Dashboard /></ProtectedRoute> },
      { path: 'warmup', element: <ProtectedRoute><WarmupRoutine /></ProtectedRoute> },
      { path: 'settings', element: <ProtectedRoute><Settings /></ProtectedRoute> },
      
      // 404
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
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
