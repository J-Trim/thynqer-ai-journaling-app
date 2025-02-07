
import { logError } from '../utils/logger.ts';

const MAX_REQUESTS = 30; // Maximum requests per minute
const WINDOW_MS = 60 * 1000; // 1 minute in milliseconds

export async function checkRateLimit(
  supabaseClient: any,
  userId: string,
  endpoint: string
): Promise<boolean> {
  try {
    // Get current rate limit record
    const { data: rateLimit, error: selectError } = await supabaseClient
      .from('request_rate_limits')
      .select('*')
      .eq('user_id', userId)
      .eq('endpoint', endpoint)
      .single();

    if (selectError) {
      logError('checkRateLimit:select', selectError, { userId, endpoint });
      return true; // Allow request on error to prevent blocking legitimate users
    }

    const now = new Date();

    if (!rateLimit) {
      // First request, create new rate limit record
      const { error: insertError } = await supabaseClient
        .from('request_rate_limits')
        .insert({
          user_id: userId,
          endpoint,
          request_count: 1,
          first_request_at: now.toISOString()
        });

      if (insertError) {
        logError('checkRateLimit:insert', insertError, { userId, endpoint });
      }
      return true;
    }

    const windowStart = new Date(rateLimit.first_request_at).getTime();
    const elapsed = now.getTime() - windowStart;

    if (elapsed > WINDOW_MS) {
      // Window expired, reset counter
      const { error: updateError } = await supabaseClient
        .from('request_rate_limits')
        .update({
          request_count: 1,
          first_request_at: now.toISOString()
        })
        .eq('id', rateLimit.id);

      if (updateError) {
        logError('checkRateLimit:update', updateError, { userId, endpoint });
      }
      return true;
    }

    if (rateLimit.request_count >= MAX_REQUESTS) {
      return false; // Rate limit exceeded
    }

    // Increment counter
    const { error: incrementError } = await supabaseClient
      .from('request_rate_limits')
      .update({
        request_count: rateLimit.request_count + 1
      })
      .eq('id', rateLimit.id);

    if (incrementError) {
      logError('checkRateLimit:increment', incrementError, { userId, endpoint });
    }
    return true;
  } catch (error) {
    logError('checkRateLimit', error, { userId, endpoint });
    return true; // Allow request on error
  }
}
