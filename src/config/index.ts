/**
 * Application configuration
 */

export const config = {
  app: {
    name: 'Flash Merchant Signup',
    version: '0.2.0',
    description: 'Signup portal for Flash merchants',
  },
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || '',
    timeout: 30000, // 30 seconds
  },
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    storageBucket: 'id_uploads',
  },
  flash: {
    appUrl: 'https://getflash.io/app',
    apiUrl: process.env.NEXT_PUBLIC_FLASH_API_URL || 'https://api.getflash.io',
  },
};

// Type for the config object
export type Config = typeof config;