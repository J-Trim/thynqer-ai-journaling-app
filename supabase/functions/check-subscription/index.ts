
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import Stripe from 'https://esm.sh/stripe@14.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Stripe client
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

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
    limit: 1
  });
  return subscriptions.data;
}

async function checkSubscriptionStatus(userId: string): Promise<boolean> {
  const customer = await findCustomerByUserId(userId);
  if (!customer) {
    console.log('No Stripe customer found for user:', userId);
    return false;
  }

  const activeSubscriptions = await getActiveSubscriptions(customer.id);
  const isSubscribed = activeSubscriptions.length > 0;
  console.log('Subscription status for user:', userId, 'Status:', isSubscribed);
  return isSubscribed;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key
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

    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error('No authorization header');
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Verify the JWT and get the user
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(jwt);

    if (authError || !user) {
      console.error('Invalid token:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const isSubscribed = await checkSubscriptionStatus(user.id);

    return new Response(
      JSON.stringify({ isSubscribed }),
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
