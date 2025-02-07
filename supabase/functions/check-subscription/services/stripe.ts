
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { logError } from '../utils/logger.ts';

// Initialize Stripe once
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

// Cache customer lookups in memory (with 5-minute TTL)
const customerCache = new Map<string, { customer: Stripe.Customer | null; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function findCustomerByUserId(userId: string) {
  try {
    // Check memory cache first
    const cached = customerCache.get(userId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('Returning cached customer for user:', userId);
      return cached.customer;
    }

    console.log('Finding Stripe customer for user:', userId);
    const customers = await stripe.customers.list({
      limit: 1,
      metadata: { supabase_user_id: userId }
    });

    const customer = customers.data[0] || null;
    // Update cache
    customerCache.set(userId, { customer, timestamp: Date.now() });
    return customer;
  } catch (error) {
    logError('findCustomerByUserId', error, { userId });
    throw error;
  }
}

export async function getActiveSubscriptions(customerId: string) {
  try {
    console.log('Checking active subscriptions for customer:', customerId);
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      expand: ['data.items.price.product']
    });
    return subscriptions.data;
  } catch (error) {
    logError('getActiveSubscriptions', error, { customerId });
    throw error;
  }
}

// Implement batch subscription checks
export async function batchCheckSubscriptions(userIds: string[]) {
  try {
    console.log(`Batch checking subscriptions for ${userIds.length} users`);
    const results = new Map<string, boolean>();
    
    // Process in chunks of 10 to avoid rate limits
    const CHUNK_SIZE = 10;
    for (let i = 0; i < userIds.length; i += CHUNK_SIZE) {
      const chunk = userIds.slice(i, i + CHUNK_SIZE);
      const promises = chunk.map(async (userId) => {
        const customer = await findCustomerByUserId(userId);
        if (!customer) return [userId, false];
        
        const subs = await getActiveSubscriptions(customer.id);
        return [userId, subs.length > 0];
      });
      
      const chunkResults = await Promise.all(promises);
      chunkResults.forEach(([userId, hasSubscription]) => {
        results.set(userId as string, hasSubscription as boolean);
      });
    }
    
    return results;
  } catch (error) {
    logError('batchCheckSubscriptions', error, { userIds });
    throw error;
  }
}

