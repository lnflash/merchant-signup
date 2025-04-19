import { createClient } from '@supabase/supabase-js';
import { config } from '../src/config';

// Create a single supabase client for the application
export const supabase = createClient(
  config.supabase.url,
  config.supabase.anonKey,
  {
    auth: {
      persistSession: true,
    },
  }
);
