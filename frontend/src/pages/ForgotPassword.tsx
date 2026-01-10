/**
 * Forgot Password Page (T050)
 * 
 * Password reset via email.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Card, Input, LoadingSpinner } from '../components/common';
import { useAuthContext } from '../context/AuthContext';

export default function ForgotPassword() {
  const { resetPassword, loading, error, clearError } = useAuthContext();
  
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setValidationError(null);
    clearError();
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setValidationError('Please enter your email address');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setValidationError('Please enter a valid email address');
      return;
    }
    
    try {
      await resetPassword(email);
      setSubmitted(true);
    } catch (err) {
      console.error('Password reset failed:', err);
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
        <div className="text-6xl mb-4">🔐</div>
        <h1 className="text-3xl font-bold text-text-primary">Reset Password</h1>
        <p className="text-text-secondary mt-2">
          We'll send you a link to reset it
        </p>
      </motion.div>
      
      {/* Reset Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-sm"
      >
        <Card className="p-8">
          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center py-4"
              >
                <div className="text-5xl mb-4">📧</div>
                <h2 className="text-xl font-semibold text-text-primary mb-2">
                  Check Your Email
                </h2>
                <p className="text-text-secondary mb-6">
                  We've sent a password reset link to <strong className="text-text-primary">{email}</strong>
                </p>
                <p className="text-text-muted text-sm mb-6">
                  Didn't receive the email? Check your spam folder or try again.
                </p>
                <div className="space-y-3">
                  <Button
                    variant="secondary"
                    size="lg"
                    className="w-full"
                    onClick={() => setSubmitted(false)}
                  >
                    Try a Different Email
                  </Button>
                  <Link to="/login">
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full"
                    >
                      Return to Login
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                {/* Email */}
                <Input
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                  autoFocus
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
                  {loading ? <LoadingSpinner size="sm" /> : 'Send Reset Link'}
                </Button>
                
                {/* Back to Login */}
                <p className="text-text-secondary text-sm text-center pt-4">
                  Remember your password?{' '}
                  <Link to="/login" className="text-fitness-primary hover:underline">
                    Sign in
                  </Link>
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    </div>
  );
}
