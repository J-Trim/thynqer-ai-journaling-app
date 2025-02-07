
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import { SubscriptionInfo, SubscriptionCache } from '../types.ts';
import { logError } from '../utils/logger.ts';

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

export async function getSubscriptionFromCache(
  supabaseClient: any,
  userId: string
): Promise<SubscriptionInfo | null> {
  try {
    const { data: cache, error } = await supabaseClient
      .from('subscription_status_cache')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      logError('getSubscriptionFromCache:query', error, { userId });
      return null;
    }

    if (!cache) return null;

    const lastChecked = new Date(cache.last_checked).getTime();
    const now = new Date().getTime();
    
    // Return null if cache is expired
    if (now - lastChecked > CACHE_DURATION) {
      return null;
    }

    return {
      isSubscribed: cache.is_subscribed,
      tier: cache.tier,
      features: cache.features,
      expiresAt: cache.expires_at,
      productId: cache.product_id
    };
  } catch (error) {
    logError('getSubscriptionFromCache', error, { userId });
    return null;
  }
}

export async function updateSubscriptionCache(
  supabaseClient: any,
  userId: string,
  subscriptionInfo: SubscriptionInfo
): Promise<void> {
  try {
    const { error } = await supabaseClient
      .from('subscription_status_cache')
      .upsert({
        user_id: userId,
        is_subscribed: subscriptionInfo.isSubscribed,
        tier: subscriptionInfo.tier,
        features: subscriptionInfo.features,
        expires_at: subscriptionInfo.expiresAt,
        product_id: subscriptionInfo.productId,
        last_checked: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      logError('updateSubscriptionCache', error, { userId });
    }
  } catch (error) {
    logError('updateSubscriptionCache', error, { userId });
  }
}
