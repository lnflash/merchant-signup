import { NextResponse } from 'next/server';
import { config } from '../../../src/config';

/**
 * Secure API endpoint to provide Supabase credentials to client components
 * This ensures credentials are consistent across server and client environments
 */
export async function GET() {
  // Extra safety: check for production + appropriate origin in real-world
  // const isValidOrigin = req.headers.get('origin') === 'https://your-domain.com';

  // Get credentials from environment variables
  const credentials = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    bucket: config.supabase.storageBucket || 'id_uploads',
    environment: process.env.NODE_ENV,
    buildTime: process.env.IS_BUILD_TIME === 'true',
  };

  // Log credential availability (without leaking actual values)
  console.log('API Credentials route accessed:', {
    hasUrl: !!credentials.supabaseUrl,
    hasKey: !!credentials.supabaseKey,
    bucket: credentials.bucket,
    environment: credentials.environment,
    buildTime: credentials.buildTime,
  });

  return NextResponse.json(credentials);
}
