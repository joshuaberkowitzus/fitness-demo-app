/**
 * useUnsavedChanges Hook (T069)
 * 
 * Hook to warn users when navigating away with unsaved changes.
 * Uses browser beforeunload event and can optionally block react-router navigation.
 */

import { useEffect, useCallback, useState, useMemo } from 'react';
import { useBlocker, type BlockerFunction } from 'react-router-dom';

interface UseUnsavedChangesOptions {
  /** Message to show when user tries to navigate away */
  message?: string;
  /** Block react-router navigation in addition to browser navigation */
  blockRouterNavigation?: boolean;
}

/**
 * Hook to warn about unsaved changes
 * 
 * @param hasChanges - Whether there are unsaved changes
 * @param messageOrOptions - Warning message or options object
 * @returns Object with setHasChanges function for manual control
 */
export function useUnsavedChanges(
  hasChanges: boolean,
  messageOrOptions?: string | UseUnsavedChangesOptions
): { setHasChanges: (value: boolean) => void } {
  const [localHasChanges, setLocalHasChanges] = useState(false);
  
  // Parse options - memoize to prevent unnecessary re-renders
  const options: UseUnsavedChangesOptions = useMemo(() => 
    typeof messageOrOptions === 'string'
      ? { message: messageOrOptions }
      : messageOrOptions || {},
    [messageOrOptions]
  );
  
  const message = options.message || 'You have unsaved changes. Are you sure you want to leave?';
  const blockRouterNavigation = options.blockRouterNavigation !== false;
  
  // Combine external and local state
  const isDirty = hasChanges || localHasChanges;
  
  // Calculate whether to block - must be a stable value for useBlocker
  const shouldBlock = blockRouterNavigation && isDirty;
  
  // Handle browser navigation (refresh, close tab, external links)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty, message]);
  
  // Block react-router navigation - useBlocker must always be called (React hooks rules)
  // Pass a stable callback or false to prevent blocking
  const blockerFn = useCallback<BlockerFunction>(
    ({ currentLocation, nextLocation }) => {
      if (!shouldBlock) return false;
      return currentLocation.pathname !== nextLocation.pathname;
    },
    [shouldBlock]
  );
  
  const blocker = useBlocker(blockerFn);
  
  // Show confirmation dialog when router navigation is blocked
  useEffect(() => {
    if (blocker.state === 'blocked') {
      const confirmLeave = window.confirm(message);
      if (confirmLeave) {
        blocker.proceed();
      } else {
        blocker.reset();
      }
    }
  }, [blocker, message]);
  
  const setHasChanges = useCallback((value: boolean) => {
    setLocalHasChanges(value);
  }, []);
  
  return { setHasChanges };
}

export default useUnsavedChanges;
