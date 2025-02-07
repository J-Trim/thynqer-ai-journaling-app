
import { SubscriptionInfo } from '../types.ts';
import { logError } from '../utils/logger.ts';
import { findCustomerByUserId, getActiveSubscriptions } from './stripe.ts';
import { getSubscriptionFromCache, updateSubscriptionCache } from './cache.ts';

async function getTierInformation(supabaseClient: any, stripeProductId: string) {
  try {
    const { data: tierData, error } = await supabaseClient
      .from('subscription_tiers')
      .select('*')
      .eq('stripe_product_id', stripeProductId)
      .single();

    if (error) {
      logError('getTierInformation:supabase_query', error, { stripeProductId });
      return null;
    }

    return tierData;
  } catch (error) {
    logError('getTierInformation', error, { stripeProductId });
    throw error;
  }
}

export async function checkSubscriptionStatus(userId: string, supabaseClient: any): Promise<SubscriptionInfo> {
  try {
    // Check cache first
    const cachedSubscription = await getSubscriptionFromCache(supabaseClient, userId);
    if (cachedSubscription) {
      console.log('Returning cached subscription info for user:', userId);
      return cachedSubscription;
    }

    // If not in cache, check Stripe
    const customer = await findCustomerByUserId(userId);
    if (!customer) {
      console.log('No Stripe customer found for user:', userId);
      const subscriptionInfo = { isSubscribed: false };
      await updateSubscriptionCache(supabaseClient, userId, subscriptionInfo);
      return subscriptionInfo;
    }

    const activeSubscriptions = await getActiveSubscriptions(customer.id);
    if (activeSubscriptions.length === 0) {
      const subscriptionInfo = { isSubscribed: false };
      await updateSubscriptionCache(supabaseClient, userId, subscriptionInfo);
      return subscriptionInfo;
    }

    // Get the subscription with the most features/highest tier
    const subscription = activeSubscriptions[0];
    const product = subscription.items.data[0].price.product as Stripe.Product;
    
    // Fetch tier information from our database
    const tierInfo = await getTierInformation(supabaseClient, product.id);
    
    const subscriptionInfo: SubscriptionInfo = {
      isSubscribed: true,
      tier: tierInfo?.name || product.metadata.tier || 'basic',
      features: tierInfo?.features || (product.metadata.features ? JSON.parse(product.metadata.features) : []),
      expiresAt: subscription.current_period_end ? 
        new Date(subscription.current_period_end * 1000).toISOString() : 
        undefined,
      productId: product.id
    };

    // Update cache with fresh data
    await updateSubscriptionCache(supabaseClient, userId, subscriptionInfo);

    // Log only non-sensitive information
    console.log('Subscription info for user:', userId, {
      isSubscribed: subscriptionInfo.isSubscribed,
      tier: subscriptionInfo.tier,
      featureCount: subscriptionInfo.features?.length || 0,
      expiresAt: subscriptionInfo.expiresAt
    });

    return subscriptionInfo;
  } catch (error) {
    logError('checkSubscriptionStatus', error, { userId });
    throw error;
  }
}
