// Silent Cloudflare cookie handler
// This script runs silently and handles Cloudflare cookies without console output
(function () {
  try {
    // Set cookie directly
    document.cookie = '__cf_bm=accept; SameSite=None; Secure';

    // Suppress Cloudflare-related console warnings
    const originalWarn = console.warn;
    const originalError = console.error;

    console.warn = function (...args) {
      if (
        args.length > 0 &&
        typeof args[0] === 'string' &&
        (args[0].includes('__cf_bm') || args[0].includes('Cloudflare'))
      ) {
        return; // Silently suppress
      }
      return originalWarn.apply(console, args);
    };

    console.error = function (...args) {
      if (
        args.length > 0 &&
        typeof args[0] === 'string' &&
        (args[0].includes('__cf_bm') || args[0].includes('Cloudflare'))
      ) {
        return; // Silently suppress
      }
      return originalError.apply(console, args);
    };
  } catch (e) {
    // Silent failure
  }
})();
