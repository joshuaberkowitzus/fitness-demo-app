/**
 * Offline Indicator Component (T109)
 * 
 * Shows a banner when the device is offline or has pending operations.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useOffline } from '../../hooks/useOffline';

export function OfflineIndicator() {
  const { isOnline, pendingCount, isSyncing, sync } = useOffline();

  const showBanner = !isOnline || pendingCount > 0;

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-50"
        >
          <div
            className={`px-4 py-2 text-center text-sm ${
              isOnline
                ? 'bg-fitness-warning/90 text-black'
                : 'bg-fitness-danger/90 text-white'
            }`}
          >
            {!isOnline ? (
              <div className="flex items-center justify-center gap-2">
                <span className="animate-pulse">●</span>
                <span>You're offline. Changes will sync when connected.</span>
              </div>
            ) : pendingCount > 0 ? (
              <div className="flex items-center justify-center gap-2">
                {isSyncing ? (
                  <>
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      ↻
                    </motion.span>
                    <span>Syncing {pendingCount} pending changes...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {pendingCount} change{pendingCount !== 1 ? 's' : ''} pending
                    </span>
                    <button
                      onClick={sync}
                      className="ml-2 underline hover:no-underline font-medium"
                    >
                      Sync now
                    </button>
                  </>
                )}
              </div>
            ) : null}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
