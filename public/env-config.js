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
    const googleMapsKeyMeta = document.querySelector('meta[name="google-maps-api-key"]');

    // Start with an empty result
    const result = {
      SUPABASE_URL: '',
      SUPABASE_KEY: '',
      GOOGLE_MAPS_API_KEY: '',
      source: 'none',
    };

    // Update from meta tags if available
    if (supabaseUrlMeta && supabaseKeyMeta) {
      const url = supabaseUrlMeta.getAttribute('content');
      const key = supabaseKeyMeta.getAttribute('content');

      if (url && key) {
        result.SUPABASE_URL = url;
        result.SUPABASE_KEY = key;
        result.source = 'meta-tags';
      }
    }

    // Add Google Maps API key if available
    if (googleMapsKeyMeta) {
      const mapsKey = googleMapsKeyMeta.getAttribute('content');
      if (mapsKey) {
        result.GOOGLE_MAPS_API_KEY = mapsKey;
      }
    }

    // Check if window.NEXT_PUBLIC_* variables are available (set during build time)
    if (
      typeof window.NEXT_PUBLIC_SUPABASE_URL !== 'undefined' &&
      typeof window.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'undefined'
    ) {
      result.SUPABASE_URL = window.NEXT_PUBLIC_SUPABASE_URL;
      result.SUPABASE_KEY = window.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      result.source = 'next-build';
    }

    // Check for Google Maps API key
    if (typeof window.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY !== 'undefined') {
      result.GOOGLE_MAPS_API_KEY = window.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    }

    // Look for hardcoded values in the document as a last resort
    if (!result.SUPABASE_URL || !result.SUPABASE_KEY) {
      const htmlContent = document.documentElement.innerHTML;
      const urlMatch = htmlContent.match(/NEXT_PUBLIC_SUPABASE_URL["']:["'](https:\/\/[^"']+)["']/);
      const keyMatch = htmlContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY["']:["']([^"']+)["']/);

      if (urlMatch && urlMatch[1] && keyMatch && keyMatch[1]) {
        result.SUPABASE_URL = urlMatch[1];
        result.SUPABASE_KEY = keyMatch[1];
        result.source = 'html-extract';
      }
    }

    // Try to extract Google Maps API key from HTML if not found yet
    if (!result.GOOGLE_MAPS_API_KEY) {
      const htmlContent = document.documentElement.innerHTML;
      const mapsKeyMatch = htmlContent.match(
        /NEXT_PUBLIC_GOOGLE_MAPS_API_KEY["']:["']([^"']+)["']/
      );

      if (mapsKeyMatch && mapsKeyMatch[1]) {
        result.GOOGLE_MAPS_API_KEY = mapsKeyMatch[1];
      }
    }

    return result;
  };

  // Get the environment variables
  const envVars = getEnvVars();

  // Apply them to window.ENV
  window.ENV.SUPABASE_URL = envVars.SUPABASE_URL;
  window.ENV.SUPABASE_KEY = envVars.SUPABASE_KEY;
  window.ENV.GOOGLE_MAPS_API_KEY = envVars.GOOGLE_MAPS_API_KEY;
  window.ENV.BUILD_TIME = true;
  window.ENV.BUILD_DATE = new Date().toISOString();

  // Set global Google Maps API key for our components to find
  // This matches how Supabase credentials work in the static build
  window.googleMapsApiKey = envVars.GOOGLE_MAPS_API_KEY;

  // HARDCODED FALLBACK MECHANISM - this is a temporary fix
  // If the Google Maps API key is still not set, look for it directly in all possible places
  if (!window.googleMapsApiKey || window.googleMapsApiKey === '') {
    console.log('⚠️ Google Maps API key not found in primary sources, checking fallbacks...');

    // Check if we have a meta tag
    const metaTag = document.querySelector('meta[name="google-maps-api-key"]');
    if (metaTag && metaTag.getAttribute('content')) {
      const metaContent = metaTag.getAttribute('content');
      console.log('✅ Found Google Maps API key in meta tag, setting globals');
      window.googleMapsApiKey = metaContent;
      window.ENV.GOOGLE_MAPS_API_KEY = metaContent;
    }

    // Last resort - inject a temporary key or set from inline script
    const htmlContent = document.documentElement.innerHTML;
    const keyMatches = [
      ...htmlContent.matchAll(/google-maps-api-key["'][^>]+content=["']([^"']+)["']/g),
      ...htmlContent.matchAll(/googleMapsApiKey\s*=\s*["']([^"']+)["']/g),
      ...htmlContent.matchAll(/GOOGLE_MAPS_API_KEY["']\s*:\s*["']([^"']+)["']/g),
    ];

    if (keyMatches && keyMatches.length > 0) {
      for (const match of keyMatches) {
        if (match && match[1] && match[1].length > 5) {
          console.log('✅ Found Google Maps API key in HTML content, setting globals');
          window.googleMapsApiKey = match[1];
          window.ENV.GOOGLE_MAPS_API_KEY = match[1];
          break;
        }
      }
    }
  }

  // Log information about the environment
  console.log('Environment configuration:', {
    hasSupabaseUrl: !!window.ENV.SUPABASE_URL,
    hasSupabaseKey: !!window.ENV.SUPABASE_KEY,
    hasGoogleMapsKey: !!window.ENV.GOOGLE_MAPS_API_KEY,
    hasGoogleMapsWindow: !!window.googleMapsApiKey,
    googleMapsKeyLength: window.googleMapsApiKey ? window.googleMapsApiKey.length : 0,
    metaTagPresent: !!document.querySelector('meta[name="google-maps-api-key"]'),
    buildTime: true,
    source: envVars.source,
    hostname: window.location.hostname,
  });
} catch (error) {
  console.error('Error setting up environment variables in browser:', error);
}
