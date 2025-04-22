import { NextResponse } from 'next/server';
import { config } from '../../../src/config';
import { logger } from '../../../src/utils/logger';

/**
 * Secure API endpoint to provide Supabase credentials to client components
 * This ensures credentials are consistent across server and client environments
 */

// Add a special config to mark this route as dynamic-only (not for static export)
export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export async function GET(request: Request) {
  // Generate a trace ID for this request
  const traceId = `cred_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 5)}`;

  // Capture request headers for debugging
  const headers = Object.fromEntries(request.headers);
  const sanitizedHeaders = { ...headers };
  delete sanitizedHeaders.authorization;
  delete sanitizedHeaders.cookie;

  logger.info(`[🔑] [${traceId}] 📥 Credentials API request received`, {
    method: request.method,
    url: request.url,
    headers: sanitizedHeaders,
  });

  // Check both process.env and config for credentials - print values in development ONLY
  const envUrlRaw = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const envKeyRaw = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  // Trim any potential whitespace
  const supabaseUrl = envUrlRaw.trim();
  const supabaseKey = envKeyRaw.trim();

  // Compare raw vs trimmed for debugging
  const trimCheckUrl = envUrlRaw !== supabaseUrl;
  const trimCheckKey = envKeyRaw !== supabaseKey;

  // Special debug for DigitalOcean App Platform
  const isDigitalOcean =
    process.env.NEXT_PUBLIC_IS_DIGITALOCEAN || process.env.DO_APP_ID || process.env.DO_NAMESPACE;

  // Get all environment variables names (NO VALUES) for debugging
  const allEnvVarNames = Object.keys(process.env).sort();

  // Special check for DigitalOcean environment injected variables
  const doSpecificVars = allEnvVarNames.filter(
    key => key.startsWith('DO_') || key.includes('DIGITAL_OCEAN') || key.includes('DIGITALOCEAN')
  );

  // Try to get values from config as a fallback
  const configUrl = config.supabase.url || '';
  const configKey = config.supabase.anonKey || '';

  // Detailed inspection of credentials (WITHOUT REVEALING ACTUAL FULL VALUES)
  const credentialInspection = {
    // URL inspection - sanitized
    urlFromEnv: !!supabaseUrl,
    urlFromConfig: !!configUrl,
    urlFromEnvLength: supabaseUrl.length,
    urlFromConfigLength: configUrl.length,
    urlStartsWith: supabaseUrl ? supabaseUrl.substring(0, 8) : 'N/A', // Just show 'https://' part
    urlEndsWithSlash: supabaseUrl ? supabaseUrl.endsWith('/') : false,
    urlNeededTrimming: trimCheckUrl,

    // Key inspection - sanitized
    keyFromEnv: !!supabaseKey,
    keyFromConfig: !!configKey,
    keyFromEnvLength: supabaseKey.length,
    keyFromConfigLength: configKey.length,
    keyStartsWitheyJ:
      supabaseKey && supabaseKey.length > 4 ? supabaseKey.substring(0, 4) === 'eyJ0' : false,
    keyNeededTrimming: trimCheckKey,

    // Platform detection
    platform: isDigitalOcean ? 'DigitalOcean' : 'Other',
    environment: process.env.NODE_ENV,
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isDigitalOcean: !!isDigitalOcean,
    doEnvVarCount: doSpecificVars.length,
    doEnvVars: doSpecificVars,

    // Config structure verification
    configHasSupabase: !!config.supabase,
    configSupabaseUrlSetButEmpty: configUrl === '',
    configSupabaseKeySetButEmpty: configKey === '',
    configSupabaseBucket: config.supabase.storageBucket,

    // Process environment info
    totalEnvVarCount: allEnvVarNames.length,
    hasSupabaseEnvVars:
      allEnvVarNames.includes('NEXT_PUBLIC_SUPABASE_URL') &&
      allEnvVarNames.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    nextPublicVarCount: allEnvVarNames.filter(k => k.startsWith('NEXT_PUBLIC_')).length,

    // Runtime info
    nodeVersion: process.version,
    systemPlatform: process.platform,
    buildTime: process.env.IS_BUILD_TIME === 'true',
    timestamp: new Date().toISOString(),
  };

  // Choose url/key, prioritizing env vars but falling back to config
  const finalUrl = supabaseUrl || configUrl;
  const finalKey = supabaseKey || configKey;

  // Build credential object to return
  const credentials = {
    supabaseUrl: finalUrl,
    supabaseKey: finalKey,
    bucket: config.supabase.storageBucket || 'id_uploads',
    environment: process.env.NODE_ENV === 'development' ? 'development' : 'production',
    buildTime: process.env.IS_BUILD_TIME === 'true',
    traceId, // Include trace ID for client-side logging correlation
    serverTime: new Date().toISOString(),
    // Only include minimal debug info and only in development
    ...(process.env.NODE_ENV === 'development'
      ? {
          debug: {
            isSupabaseConfigured: !!(finalUrl && finalKey),
          },
        }
      : {}),
  };

  // Log detailed credential inspection
  logger.info(`[🔑] [${traceId}] 🔍 Credential inspection:`, credentialInspection);

  // Log credentials source (env vs config)
  const credSource = {
    urlFromEnv: !!supabaseUrl,
    urlFromConfig: !supabaseUrl && !!configUrl,
    keyFromEnv: !!supabaseKey,
    keyFromConfig: !supabaseKey && !!configKey,
    urlSource: supabaseUrl ? 'env' : configUrl ? 'config' : 'missing',
    keySource: supabaseKey ? 'env' : configKey ? 'config' : 'missing',
    hasBothCredentials: !!(finalUrl && finalKey),
  };

  logger.info(`[🔑] [${traceId}] 📊 Credential source:`, credSource);

  // Very explicit log for critical information about credentials
  if (!finalUrl || !finalKey) {
    logger.error(`[🔑] [${traceId}] 🚨 CRITICAL: Missing Supabase credentials`, {
      hasUrl: !!finalUrl,
      hasKey: !!finalKey,
      urlSource: credSource.urlSource,
      keySource: credSource.keySource,
      environment: process.env.NODE_ENV,
      isDigitalOcean,
    });

    // Add implementation recommendation
    if (isDigitalOcean) {
      logger.error(
        `[🔑] [${traceId}] 🔧 RECOMMENDATION: Check DigitalOcean App Platform environment variables. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are correctly set. These must be set as Environment Variables, not Build-time Environment Variables.`
      );
    } else {
      logger.error(
        `[🔑] [${traceId}] 🔧 RECOMMENDATION: Check environment variables. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are correctly set.`
      );
    }
  } else {
    logger.info(
      `[🔑] [${traceId}] ✅ Credentials available and being returned to client from ${credSource.urlSource}/${credSource.keySource}`
    );
  }

  return NextResponse.json(credentials);
}
