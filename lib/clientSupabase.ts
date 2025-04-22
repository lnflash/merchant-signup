import { createClient } from '@supabase/supabase-js';
import { config } from '../src/config';
import { logger } from '../src/utils/logger';

/**
 * Creates a Supabase client to be used client-side
 * This function ensures that credentials are checked at runtime in the browser
 */
export function createSupabaseClient() {
  // Get Supabase URL and key from browser environment
  const supabaseUrl =
    typeof window !== 'undefined'
      ? window.ENV?.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || config.supabase.url
      : process.env.NEXT_PUBLIC_SUPABASE_URL || config.supabase.url;

  const supabaseAnonKey =
    typeof window !== 'undefined'
      ? window.ENV?.SUPABASE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        config.supabase.anonKey
      : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || config.supabase.anonKey;

  // Check if we have valid credentials
  const hasValidCredentials =
    supabaseUrl && supabaseAnonKey && supabaseUrl !== '' && supabaseAnonKey !== '';

  // Log the current environment variables to help debug (safely)
  const envContext = {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    isBrowser: typeof window !== 'undefined',
    nodeEnv: process.env.NODE_ENV,
  };

  // Always create a client-side instance even if using mock
  if (hasValidCredentials) {
    logger.info('Creating Supabase client with real credentials', {
      url: supabaseUrl.substring(0, 8) + '...',
    });

    // Get site URL for auth redirects
    const siteUrl =
      typeof window !== 'undefined' && window.location
        ? window.location.origin
        : process.env.NEXT_PUBLIC_SITE_URL ||
          process.env.NEXT_PUBLIC_VERCEL_URL ||
          config.supabase.siteUrl;

    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // For OAuth and email confirmations
        ...(siteUrl ? { redirectTo: siteUrl } : {}),
      },
    });
  } else {
    logger.warn('Creating mock Supabase client (credentials missing)', envContext);

    // Return a mock client
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
        // Storage bucket operations
        listBuckets: () => {
          logger.info('Mock list Supabase storage buckets', { mock: true });
          return Promise.resolve({
            data: [{ name: 'id_uploads', public: true }],
            error: null,
          });
        },
        createBucket: (name: string, options?: any) => {
          logger.info(`Mock create bucket: ${name}`, { mock: true, options });
          return Promise.resolve({ data: { name }, error: null });
        },
        // File operations
        from: (bucket: string) => ({
          upload: (path: string, file: any, options?: any) => {
            logger.info(`Mock file upload to ${bucket}/${path}`, { mock: true, options });
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
          list: (prefix?: string) => {
            logger.info(`Mock list files in ${bucket}${prefix ? '/' + prefix : ''}`, {
              mock: true,
            });
            return Promise.resolve({
              data: [{ name: 'example.jpg', id: 'mock-file-id' }],
              error: null,
            });
          },
          remove: (paths: string | string[]) => {
            const pathArr = typeof paths === 'string' ? [paths] : paths;
            logger.info(`Mock remove files from ${bucket}`, { mock: true, paths: pathArr });
            return Promise.resolve({ data: { paths: pathArr }, error: null });
          },
          createSignedUrl: (path: string, expiresIn: number) => {
            logger.info(`Mock create signed URL for ${bucket}/${path}`, { mock: true, expiresIn });
            return Promise.resolve({
              data: {
                signedUrl: `https://example.com/signed/${bucket}/${path}?expires=${Date.now() + expiresIn}`,
              },
              error: null,
            });
          },
        }),
      },
      auth: {
        signUp: () => Promise.resolve({ error: null }),
        signIn: () => Promise.resolve({ error: null }),
      },
    };
  }
}
