/**
 * Login Page (T048)
 * 
 * Handles user authentication via Firebase Auth.
 */

import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button, Card, Input, LoadingSpinner } from '../components/common';
import { useAuthContext } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signInWithGoogle, signInWithEmail, loading, error, isAuthenticated, clearError } = useAuthContext();
  
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showEmailForm, setShowEmailForm] = useState(false);
  
  // Redirect to intended page after login
  const from = (location.state as { from?: Location })?.from?.pathname || '/today';
  
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    clearError();
  };
  
  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error('Sign in failed:', err);
    }
  };
  
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmail(formData.email, formData.password);
    } catch (err) {
      console.error('Sign in failed:', err);
    }
  };
  
  if (loading && !showEmailForm) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background-dark">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background-dark flex flex-col items-center justify-center px-4">
      {/* Logo / Branding */}
      <motion.div
        className="mb-8 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-6xl mb-4">🏋️</div>
        <h1 className="text-3xl font-bold text-text-primary">Fitness Tracker</h1>
        <p className="text-text-secondary mt-2">
          Your personal knee-friendly workout companion
        </p>
      </motion.div>
      
      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-sm"
      >
        <Card className="p-8">
          <h2 className="text-xl font-semibold text-text-primary text-center mb-6">
            {showEmailForm ? 'Sign In with Email' : 'Get Started'}
          </h2>
          
          {/* Error Message */}
          {error && (
            <motion.div
              className="mb-4 p-3 bg-fitness-error/10 border border-fitness-error/30 rounded-lg"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <p className="text-fitness-error text-sm text-center">
                {error.message || 'Sign in failed. Please try again.'}
              </p>
            </motion.div>
          )}
          
          {showEmailForm ? (
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <Input
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                autoComplete="email"
                autoFocus
              />
              <Input
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Your password"
                autoComplete="current-password"
              />
              
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={loading}
              >
                {loading ? <LoadingSpinner size="sm" /> : 'Sign In'}
              </Button>
              
              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => setShowEmailForm(false)}
                  className="text-text-secondary hover:text-text-primary transition-colors"
                >
                  ← Back
                </button>
                <Link
                  to="/forgot-password"
                  className="text-fitness-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            </form>
          ) : (
            <>
              {/* Google Sign In Button */}
              <Button
                variant="primary"
                size="lg"
                className="w-full flex items-center justify-center gap-3"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                {loading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <GoogleIcon />
                    <span>Continue with Google</span>
                  </>
                )}
              </Button>
              
              {/* Divider */}
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-gray-700" />
                <span className="text-text-muted text-sm">or</span>
                <div className="flex-1 h-px bg-gray-700" />
              </div>
              
              {/* Email Sign In */}
              <Button
                variant="secondary"
                size="lg"
                className="w-full"
                onClick={() => setShowEmailForm(true)}
              >
                Continue with Email
              </Button>
              
              {/* Register Link */}
              <p className="text-text-secondary text-sm text-center mt-6">
                Don't have an account?{' '}
                <Link to="/register" className="text-fitness-primary hover:underline">
                  Sign up
                </Link>
              </p>
            </>
          )}
          
          {/* Terms */}
          <p className="text-text-muted text-xs text-center mt-6">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </Card>
      </motion.div>
      
      {/* Features List */}
      <motion.div
        className="mt-12 grid grid-cols-3 gap-6 max-w-lg text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <FeatureItem icon="📊" title="Track Progress" />
        <FeatureItem icon="🦵" title="Knee-Friendly" />
        <FeatureItem icon="📱" title="Simple UI" />
      </motion.div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function FeatureItem({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-3xl">{icon}</span>
      <span className="text-text-secondary text-sm">{title}</span>
    </div>
  );
}
