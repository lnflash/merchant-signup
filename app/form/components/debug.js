'use client';

/**
 * Debug helper for Next.js static builds
 * Displays environment information and helps diagnose issues
 */
export const debugEnvironment = () => {
  if (typeof window === 'undefined') {
    console.log('Running on server');
    return;
  }

  console.group('🔍 Environment Debug');
  
  // Basic environment check
  console.log('Runtime Environment:', {
    nodeEnv: process.env.NODE_ENV,
    isBuildTime: process.env.IS_BUILD_TIME,
    isStaticBuild: typeof window !== 'undefined' && window.ENV && window.ENV.BUILD_TIME,
  });
  
  // Check window.ENV
  if (window.ENV) {
    console.log('window.ENV is available:', {
      keys: Object.keys(window.ENV),
      hasBuildTime: !!window.ENV.BUILD_TIME,
      buildDate: window.ENV.BUILD_DATE,
      hasSupabaseUrl: !!window.ENV.SUPABASE_URL,
      hasSupabaseKey: !!window.ENV.SUPABASE_KEY,
    });
  } else {
    console.warn('window.ENV is NOT available');
  }
  
  // Check env-config.js
  const hasEnvConfigScript = !!document.querySelector('script[src="/env-config.js"]');
  console.log('env-config.js script:', hasEnvConfigScript ? 'Found in DOM' : 'Not found in DOM');
  
  // Check for Supabase credentials in meta tags
  const supabaseUrlMeta = document.querySelector('meta[name="supabase-url"]');
  const supabaseKeyMeta = document.querySelector('meta[name="supabase-anon-key"]');
  console.log('Supabase Meta Tags:', {
    urlMeta: supabaseUrlMeta ? 'Found' : 'Not found',
    keyMeta: supabaseKeyMeta ? 'Found' : 'Not found',
  });
  
  // Check Next.js runtime info
  console.log('Next.js Runtime:', {
    nextData: !!document.getElementById('__NEXT_DATA__'),
    nextBuildId: window.__NEXT_DATA__?.buildId || 'Not available',
  });
  
  console.groupEnd();
  
  return {
    env: window.ENV || {},
    hasCredentials: !!(window.ENV?.SUPABASE_URL && window.ENV?.SUPABASE_KEY),
    hasEnvConfigScript,
    hasMeta: !!(supabaseUrlMeta && supabaseKeyMeta),
  };
};

export default debugEnvironment;