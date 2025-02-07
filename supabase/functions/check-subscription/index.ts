
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import Stripe from 'https://esm.sh/stripe@14.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

interface SubscriptionInfo {
  isSubscribed: boolean;
  tier?: string;
  features?: string[];
  expiresAt?: string;
  productId?: string;
}

async function findCustomerByUserId(userId: string) {
  console.log('Finding Stripe customer for user:', userId);
  const customers = await stripe.customers.list({
    limit: 1,
    metadata: { supabase_user_id: userId }
  });
  return customers.data[0] || null;
}

async function getActiveSubscriptions(customerId: string) {
  console.log('Checking active subscriptions for customer:', customerId);
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'active',
    expand: ['data.items.price.product']
  });
  return subscriptions.data;
}

async function getTierInformation(supabaseClient: any, stripeProductId: string) {
  const { data: tierData, error } = await supabaseClient
    .from('subscription_tiers')
    .select('*')
    .eq('stripe_product_id', stripeProductId)
    .single();

  if (error) {
    console.error('Error fetching tier information:', error);
    return null;
  }

  return tierData;
}

async function checkSubscriptionStatus(userId: string, supabaseClient: any): Promise<SubscriptionInfo> {
  const customer = await findCustomerByUserId(userId);
  if (!customer) {
    console.log('No Stripe customer found for user:', userId);
    return { isSubscribed: false };
  }

  const activeSubscriptions = await getActiveSubscriptions(customer.id);
  if (activeSubscriptions.length === 0) {
    return { isSubscribed: false };
  }

  // Get the subscription with the most features/highest tier
  const subscription = activeSubscriptions[0]; // We can enhance this logic later
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

  console.log('Subscription info for user:', userId, subscriptionInfo);
  return subscriptionInfo;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false
        }
      }
    );

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error('No authorization header');
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(jwt);

    if (authError || !user) {
      console.error('Invalid token:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const subscriptionInfo = await checkSubscriptionStatus(user.id, supabaseClient);

    return new Response(
      JSON.stringify(subscriptionInfo),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
