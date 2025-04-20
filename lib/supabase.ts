import { createClient } from '@supabase/supabase-js';
import { config } from '../src/config';

// Create mock client for build time or server without environment variables
const createMockClient = () => {
  return {
    from: () => ({
      insert: () => Promise.resolve({ error: null }),
      select: () => Promise.resolve({ data: [], error: null }),
    }),
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ error: null }),
      }),
    },
    auth: {
      signUp: () => Promise.resolve({ error: null }),
      signIn: () => Promise.resolve({ error: null }),
    },
  };
};

// Get Supabase URL and key from environment variables with fallback to config
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || config.supabase.url;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || config.supabase.anonKey;

// Check if we have valid credentials
const hasValidCredentials =
  supabaseUrl && supabaseAnonKey && supabaseUrl !== '' && supabaseAnonKey !== '';

// Create Supabase client with credentials or use mock
export const supabase = hasValidCredentials
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
      },
    })
  : createMockClient();
