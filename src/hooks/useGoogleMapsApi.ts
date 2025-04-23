import { useState, useEffect, useCallback } from 'react';
import { mapsLogger } from '../utils/mapsLogger';

/**
 * Status types for Google Maps API loading
 */
export type GoogleMapsApiStatus =
  | 'idle' // Initial state
  | 'loading' // Script is loading
  | 'ready' // API is loaded and ready to use
  | 'error' // Failed to load API
  | 'no-key' // No API key is configured
  | 'invalid-key'; // API key is invalid or a placeholder

/**
 * Configuration options for the Google Maps API
 */
interface GoogleMapsApiOptions {
  libraries?: string[];
  version?: string;
  region?: string;
  language?: string;
}

/**
 * Result of the useGoogleMapsApi hook
 */
interface UseGoogleMapsApiResult {
  status: GoogleMapsApiStatus;
  error: Error | null;
  isLoaded: boolean;
  isError: boolean;
  hasValidKey: boolean;
  apiKeyDebug: string;
  loadScript: () => void;
  loadWithoutKey: () => void;
}

const DEFAULT_OPTIONS: GoogleMapsApiOptions = {
  libraries: ['places'],
  version: 'weekly',
  language: 'en',
};

// Global state to prevent multiple script loads
// This is shared across all instances of the hook
const globalState: {
  scriptLoaded: boolean;
  scriptLoading: boolean;
  scriptLoadError: boolean;
  status: GoogleMapsApiStatus;
  googleMapsScript: HTMLScriptElement | null;
} = {
  scriptLoaded: false,
  scriptLoading: false,
  scriptLoadError: false,
  status: 'idle',
  googleMapsScript: null,
};

/**
 * Hook to load and manage the Google Maps API
 *
 * This hook provides a unified way to handle loading the Google Maps API,
 * with proper key validation, error handling, and status tracking.
 */
