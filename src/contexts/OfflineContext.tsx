import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { setupNetworkListener } from '@/utils/offlineQueue';
import { useToast } from '@/components/ui/use-toast';

interface OfflineContextType {
  isOnline: boolean;
  syncEntries: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType>({
  isOnline: true,
  syncEntries: async () => {}
});

export const useOffline = () => useContext(OfflineContext);

export const OfflineProvider = ({ children }: { children: ReactNode }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { toast } = useToast();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Back Online",
        description: "Your entries will now sync automatically.",
      });
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "You're Offline",
        description: "Don't worry, your entries will be saved locally and sync when you're back online.",
        variant: "destructive"
      });
    };

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

  const syncEntries = async () => {
    if (!isOnline) {
      toast({
        title: "Cannot Sync",
        description: "You're currently offline. Your entries will sync automatically when you're back online.",
        variant: "destructive"
      });
      return;
    }

    try {
      await setupNetworkListener();
      toast({
        title: "Sync Complete",
        description: "Your entries have been synchronized.",
      });
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: "Sync Failed",
        description: "There was an error syncing your entries. Please try again later.",
        variant: "destructive"
      });
    }
  };

  return (
    <OfflineContext.Provider value={{ isOnline, syncEntries }}>
      {children}
    </OfflineContext.Provider>
  );
};