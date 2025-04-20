// This script injects environment variables into the window object
// It's loaded before the application in _document.js
window.ENV = window.ENV || {};

// For debugging purposes only
try {
  // Check if window.ENV was already populated by static build
  if (window.ENV.BUILD_TIME === true) {
    console.log('Environment variables already loaded from static build');
  } else {
    // Check if we're in production or not
    const inProduction = window.location.hostname !== 'localhost';

    // Look for meta tags with environment variables
    const supabaseUrlMeta = document.querySelector('meta[name="supabase-url"]');
    const supabaseKeyMeta = document.querySelector('meta[name="supabase-anon-key"]');

    if (supabaseUrlMeta && supabaseKeyMeta) {
      window.ENV.SUPABASE_URL = supabaseUrlMeta.getAttribute('content');
      window.ENV.SUPABASE_KEY = supabaseKeyMeta.getAttribute('content');
      window.ENV.BUILD_TIME = true; // Set the BUILD_TIME flag to true
      console.log('Loaded Supabase credentials from meta tags');
    } else {
      console.warn('No Supabase credentials found in meta tags');
    }

    // Log information about the environment
    console.log('Environment configuration:', {
      hasUrl: !!window.ENV.SUPABASE_URL,
      hasKey: !!window.ENV.SUPABASE_KEY,
      buildTime: !!window.ENV.BUILD_TIME,
      inProduction,
      hostname: window.location.hostname,
    });
  }
} catch (error) {
  console.error('Error setting up environment variables in browser:', error);
}
