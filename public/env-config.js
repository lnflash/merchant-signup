// This script injects environment variables into the window object
// It's loaded before the application in _document.js
window.ENV = window.ENV || {};

// For debugging purposes only
// IMPORTANT: In production, this should be dynamically generated during build!
try {
  // Check if we're in production or not
  const inProduction = window.location.hostname !== 'localhost';

  // If we detect certain URL patterns, we might be on DigitalOcean
  if (
    inProduction &&
    (window.location.hostname.includes('ondigitalocean.app') ||
      window.location.hostname.includes('getflash.io'))
  ) {
    console.log(
      'Production environment detected, attempting to load Supabase credentials from meta tags'
    );

    // Try to get credentials from meta tags (to be added by serverless function)
    const supabaseUrlMeta = document.querySelector('meta[name="supabase-url"]');
    const supabaseKeyMeta = document.querySelector('meta[name="supabase-anon-key"]');

    if (supabaseUrlMeta && supabaseKeyMeta) {
      window.ENV.SUPABASE_URL = supabaseUrlMeta.getAttribute('content');
      window.ENV.SUPABASE_KEY = supabaseKeyMeta.getAttribute('content');
      console.log('Loaded Supabase credentials from meta tags');
    } else {
      console.warn('No Supabase credentials found in meta tags');
    }
  } else {
    console.log('Development or local environment detected');
    // In development, you can manually set these for testing
    // window.ENV.SUPABASE_URL = 'your-local-supabase-url';
    // window.ENV.SUPABASE_KEY = 'your-local-supabase-key';
  }
} catch (error) {
  console.error('Error setting up environment variables in browser:', error);
}
