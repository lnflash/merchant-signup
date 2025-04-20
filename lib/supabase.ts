import { createClient } from '@supabase/supabase-js';
import { config } from '../src/config';
import { logger } from '../src/utils/logger';

// Create mock client for build time or server without environment variables
const createMockClient = () => {
  logger.warn('Using mock Supabase client (credentials missing or build time)');
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

// Log initialization
if (hasValidCredentials) {
  logger.info('Supabase client initialized with real credentials', {
    url: supabaseUrl.substring(0, 8) + '...', // Only log beginning of URL for security
  });
}
