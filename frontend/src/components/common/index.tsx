import React from 'react';
import { motion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';

// ============================================================================
// Button Component
// ============================================================================

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = 'font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background-dark disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-fitness-primary hover:bg-fitness-primary-dark text-white focus:ring-fitness-primary',
    secondary: 'bg-background-card hover:bg-background-hover text-text-primary border border-gray-700 focus:ring-gray-500',
    danger: 'bg-fitness-danger hover:bg-red-600 text-white focus:ring-fitness-danger',
    ghost: 'bg-transparent hover:bg-background-hover text-text-primary focus:ring-gray-500',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading...
        </span>
      ) : children}
    </button>
  );
}

// ============================================================================
// Card Component
// ============================================================================

interface CardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  variant?: 'default' | 'interactive';
}

export function Card({
  children,
  variant = 'default',
  className = '',
  ...props
}: CardProps) {
  const baseStyles = 'bg-background-card rounded-xl p-4 shadow-lg border border-gray-800';
  
  const variants = {
    default: '',
    interactive: 'cursor-pointer hover:bg-background-hover hover:border-gray-700 transition-colors duration-200',
  };
  
  return (
    <motion.div
      className={`${baseStyles} ${variants[variant]} ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// ============================================================================
// Input Component
// ============================================================================

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({
  label,
  error,
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-text-secondary mb-1">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full bg-background-card border rounded-lg px-4 py-2 text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-fitness-primary focus:border-transparent transition-all duration-200 ${
          error ? 'border-fitness-danger' : 'border-gray-700'
        } ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-fitness-danger">{error}</p>
      )}
    </div>
  );
}

// ============================================================================
// Loading Spinner
// ============================================================================

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };
  
  return (
    <svg
      className={`animate-spin text-fitness-primary ${sizes[size]} ${className}`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// ============================================================================
// Badge Component
// ============================================================================

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({ children, variant = 'default', size = 'md', className = '' }: BadgeProps) {
  const variants = {
    default: 'bg-gray-700 text-text-secondary',
    success: 'bg-fitness-success/20 text-fitness-success',
    warning: 'bg-fitness-warning/20 text-fitness-warning',
    danger: 'bg-fitness-danger/20 text-fitness-danger',
  };
  
  const sizes = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-0.5 text-xs',
  };
  
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
}

// ============================================================================
// Progress Bar
// ============================================================================

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
}

export function ProgressBar({ value, max = 100, className = '', showLabel = false }: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between text-sm text-text-secondary mb-1">
          <span>Progress</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div className="h-2 bg-background-hover rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-fitness-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
