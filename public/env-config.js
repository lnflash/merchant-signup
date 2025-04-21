// This script injects environment variables into the window object
// It's loaded before the application in _document.js
window.ENV = window.ENV || {};

// For debugging purposes only
try {
  // Get environment variables from meta tags, build environment, or development defaults
  const getEnvVars = () => {
    // First check if meta tags exist (they're added during the build)
    const supabaseUrlMeta = document.querySelector('meta[name="supabase-url"]');
    const supabaseKeyMeta = document.querySelector('meta[name="supabase-anon-key"]');

    if (supabaseUrlMeta && supabaseKeyMeta) {
      const url = supabaseUrlMeta.getAttribute('content');
      const key = supabaseKeyMeta.getAttribute('content');
      if (url && key) {
        return {
          SUPABASE_URL: url,
          SUPABASE_KEY: key,
          source: 'meta-tags',
        };
      }
    }

    // Check if window.NEXT_PUBLIC_* variables are available (set during build time)
    if (
      typeof window.NEXT_PUBLIC_SUPABASE_URL !== 'undefined' &&
      typeof window.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'undefined'
    ) {
      return {
        SUPABASE_URL: window.NEXT_PUBLIC_SUPABASE_URL,
        SUPABASE_KEY: window.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        source: 'next-build',
      };
    }

    // Look for hardcoded values in the document as a last resort
    const htmlContent = document.documentElement.innerHTML;
    const urlMatch = htmlContent.match(/NEXT_PUBLIC_SUPABASE_URL["']:["'](https:\/\/[^"']+)["']/);
    const keyMatch = htmlContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY["']:["']([^"']+)["']/);

    if (urlMatch && urlMatch[1] && keyMatch && keyMatch[1]) {
      return {
        SUPABASE_URL: urlMatch[1],
        SUPABASE_KEY: keyMatch[1],
        source: 'html-extract',
      };
    }

    return {
      SUPABASE_URL: '',
      SUPABASE_KEY: '',
      source: 'none',
    };
  };

  // Get the environment variables
  const envVars = getEnvVars();

  // Apply them to window.ENV
  window.ENV.SUPABASE_URL = envVars.SUPABASE_URL;
  window.ENV.SUPABASE_KEY = envVars.SUPABASE_KEY;
  window.ENV.BUILD_TIME = true;
  window.ENV.BUILD_DATE = new Date().toISOString();

  // Log information about the environment
  console.log('Environment configuration:', {
    hasUrl: !!window.ENV.SUPABASE_URL,
    hasKey: !!window.ENV.SUPABASE_KEY,
    buildTime: true,
    source: envVars.source,
    hostname: window.location.hostname,
  });
} catch (error) {
  console.error('Error setting up environment variables in browser:', error);
}
