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
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: window.localStorage
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-web'
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Enhanced error logging for debugging
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Supabase auth event:', event, 'Session:', session?.user?.id);
  
  if (event === 'SIGNED_OUT') {
    console.log('User signed out, clearing local storage');
    window.localStorage.removeItem('supabase.auth.token');
  } else if (event === 'SIGNED_IN') {
    console.log('User signed in:', session?.user?.email);
  } else if (event === 'TOKEN_REFRESHED') {
    console.log('Token refreshed for user:', session?.user?.id);
  } else if (event === 'USER_UPDATED') {
    console.log('User updated:', session?.user?.id);
  } else if (event === 'INITIAL_SESSION') {
    console.log('Initial auth state:', session ? 'authenticated' : 'not authenticated');
  } else if (event === 'MFA_CHALLENGE_VERIFIED') {
    console.log('MFA challenge verified for user:', session?.user?.id);
  }
});