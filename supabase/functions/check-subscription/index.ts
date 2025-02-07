
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

function logError(context: string, error: any, metadata: Record<string, any> = {}) {
  const errorLog = {
    timestamp: new Date().toISOString(),
    context,
    error: {
      name: error?.name,
      message: error?.message,
      stack: error?.stack,
    },
    metadata,
  };
  
  console.error('Subscription Check Error:', JSON.stringify(errorLog, null, 2));
}

async function findCustomerByUserId(userId: string) {
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

async function getActiveSubscriptions(customerId: string) {
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

async function checkSubscriptionStatus(userId: string, supabaseClient: any): Promise<SubscriptionInfo> {
  try {
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

serve(async (req) => {
  const requestId = crypto.randomUUID();
  const requestStart = Date.now();
  
  console.log(`[${requestId}] Processing subscription check request`);

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
      logError('authorization', new Error('No authorization header'), { requestId });
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(jwt);

    if (authError || !user) {
      logError('authentication', authError || new Error('Invalid token'), { 
        requestId,
        authError: authError?.message
      });
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const subscriptionInfo = await checkSubscriptionStatus(user.id, supabaseClient);

    const requestDuration = Date.now() - requestStart;
    console.log(`[${requestId}] Request completed in ${requestDuration}ms`, {
      userId: user.id,
      isSubscribed: subscriptionInfo.isSubscribed,
      tier: subscriptionInfo.tier
    });

    return new Response(
      JSON.stringify(subscriptionInfo),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    logError('serve', error, { requestId });
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        requestId, // Include request ID in response for correlation
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
