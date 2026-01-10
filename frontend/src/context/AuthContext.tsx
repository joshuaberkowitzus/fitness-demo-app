/**
 * Authentication Context (T047)
 * 
 * Provides global auth state via React Context.
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from '../config/firebase';
import { userApi } from '../services/api';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  signInWithGoogle: () => Promise<User>;
  signInWithEmail: (email: string, password: string) => Promise<User>;
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<User>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        setUser(firebaseUser);
        setLoading(false);
        
        // Initialize user in backend if authenticated
        if (firebaseUser) {
          try {
            await userApi.initialize();
          } catch {
            // User might already be initialized, that's OK
          }
        }
      },
      (authError) => {
        setError(authError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Sign in with Google
  const signInWithGoogle = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Initialize user in backend
      try {
        await userApi.initialize();
      } catch {
        // User might already be initialized
      }
      
      return result.user;
    } catch (err) {
      const authError = err instanceof Error ? err : new Error('Sign in failed');
      setError(authError);
      throw authError;
    } finally {
      setLoading(false);
    }
  }, []);

  // Sign in with email/password
  const signInWithEmail = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (err) {
      const authError = err instanceof Error ? err : new Error('Sign in failed');
      setError(authError);
      throw authError;
    } finally {
      setLoading(false);
    }
  }, []);

  // Sign up with email/password
  const signUpWithEmail = useCallback(async (email: string, password: string, displayName?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update display name if provided
      if (displayName) {
        await updateProfile(result.user, { displayName });
      }
      
      // Initialize user in backend
      try {
        await userApi.initialize();
      } catch {
        // User might already be initialized
      }
      
      return result.user;
    } catch (err) {
      const authError = err instanceof Error ? err : new Error('Sign up failed');
      setError(authError);
      throw authError;
    } finally {
      setLoading(false);
    }
  }, []);

  // Reset password
  const resetPassword = useCallback(async (email: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      const authError = err instanceof Error ? err : new Error('Password reset failed');
      setError(authError);
      throw authError;
    } finally {
      setLoading(false);
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      await firebaseSignOut(auth);
    } catch (err) {
      const authError = err instanceof Error ? err : new Error('Sign out failed');
      setError(authError);
      throw authError;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get ID token
  const getIdToken = useCallback(async () => {
    if (!user) return null;
    return user.getIdToken();
  }, [user]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    signOut,
    getIdToken,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth context.
 */
export function useAuthContext() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  
  return context;
}
