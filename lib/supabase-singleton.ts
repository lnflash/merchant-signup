import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from '../src/utils/logger';

// Cache for Supabase client instances
const clientCache: Record<string, SupabaseClient> = {};

// Global environment detection
const isStaticBuild = typeof window !== 'undefined' && window.ENV && window.ENV.BUILD_TIME;

/**
 * Gets or creates a Supabase client instance with the provided credentials
 * Uses a singleton pattern to avoid creating multiple clients with the same credentials
 *
 * @param url Supabase URL
 * @param key Supabase anon key
 * @returns SupabaseClient instance
 */
/**
 * Gets the best available Supabase credentials from various sources
 * Prioritizes window.ENV for static builds, then falls back to environment variables
 */
export function getBestCredentials(): { url: string; key: string } | null {
  try {
    // For static builds, try window.ENV first
    if (isStaticBuild && typeof window !== 'undefined' && window.ENV) {
      const envUrl = window.ENV.SUPABASE_URL;
      const envKey = window.ENV.SUPABASE_KEY;
      
      if (envUrl && envKey) {
        logger.info('Using Supabase credentials from window.ENV (static build)');
        return { url: envUrl, key: envKey };
      }
    }
    
    // Try environment variables
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      logger.info('Using Supabase credentials from environment variables');
      return {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      };
    }
    
    // No valid credentials found
    logger.warn('No valid Supabase credentials found from any source');
    return null;
  } catch (error) {
    logger.error('Error getting best credentials', error);
    return null;
  }
}

/**
 * Gets or creates a Supabase client instance with the provided credentials
 * Uses a singleton pattern to avoid creating multiple clients with the same credentials
 *
 * @param url Supabase URL
 * @param key Supabase anon key
 * @returns SupabaseClient instance
 */
export function getSupabaseClient(url?: string, key?: string): SupabaseClient {
  // Try to use provided credentials or fall back to best available
  let finalUrl = url;
  let finalKey = key;
  
  // If credentials not provided, try to get them from available sources
  if (!finalUrl || !finalKey) {
    const bestCreds = getBestCredentials();
    if (bestCreds) {
      finalUrl = bestCreds.url;
      finalKey = bestCreds.key;
    }
  }
  
  // Validate inputs
  if (!finalUrl || !finalKey) {
    logger.error('getSupabaseClient called with invalid credentials', {
      hasUrl: !!finalUrl,
      hasKey: !!finalKey,
      source: 'fallback_failed',
    });
    return createMockSupabaseClient();
  }

  // Create a cache key based on the credentials
  const cacheKey = `${finalUrl}:${finalKey}`;

  // Return cached instance if it exists
  if (clientCache[cacheKey]) {
    return clientCache[cacheKey];
  }

  // Create and cache a new instance
  try {
    logger.info('Creating new Supabase client instance');
    const client = createClient(finalUrl, finalKey, {
      auth: {
        persistSession: true,
      },
    });

    clientCache[cacheKey] = client;
    return client;
  } catch (error) {
    logger.error('Failed to create Supabase client', error);
    return createMockSupabaseClient();
  }
}

/**
 * Creates a mock Supabase client for testing or fallback purposes
 */
export function createMockSupabaseClient() {
  logger.warn('Creating mock Supabase client');

  return {
    from: (table: string) => ({
      insert: (data: any) => {
        logger.info(`Mock insert into ${table} table`, { mock: true });
        return Promise.resolve({ data: [{ id: 'mock-id', created_at: new Date().toISOString() }], error: null });
      },
      select: (columns: string = '*', options?: any) => {
        logger.info(`Mock select from ${table} table`, { mock: true, columns });
        return {
          eq: (field: string, value: any) => {
            logger.info(`Mock eq filter on ${table}.${field} = ${value}`, { mock: true });
            return Promise.resolve({
              data: [{ id: 'mock-id', created_at: new Date().toISOString() }],
              error: null,
            });
          },
          data: [{ id: 'mock-id', created_at: new Date().toISOString() }],
          error: null,
        };
      },
      update: (data: any) => {
        logger.info(`Mock update in ${table} table`, { mock: true });
        return {
          eq: (field: string, value: any) => {
            logger.info(`Mock update where ${field} = ${value}`, { mock: true });
            return Promise.resolve({ data: [{ id: value }], error: null });
          },
        };
      },
      delete: () => {
        logger.info(`Mock delete from ${table} table`, { mock: true });
        return {
          eq: (field: string, value: any) => {
            logger.info(`Mock delete where ${field} = ${value}`, { mock: true });
            return Promise.resolve({ data: null, error: null });
          },
        };
      },
    }),
    storage: {
      from: (bucket: string) => ({
        upload: (path: string, file: any, options?: any) => {
          logger.info(`Mock file upload to ${bucket}/${path}`, { mock: true });
          return Promise.resolve({ data: { path }, error: null });
        },
        getPublicUrl: (path: string) => {
          logger.info(`Mock get public URL for ${bucket}/${path}`, { mock: true });
          return {
            data: {
              publicUrl: `https://example.com/${bucket}/${path}`,
            },
          };
        },
        remove: (paths: string[]) => {
          logger.info(`Mock remove files from ${bucket}`, { mock: true, paths });
          return Promise.resolve({ data: { paths }, error: null });
        },
      }),
    },
    auth: {
      getSession: () => {
        return Promise.resolve({ data: { session: null }, error: null });
      },
      signInWithOtp: (opts: any) => {
        logger.info(`Mock sign in with OTP`, { mock: true, email: opts?.email });
        return Promise.resolve({ data: {}, error: null });
      },
    },
  };
}

/**
 * Returns the best available Supabase client for the current environment
 * This is a convenience function that automatically uses the best available credentials
 */
export function getSupabase(): SupabaseClient {
  return getSupabaseClient();
}

// Create a default client instance for direct imports
// This is especially useful in static builds where we can't rely on API routes
export const supabase = getSupabase();
