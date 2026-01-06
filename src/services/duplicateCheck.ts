import { createClient } from '@supabase/supabase-js';

/**
 * Service to check for duplicate entries in the signups table
 * Used for early validation before form submission
 */

type DuplicateCheckResult = {
  exists: boolean;
  error?: string;
};

/**
 * Get Supabase client for duplicate checking
 */
function getSupabaseClient() {
  const env = typeof window !== 'undefined' ? (window as any).ENV : null;

  let supabaseUrl = env?.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  let supabaseKey = env?.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Try meta tags as fallback
  if ((!supabaseUrl || !supabaseKey) && typeof document !== 'undefined') {
    const urlMeta = document.querySelector('meta[name="supabase-url"]');
    const keyMeta = document.querySelector('meta[name="supabase-anon-key"]');

    if (urlMeta && keyMeta) {
      supabaseUrl = urlMeta.getAttribute('content') || supabaseUrl;
      supabaseKey = keyMeta.getAttribute('content') || supabaseKey;
    }
  }

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Check if a username already exists in the database
 */
export async function checkUsernameExists(username: string): Promise<DuplicateCheckResult> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      // If we can't connect, allow the user to proceed (will be caught at submission)
      console.warn('Cannot connect to Supabase for username check');
      return { exists: false };
    }

    const { data, error } = await supabase
      .from('signups')
      .select('id')
      .eq('username', username)
      .limit(1);

    if (error) {
      console.error('Error checking username:', error);
      // On error, allow proceeding (will be caught at submission)
      return { exists: false };
    }

    return { exists: data && data.length > 0 };
  } catch (err) {
    console.error('Exception checking username:', err);
    return { exists: false };
  }
}

/**
 * Check if a phone number already exists in the database
 */
export async function checkPhoneExists(phone: string): Promise<DuplicateCheckResult> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.warn('Cannot connect to Supabase for phone check');
      return { exists: false };
    }

    const { data, error } = await supabase.from('signups').select('id').eq('phone', phone).limit(1);

    if (error) {
      console.error('Error checking phone:', error);
      return { exists: false };
    }

    return { exists: data && data.length > 0 };
  } catch (err) {
    console.error('Exception checking phone:', err);
    return { exists: false };
  }
}

/**
 * Check if an email already exists in the database
 */
export async function checkEmailExists(email: string): Promise<DuplicateCheckResult> {
  try {
    if (!email || email.trim() === '') {
      return { exists: false };
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      console.warn('Cannot connect to Supabase for email check');
      return { exists: false };
    }

    const { data, error } = await supabase.from('signups').select('id').eq('email', email).limit(1);

    if (error) {
      console.error('Error checking email:', error);
      return { exists: false };
    }

    return { exists: data && data.length > 0 };
  } catch (err) {
    console.error('Exception checking email:', err);
    return { exists: false };
  }
}
