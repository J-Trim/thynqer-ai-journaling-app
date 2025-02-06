import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { setupNetworkListener } from '@/utils/offlineQueue';

interface OfflineContextType {
  isOnline: boolean;
}

const OfflineContext = createContext<OfflineContextType>({
  isOnline: true
});

export const useOffline = () => useContext(OfflineContext);

export const OfflineProvider = ({ children }: { children: ReactNode }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Setup network listener for syncing
    const cleanup = setupNetworkListener();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      cleanup();
    };
  }, []);

  return (
    <OfflineContext.Provider value={{ isOnline }}>
      {children}
    </OfflineContext.Provider>
  );
};