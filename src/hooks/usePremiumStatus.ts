
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

interface SubscriptionInfo {
  isSubscribed: boolean;
  tier?: string;
  features?: string[];
  expiresAt?: string;
}

export const usePremiumStatus = () => {
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const checkPremiumStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setIsLoading(false);
          return;
        }

        const { data, error } = await supabase.functions.invoke('check-subscription', {
          body: {},
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });

        if (error) throw error;
        
        setIsPremium(data?.isSubscribed || false);
        setSubscriptionInfo(data || null);
      } catch (error) {
        console.error('Error checking premium status:', error);
        toast({
          title: "Error",
          description: "Failed to check premium status",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkPremiumStatus();
  }, []);

  return { 
    isPremium, 
    isLoading,
    subscriptionTier: subscriptionInfo?.tier,
    subscriptionFeatures: subscriptionInfo?.features,
    subscriptionExpiresAt: subscriptionInfo?.expiresAt,
  };
};
