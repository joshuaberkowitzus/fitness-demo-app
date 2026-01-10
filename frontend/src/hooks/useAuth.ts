/**
 * Firebase Authentication hook.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from '../config/firebase';
import { userApi } from '../services/api';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook for Firebase Authentication state and operations.
 */
export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setState({ user, loading: false, error: null });
      },
      (error) => {
        setState({ user: null, loading: false, error });
      }
    );

    return () => unsubscribe();
  }, []);

  // Sign in with Google
  const signInWithGoogle = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Initialize user profile in backend
      try {
        await userApi.initialize();
      } catch {
        // User might already be initialized, that's OK
      }
      
      setState({ user: result.user, loading: false, error: null });
      return result.user;
    } catch (error) {
      const authError = error instanceof Error ? error : new Error('Sign in failed');
      setState((prev) => ({ ...prev, loading: false, error: authError }));
      throw authError;
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    
    try {
      await firebaseSignOut(auth);
      setState({ user: null, loading: false, error: null });
    } catch (error) {
      const authError = error instanceof Error ? error : new Error('Sign out failed');
      setState((prev) => ({ ...prev, loading: false, error: authError }));
      throw authError;
    }
  }, []);

  // Get ID token for API calls
  const getIdToken = useCallback(async () => {
    if (!state.user) {
      return null;
    }
    return state.user.getIdToken();
  }, [state.user]);

  return {
    user: state.user,
    loading: state.loading,
    error: state.error,
    isAuthenticated: !!state.user,
    signInWithGoogle,
    signOut,
    getIdToken,
  };
}