export function useGoogleMapsApi(
  options: GoogleMapsApiOptions = DEFAULT_OPTIONS
): UseGoogleMapsApiResult {
  const [status, setStatus] = useState<GoogleMapsApiStatus>(globalState.status);
  const [error, setError] = useState<Error | null>(null);

  // Debug mode for development
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isStaticBuild = process.env.IS_BUILD_TIME === 'true';

  // Check for API key in window first (might be injected in static HTML)
  const windowApiKey = typeof window !== 'undefined' && (window as any).googleMapsApiKey;

  // Also check window.ENV which is used in static builds
  const envObjApiKey =
    typeof window !== 'undefined' && window.ENV && window.ENV.GOOGLE_MAPS_API_KEY;

  // Then fallback to environment variable
  const envApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Use the best available key, with window taking precedence
  const apiKey = windowApiKey || envObjApiKey || envApiKey;

  // Generate debug-safe version of key (don't log full key for security)
  const apiKeyDebug = !apiKey
    ? 'missing'
    : apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE'
      ? 'placeholder'
      : apiKey.length > 8
        ? `${apiKey.substring(0, 2)}...${apiKey.substring(apiKey.length - 2)}`
        : 'masked';

  // Check API key validity
  const hasKey = !!apiKey && apiKey.trim() !== '';
  const isPlaceholder = apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE';
  const hasValidKey = hasKey && !isPlaceholder;

  // Debug logging in development
  useEffect(() => {
    if (isDevelopment) {
      console.log('🗺️ Google Maps API configuration:', {
        environment: process.env.NODE_ENV,
        isStaticBuild,
        windowApiKey: !!windowApiKey,
        windowEnvApiKey: !!envObjApiKey,
        envApiKey: !!envApiKey,
        apiKeyDebug,
        hasValidKey,
        windowEnvExists: typeof window !== 'undefined' && !!window.ENV,
        globalScriptStatus: globalState.status,
        googleAvailable: typeof window !== 'undefined' && !!window.google && !!window.google.maps,
      });
    }
  }, [
    isDevelopment,
    windowApiKey,
    envObjApiKey,
    envApiKey,
    apiKeyDebug,
    hasValidKey,
    isStaticBuild,
  ]);

  // Determine initial status based on API key and global state
  useEffect(() => {
    // Check if Google Maps is already available globally
    if (typeof window !== 'undefined' && window.google && window.google.maps) {
      globalState.scriptLoaded = true;
      globalState.status = 'ready';
      setStatus('ready');
      return;
    }

    // If we already tried loading the script, use global state
    if (globalState.scriptLoaded) {
      setStatus('ready');
      return;
    }

    if (globalState.scriptLoadError) {
      setStatus('error');
      return;
    }

    if (globalState.scriptLoading) {
      setStatus('loading');
      return;
    }

    // Otherwise set initial status based on API key
    if (!hasValidKey) {
      const newStatus = !hasKey ? 'no-key' : 'invalid-key';
      setStatus(newStatus);
      globalState.status = newStatus;
    }

    // Log API key status
    mapsLogger.logApiKeyStatus(apiKey);
  }, [hasKey, hasValidKey, apiKey]);

  // Setup error handling for CORS issues
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      // Only handle Google Maps related errors
      if (
        event.message &&
        (event.message.includes('google') ||
          event.message.includes('maps') ||
          event.message.includes('googleapis'))
      ) {
        mapsLogger.logCorsIssue(event);
      }
    };

    window.addEventListener('error', handleGlobalError);

    return () => {
      window.removeEventListener('error', handleGlobalError);
    };
  }, []);

  // Function to load Google Maps without an API key
  // (for development fallback only)
  const loadWithoutKey = useCallback(() => {
    // Skip if already loaded or loading
    if (globalState.scriptLoaded || globalState.scriptLoading) return;

    if (isDevelopment) {
      console.log('🗺️ Attempting to load Google Maps WITHOUT API key (development only)');
    }

    try {
      globalState.scriptLoading = true;
      setStatus('loading');

      // First remove any existing script
      if (globalState.googleMapsScript) {
        document.head.removeChild(globalState.googleMapsScript);
        globalState.googleMapsScript = null;
      }

      const script = document.createElement('script');
      script.src = 'https://maps.googleapis.com/maps/api/js?libraries=places';
      script.async = true;
      script.defer = true;
      script.crossOrigin = 'anonymous';
      script.id = 'google-maps-script-no-key';

      script.onload = () => {
        globalState.scriptLoaded = true;
        globalState.scriptLoading = false;
        globalState.status = 'ready';
        setStatus('ready');

        if (isDevelopment) {
          console.log('🗺️ Google Maps script loaded WITHOUT API key (development only)');
        }
      };

      script.onerror = err => {
        const error = new Error('Failed to load Google Maps script without API key');
        globalState.scriptLoadError = true;
        globalState.scriptLoading = false;
        globalState.status = 'error';
        setStatus('error');
        setError(error);

        if (isDevelopment) {
          console.error('❌ Failed to load Google Maps script without API key:', error);
        }
      };

      document.head.appendChild(script);
      globalState.googleMapsScript = script;
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error('Unknown error loading Google Maps script');
      globalState.scriptLoadError = true;
      globalState.scriptLoading = false;
      globalState.status = 'error';
      setStatus('error');
      setError(error);

      if (isDevelopment) {
        console.error('❌ Error creating Google Maps script element:', error);
      }
    }
  }, [isDevelopment]);

  // Function to load the Google Maps script
  const loadScript = useCallback(() => {
    // Skip if already loading or loaded or error
    if (globalState.scriptLoaded || globalState.scriptLoading || globalState.scriptLoadError) {
      setStatus(globalState.status);
      return;
    }

    // Check if already loaded globally
    if (typeof window !== 'undefined' && window.google && window.google.maps) {
      globalState.scriptLoaded = true;
      globalState.status = 'ready';
      setStatus('ready');
      mapsLogger.logScriptLoading(true);
      return;
    }

    // Skip if no valid key except in development mode
    if (!hasValidKey) {
      // In development, try to load without key
      if (isDevelopment) {
        loadWithoutKey();
        return;
      }

      // In production, just report the error but don't try to load
      const noKeyError = new Error(`Google Maps API key missing or invalid (${apiKeyDebug})`);
      setError(noKeyError);
      mapsLogger.logScriptLoading(false, noKeyError);

      // Set appropriate status
      const newStatus = !hasKey ? 'no-key' : 'invalid-key';
      globalState.status = newStatus;
      setStatus(newStatus);
      return;
    }

    try {
      globalState.scriptLoading = true;
      globalState.status = 'loading';
      setStatus('loading');

      // First remove any existing script
      if (globalState.googleMapsScript) {
        document.head.removeChild(globalState.googleMapsScript);
        globalState.googleMapsScript = null;
      }

      // Construct the script URL with libraries and other options
      const libraries = options.libraries?.join(',') || 'places';
      const version = options.version || 'weekly';

      const params = new URLSearchParams({
        key: apiKey!,
        v: version,
        libraries,
        ...(options.language ? { language: options.language } : {}),
        ...(options.region ? { region: options.region } : {}),
      });

      const scriptUrl = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;

      // Create and append script
      const script = document.createElement('script');
      script.src = scriptUrl;
      script.async = true;
      script.defer = true;
      script.crossOrigin = 'anonymous'; // Important for CORS
      script.id = 'google-maps-script';

      // Success handler
      script.onload = () => {
        if (window.google && window.google.maps) {
          globalState.scriptLoaded = true;
          globalState.scriptLoading = false;
          globalState.status = 'ready';
          setStatus('ready');
          setError(null);
          mapsLogger.logScriptLoading(true);
        } else {
          // Script loaded but API not available - rare case
          const apiNotAvailableError = new Error('Google Maps API loaded but not available');
          globalState.scriptLoadError = true;
          globalState.scriptLoading = false;
          globalState.status = 'error';
          setStatus('error');
          setError(apiNotAvailableError);
          mapsLogger.logScriptLoading(false, apiNotAvailableError);
        }
      };

      // Error handler
      script.onerror = err => {
        const loadError =
          err instanceof Error
            ? err
            : new Error(`Failed to load Google Maps script (${apiKeyDebug})`);
        globalState.scriptLoadError = true;
        globalState.scriptLoading = false;
        globalState.status = 'error';
        setStatus('error');
        setError(loadError);
        mapsLogger.logScriptLoading(false, loadError);
      };

      // Add script to document
      document.head.appendChild(script);
      globalState.googleMapsScript = script;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error loading Google Maps');
      globalState.scriptLoadError = true;
      globalState.scriptLoading = false;
      globalState.status = 'error';
      setStatus('error');
      setError(error);
      mapsLogger.logScriptLoading(false, error);
    }
  }, [
    apiKey,
    apiKeyDebug,
    hasKey,
    hasValidKey,
    isDevelopment,
    loadWithoutKey,
    options.libraries,
    options.version,
    options.language,
    options.region,
  ]);

  return {
    status,
    error,
    isLoaded: status === 'ready',
    isError: ['error', 'no-key', 'invalid-key'].includes(status),
    hasValidKey,
    apiKeyDebug,
    loadScript,
    loadWithoutKey,
  };
}

// Add Google Maps API types to Window interface
declare global {
  interface Window {
    google: {
      maps: {
        places: {
          Autocomplete: new (
            input: HTMLInputElement,
            options?: google.maps.places.AutocompleteOptions
          ) => google.maps.places.Autocomplete;
        };
        Map: any;
        Marker: any;
        LatLng: any;
      };
    };
    // For injecting the API key in static builds
    googleMapsApiKey?: string;
  }
}
