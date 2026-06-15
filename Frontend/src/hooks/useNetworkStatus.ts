// hooks/useNetworkStatus.ts — Online/offline status detection

import { useState, useEffect } from 'react';

interface NetworkStatus {
  isOnline: boolean;
  wasOffline: boolean;  // true if was offline and just came back online
}

/**
 * Hook to detect online/offline network status.
 * Also tracks whether the app just came back online (useful for syncing offline queue).
 */
export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [wasOffline, setWasOffline] = useState<boolean>(false);

  useEffect(() => {
    let prevOnline = navigator.onLine;

    const handleOnline = () => {
      setIsOnline(true);
      if (!prevOnline) {
        setWasOffline(true);
        // Reset after a short delay so consumers can react once
        setTimeout(() => setWasOffline(false), 2000);
      }
      prevOnline = true;
    };

    const handleOffline = () => {
      setIsOnline(false);
      prevOnline = false;
    };

    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, wasOffline };
}
