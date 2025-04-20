import { config } from '../src/config';
import { logger } from '../src/utils/logger';

/**
 * Server-side only credentials for Supabase
 * This ensures we have consistent access to environment variables in server contexts
 */
export const serverCredentials = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  bucket: config.supabase.storageBucket || 'id_uploads',
};

// Log credential availability for server context
if (typeof window === 'undefined') {
  logger.info('Server credentials initialized', {
    hasUrl: !!serverCredentials.supabaseUrl,
    hasKey: !!serverCredentials.supabaseKey,
    bucket: serverCredentials.bucket,
    environment: process.env.NODE_ENV,
    buildTime: process.env.IS_BUILD_TIME === 'true',
  });
}
