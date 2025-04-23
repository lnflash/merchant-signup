/**
 * Maps Logger for Google Maps API integration
 *
 * This module provides specialized logging for Google Maps integration
 * to help debug issues with API keys and map loading.
 */

import { logger } from './logger';

interface GoogleMapsLoggerOptions {
  debugKeyVisibility?: boolean; // Whether to show partial API key in logs
  verbose?: boolean; // Whether to log additional details
}

class GoogleMapsLogger {
  private options: GoogleMapsLoggerOptions;

  constructor(options: GoogleMapsLoggerOptions = {}) {
    this.options = {
      debugKeyVisibility: false,
      verbose: true,
      ...options,
    };
  }

  /**
   * Safely log API key (masked) for debugging purposes
   * @param customApiKey Optional custom API key to check (for window-injected keys)
   */
  public logApiKeyStatus(customApiKey?: string): void {
    // Get API key from environment variables or use the provided custom key
    const apiKey = customApiKey || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    const buildTime = process.env.IS_BUILD_TIME === 'true';

    // Check for window-injected API key (static builds)
    const windowApiKey = typeof window !== 'undefined' && (window as any).googleMapsApiKey;
    // Also check window.ENV which is set in static builds
    const windowEnvApiKey =
      typeof window !== 'undefined' &&
      (window as any).ENV &&
      (window as any).ENV.GOOGLE_MAPS_API_KEY;
    const hasWindowKey = !!windowApiKey || !!windowEnvApiKey;

    // Determine if we're running in a client or server context
    const runtimeContext = typeof window !== 'undefined' ? 'client' : 'server';

    // Mask the API key for security
    let keyStatus = 'not set';
    let partial = '';
    let keySource = 'env';

    // Figure out the key source
    if (windowApiKey && !customApiKey) {
      keySource = 'window';
    } else if (windowEnvApiKey && !customApiKey && !windowApiKey) {
      keySource = 'window.ENV';
    } else if (customApiKey) {
      keySource = 'custom';
    }

    // If window.ENV has a key, use it when no custom key is provided
    if (windowEnvApiKey && !apiKey && !customApiKey) {
      apiKey = windowEnvApiKey;
    }

    if (apiKey) {
      // Only show partial key in development with explicit option
      const isDevelopment = process.env.NODE_ENV === 'development';

      if (apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
        keyStatus = 'placeholder';
      } else if (apiKey.length > 10) {
        keyStatus = 'valid';
        if (isDevelopment && this.options.debugKeyVisibility) {
          partial = `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`;
        }
      } else {
        keyStatus = 'invalid';
      }
    }

    // Log the API key status
    const message = `Google Maps API key status: ${keyStatus}`;

    // Include context information
    const contextInfo = {
      buildTime,
      environment: process.env.NODE_ENV,
      context: runtimeContext,
      keySource,
      hasWindowKey,
      hasWindowEnvKey: !!windowEnvApiKey,
      windowENVExists: typeof window !== 'undefined' && !!(window as any).ENV,
      keyPresent: !!apiKey,
      keyLength: apiKey ? apiKey.length : 0,
      ...(partial ? { partialKey: partial } : {}),
    };

    logger.info(message, contextInfo);

    // If in development and verbose, log to console directly for easier debugging
    if (process.env.NODE_ENV === 'development' && this.options.verbose) {
      console.info(`🗺️ ${message}`, contextInfo);
    }
  }

  /**
   * Log script loading status
   */
  public logScriptLoading(success: boolean, error?: Error): void {
    if (success) {
      logger.info('Google Maps script loaded successfully', {
        component: 'GoogleMaps',
        action: 'scriptLoad',
      });

      if (this.options.verbose) {
        console.info('🗺️ Google Maps script loaded successfully');
      }
    } else {
      logger.error('Google Maps script failed to load', error);

      if (this.options.verbose) {
        console.error('❌ Google Maps script failed to load', error);
      }
    }
  }

  /**
   * Log Places API initialization
   */
  public logPlacesInitialization(success: boolean, error?: Error): void {
    if (success) {
      logger.info('Google Places API initialized successfully', {
        component: 'GoogleMaps',
        action: 'placesInit',
      });

      if (this.options.verbose) {
        console.info('🗺️ Google Places API initialized successfully');
      }
    } else {
      logger.error('Google Places API failed to initialize', error);

      if (this.options.verbose) {
        console.error('❌ Google Places API failed to initialize', error);
      }
    }
  }

  /**
   * Log place selection
   */
  public logPlaceSelection(
    placeId: string | undefined,
    address: string | undefined,
    hasGeometry: boolean
  ): void {
    logger.info('Place selected from autocomplete', {
      component: 'GoogleMaps',
      action: 'placeSelect',
      placeId,
      hasAddress: !!address,
      hasGeometry,
      address: address ? `${address.substring(0, 10)}...` : undefined,
    });

    if (this.options.verbose) {
      console.info(
        `🗺️ Place selected: ${address || 'Unknown'} ${
          hasGeometry ? '(with coordinates)' : '(no coordinates)'
        }`
      );
    }
  }

  /**
   * Log map loading
   */
  public logMapLoading(success: boolean, error?: Error): void {
    if (success) {
      logger.info('Google Map component loaded successfully', {
        component: 'GoogleMaps',
        action: 'mapLoad',
      });

      if (this.options.verbose) {
        console.info('🗺️ Google Map component loaded successfully');
      }
    } else {
      logger.error('Google Map component failed to load', error);

      if (this.options.verbose) {
        console.error('❌ Google Map component failed to load', error);
      }
    }
  }

  /**
   * Log and analyze CORS issues with Google Maps API
   * This is particularly useful for debugging cross-origin issues in static builds
   */
  public logCorsIssue(error: Error | Event | string): void {
    const errorMsg =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : 'Unknown CORS error';

    // Log detailed information about the error
    logger.error('Google Maps CORS issue detected', {
      component: 'GoogleMaps',
      action: 'corsError',
      error: errorMsg,
      origin: typeof window !== 'undefined' ? window.location.origin : 'unknown',
      staticBuild: process.env.IS_BUILD_TIME === 'true',
      referrer: typeof document !== 'undefined' ? document.referrer : 'unknown',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    });

    // More detailed console logging in development
    if (process.env.NODE_ENV === 'development' && this.options.verbose) {
      console.error('🚫 Google Maps CORS issue detected:', {
        error: errorMsg,
        possibleSolutions: [
          'Check that Content-Security-Policy allows Google Maps domains',
          'Ensure crossOrigin="anonymous" is set on script tags',
          'Verify API key restrictions in Google Cloud Console',
          'Check network tab for blocked requests',
          'Ensure your Google Maps API key is properly set',
        ],
        cspDomains: [
          'maps.googleapis.com',
          'maps.gstatic.com',
          '*.googleapis.com',
          '*.gstatic.com',
        ],
      });
    }
  }
}

// Export a singleton instance
export const mapsLogger = new GoogleMapsLogger();
