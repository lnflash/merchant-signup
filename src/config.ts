/**
 * Application configuration
 */
export const config = {
  app: {
    name: 'Flash Merchant Signup',
    version: '0.2.0',
    environment: process.env.NODE_ENV || 'development',
  },
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    storageBucket: 'id_uploads', // Existing bucket name for storing ID documents
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_VERCEL_URL || '', // For auth redirects
  },
  logging: {
    enabled: true,
    level: process.env.LOG_LEVEL || 'info',
    debugInProduction: process.env.DEBUG_IN_PRODUCTION === 'true' || false,
    remoteLogging: process.env.ENABLE_REMOTE_LOGGING === 'true' || false,
  },
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || '',
  },
};

// Log application startup information
if (typeof window === 'undefined') {
  // Only log on server-side to avoid duplicate logs
  console.log('🚀 Starting Flash Merchant Signup application');
  console.log(`🔧 Environment: ${config.app.environment}`);
  console.log(`📦 Version: ${config.app.version}`);

  if (config.supabase.url && config.supabase.anonKey) {
    console.log('🔌 Supabase configuration: Available');
  } else {
    console.log('⚠️ Supabase configuration: Missing or incomplete');
  }
}
