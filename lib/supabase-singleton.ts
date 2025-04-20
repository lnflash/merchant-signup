import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from '../src/utils/logger';

// Cache for Supabase client instances
const clientCache: Record<string, SupabaseClient> = {};

/**
 * Gets or creates a Supabase client instance with the provided credentials
 * Uses a singleton pattern to avoid creating multiple clients with the same credentials
 *
 * @param url Supabase URL
 * @param key Supabase anon key
 * @returns SupabaseClient instance
 */
export function getSupabaseClient(url: string, key: string): SupabaseClient {
  // Validate inputs
  if (!url || !key) {
    logger.error('getSupabaseClient called with invalid credentials', {
      hasUrl: !!url,
      hasKey: !!key,
    });
    throw new Error('Supabase URL and key are required');
  }

  // Create a cache key based on the credentials
  const cacheKey = `${url}:${key}`;

  // Return cached instance if it exists
  if (clientCache[cacheKey]) {
    return clientCache[cacheKey];
  }

  // Create and cache a new instance
  try {
    logger.info('Creating new Supabase client instance');
    const client = createClient(url, key, {
      auth: {
        persistSession: true,
      },
    });

    clientCache[cacheKey] = client;
    return client;
  } catch (error) {
    logger.error('Failed to create Supabase client', error);
    throw error;
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
        return Promise.resolve({ data: [{ id: 'mock-id' }], error: null });
      },
      select: (columns: string, options?: any) => {
        logger.info(`Mock select from ${table} table`, { mock: true, columns });
        return Promise.resolve({
          data: [{ id: 'mock-id', created_at: new Date().toISOString() }],
          error: null,
        });
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
      }),
    },
  };
}
