/**
 * Register Page (T049)
 * 
 * User registration with email/password and validation.
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button, Card, Input, LoadingSpinner } from '../components/common';
import { useAuthContext } from '../context/AuthContext';

export default function Register() {
  const navigate = useNavigate();
  const { signUpWithEmail, signInWithGoogle, loading, error, clearError } = useAuthContext();
  
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setValidationError(null);
    clearError();
  };
  
  const validateForm = (): boolean => {
    if (!formData.email || !formData.password) {
      setValidationError('Email and password are required');
      return false;
    }
    
    if (formData.password.length < 6) {
      setValidationError('Password must be at least 6 characters');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setValidationError('Passwords do not match');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setValidationError('Please enter a valid email address');
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      await signUpWithEmail(formData.email, formData.password, formData.displayName || undefined);
      navigate('/today', { replace: true });
    } catch (err) {
      console.error('Sign up failed:', err);
    }
  };
  
  const handleGoogleSignUp = async () => {
    try {
      await signInWithGoogle();
      navigate('/today', { replace: true });
    } catch (err) {
      console.error('Google sign up failed:', err);
    }
  };
  
  const displayError = validationError || error?.message;
  
  return (
    <div className="min-h-screen bg-background-dark flex flex-col items-center justify-center px-4">
      {/* Logo / Branding */}
      <motion.div
        className="mb-8 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-6xl mb-4">🏋️</div>
        <h1 className="text-3xl font-bold text-text-primary">Create Account</h1>
        <p className="text-text-secondary mt-2">
          Start your fitness journey today
        </p>
      </motion.div>
      
      {/* Register Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-sm"
      >
        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Display Name */}
            <Input
              label="Display Name"
              name="displayName"
              type="text"
              value={formData.displayName}
              onChange={handleChange}
              placeholder="Your name (optional)"
              autoComplete="name"
            />
            
            {/* Email */}
            <Input
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
            
            {/* Password */}
            <Input
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="At least 6 characters"
              autoComplete="new-password"
              required
            />
            
            {/* Confirm Password */}
            <Input
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Repeat your password"
              autoComplete="new-password"
              required
            />
            
            {/* Error Message */}
            {displayError && (
              <motion.div
                className="p-3 bg-fitness-error/10 border border-fitness-error/30 rounded-lg"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <p className="text-fitness-error text-sm text-center">
                  {displayError}
                </p>
              </motion.div>
            )}
            
            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={loading}
            >
              {loading ? <LoadingSpinner size="sm" /> : 'Create Account'}
            </Button>
          </form>
          
          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-700" />
            <span className="text-text-muted text-sm">or</span>
            <div className="flex-1 h-px bg-gray-700" />
          </div>
          
          {/* Google Sign Up */}
          <Button
            variant="secondary"
            size="lg"
            className="w-full flex items-center justify-center gap-3"
            onClick={handleGoogleSignUp}
            disabled={loading}
          >
            <GoogleIcon />
            <span>Sign up with Google</span>
          </Button>
          
          {/* Login Link */}
          <p className="text-text-secondary text-sm text-center mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-fitness-primary hover:underline">
              Sign in
            </Link>
          </p>
        </Card>
      </motion.div>
      
      {/* Terms */}
      <p className="text-text-muted text-xs text-center mt-6 max-w-sm">
        By creating an account, you agree to our Terms of Service and Privacy Policy.
      </p>
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
