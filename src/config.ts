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
  },
  logging: {
    enabled: true,
    level: process.env.LOG_LEVEL || 'info',
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
