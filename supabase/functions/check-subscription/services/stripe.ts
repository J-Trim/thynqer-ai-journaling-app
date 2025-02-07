
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { logError } from '../utils/logger.ts';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

export async function findCustomerByUserId(userId: string) {
  try {
    console.log('Finding Stripe customer for user:', userId);
    const customers = await stripe.customers.list({
      limit: 1,
      metadata: { supabase_user_id: userId }
    });
    return customers.data[0] || null;
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
