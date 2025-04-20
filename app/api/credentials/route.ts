import { NextResponse } from 'next/server';
import { config } from '../../../src/config';
import { logger } from '../../../src/utils/logger';

/**
 * Secure API endpoint to provide Supabase credentials to client components
 * This ensures credentials are consistent across server and client environments
 */
export async function GET() {
  // Generate a trace ID for this request
  const traceId = `cred_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 5)}`;

  // Extra safety: check for production + appropriate origin in real-world
  // const isValidOrigin = req.headers.get('origin') === 'https://your-domain.com';

  logger.info(`[🔑] [${traceId}] Credentials API request received`);

  // Get all environment variables for debugging (without sensitive values)
  const allEnvVars = Object.keys(process.env)
    .filter(key => !key.includes('KEY') && !key.includes('SECRET') && !key.includes('TOKEN'))
    .reduce(
      (obj, key) => {
        obj[key] = process.env[key];
        return obj;
      },
      {} as Record<string, string | undefined>
    );

  // Special debug for DigitalOcean App Platform
  const isDigitalOcean =
    process.env.NEXT_PUBLIC_IS_DIGITALOCEAN || process.env.DO_APP_ID || process.env.DO_NAMESPACE;

  // Check environment variable clarity - sometimes env vars can have hidden spaces or characters
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  // Detailed inspection of credentials (without revealing actual values)
  const credentialInspection = {
    // URL inspection
    urlExists: !!supabaseUrl,
    urlLength: supabaseUrl.length,
    urlEmpty: supabaseUrl === '',
    urlFirstChars: supabaseUrl ? supabaseUrl.substring(0, 8) : 'N/A', // Just show 'https://' part
    urlValidFormat: supabaseUrl.startsWith('https://'),
    // Key inspection
    keyExists: !!supabaseKey,
    keyLength: supabaseKey.length,
    keyEmpty: supabaseKey === '',
    keyNonEmpty: supabaseKey !== '',
    // Platform details
    platform: isDigitalOcean ? 'DigitalOcean' : 'Other',
    environment: process.env.NODE_ENV,
    // Config structure verification
    configHasSupabase: !!config.supabase,
    configSupabaseUrl: config.supabase.url === supabaseUrl,
    configSupabaseBucket: config.supabase.storageBucket,
  };

  // Get credentials from environment variables
  const credentials = {
    supabaseUrl,
    supabaseKey,
    bucket: config.supabase.storageBucket || 'id_uploads',
    environment: process.env.NODE_ENV,
    buildTime: process.env.IS_BUILD_TIME === 'true',
    platform: isDigitalOcean ? 'DigitalOcean' : 'Other',
    traceId, // Include trace ID for client-side logging correlation
    serverTime: new Date().toISOString(),
    debug: {
      envKeys: Object.keys(process.env).filter(k => !k.includes('KEY') && !k.includes('TOKEN')),
      isDigitalOcean: !!isDigitalOcean,
      isSupabaseConfigured: !!(supabaseUrl && supabaseKey),
      doNamespace: process.env.DO_NAMESPACE,
      doAppId: process.env.DO_APP_ID ? true : false,
    },
  };

  // Log detailed credential inspection (without leaking values)
  logger.info(`[🔑] [${traceId}] Credential inspection:`, credentialInspection);

  // Very explicit log for critical information about credentials
  if (!supabaseUrl || !supabaseKey) {
    logger.error(`[🔑] [${traceId}] 🚨 CRITICAL: Missing Supabase credentials`, {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      environment: process.env.NODE_ENV,
      isDigitalOcean,
    });
  } else {
    logger.info(`[🔑] [${traceId}] ✅ Credentials available and being returned to client`);
  }

  return NextResponse.json(credentials);
}
