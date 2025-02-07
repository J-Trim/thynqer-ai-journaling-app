
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import { logError } from "./utils/logger.ts";
import { checkSubscriptionStatus } from "./services/subscription.ts";
import { checkRateLimit } from "./services/rateLimit.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Check rate limit
    const isWithinLimit = await checkRateLimit(supabaseClient, user.id, 'check-subscription');
    if (!isWithinLimit) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
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
        requestId,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
