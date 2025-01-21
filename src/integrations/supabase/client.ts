import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://zacanxuybdaejwjagwwe.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphY2FueHV5YmRhZWp3amFnd3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc0NTE5MTUsImV4cCI6MjA1MzAyNzkxNX0.3rZv4PT2729aiiiPB8hqKZjyQfEavEviDTVB1ZKa7Sw";

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false, // Changed to false to prevent URL parsing issues
    storage: window.localStorage,
    flowType: 'pkce',
    debug: true // Added debug mode to help track auth issues
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-web'
    }
  }
});

// Enhanced error logging for debugging
supabase.auth.onAuthStateChange((event, session) => {
  console.log(`[Auth] Event: ${event}`, session ? `User: ${session.user.id}` : 'No session');
  
  if (event === 'SIGNED_OUT') {
    console.log('[Auth] User signed out, clearing local storage');
    window.localStorage.removeItem('supabase.auth.token');
  }
});

// Add error handling for failed requests
supabase.auth.onError((error) => {
  console.error('[Auth] Error:', error);
});

// Initialize auth state
supabase.auth.getSession().then(({ data: { session }, error }) => {
  if (error) {
    console.error('[Auth] Initial session error:', error);
    return;
  }
  console.log('[Auth] Initial session loaded:', session ? 'Authenticated' : 'Not authenticated');
});