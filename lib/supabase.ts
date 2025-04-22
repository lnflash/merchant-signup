import { createClient } from '@supabase/supabase-js';
import { config } from '../src/config';
import { logger } from '../src/utils/logger';

// Create mock client for server without environment variables
const createMockClient = () => {
  // Log the current environment variables to help debug (safely)
  const envContext = {
    hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    nodeEnv: process.env.NODE_ENV,
    isBuildTime: process.env.IS_BUILD_TIME,
  };

  logger.warn(`Using mock Supabase client (missing credentials)`, envContext);

  // Extended mock client with more realistic response handling
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
          // Return a structure matching Supabase's getPublicUrl response
          return {
            data: {
              publicUrl: `https://example.com/${bucket}/${path}`,
            },
          };
        },
        // Add other storage methods as needed
        list: (prefix?: string) => {
          logger.info(`Mock list files in ${bucket}${prefix ? '/' + prefix : ''}`, { mock: true });
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
      signUp: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
      signIn: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
      signInWithPassword: () =>
        Promise.resolve({ data: { user: null, session: null }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
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
