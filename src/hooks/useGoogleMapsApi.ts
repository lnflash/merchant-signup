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
  loadScript: () => void;
}

const DEFAULT_OPTIONS: GoogleMapsApiOptions = {
  libraries: ['places'],
  version: 'weekly',
  language: 'en',
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
  const [status, setStatus] = useState<GoogleMapsApiStatus>('idle');
  const [error, setError] = useState<Error | null>(null);

  // Check API key validity
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const isStaticBuild = process.env.IS_BUILD_TIME === 'true';
  const hasKey = !!apiKey && apiKey.trim() !== '';
  const isPlaceholder = apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE';
  const hasValidKey = hasKey && !isPlaceholder;

  // Determine initial status based on API key
  useEffect(() => {
    if (!hasKey) {
      setStatus('no-key');
    } else if (isPlaceholder) {
      setStatus('invalid-key');
    }

    // Log API key status
    mapsLogger.logApiKeyStatus();
  }, [hasKey, isPlaceholder]);

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

  // Function to load the Google Maps script
  const loadScript = useCallback(() => {
    // Skip if already loading or loaded
    if (status === 'loading' || status === 'ready') return;

    // Check if already loaded globally
    if (typeof window.google !== 'undefined' && window.google.maps) {
      mapsLogger.logScriptLoading(true);
      setStatus('ready');
      return;
    }

    // Skip if no valid key and not in development
    if (!hasValidKey && process.env.NODE_ENV !== 'development') {
      const noKeyError = new Error('Google Maps API key missing or invalid');
      setError(noKeyError);
      mapsLogger.logScriptLoading(false, noKeyError);
      return;
    }

    try {
      setStatus('loading');

      // Construct the script URL with libraries and other options
      const libraries = options.libraries?.join(',') || 'places';
      const version = options.version || 'weekly';

      const params = new URLSearchParams({
        ...(hasValidKey ? { key: apiKey! } : {}), // Only add key if valid
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
          setStatus('ready');
          setError(null);
          mapsLogger.logScriptLoading(true);
        } else {
          // Script loaded but API not available - rare case
          const apiNotAvailableError = new Error('Google Maps API loaded but not available');
          setStatus('error');
          setError(apiNotAvailableError);
          mapsLogger.logScriptLoading(false, apiNotAvailableError);
        }
      };

      // Error handler
      script.onerror = err => {
        const loadError =
          err instanceof Error ? err : new Error('Failed to load Google Maps script');
        setStatus('error');
        setError(loadError);
        mapsLogger.logScriptLoading(false, loadError);
      };

      // Add script to document
      document.head.appendChild(script);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error loading Google Maps');
      setStatus('error');
      setError(error);
      mapsLogger.logScriptLoading(false, error);
    }
  }, [
    apiKey,
    status,
    hasValidKey,
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
    loadScript,
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
  }
}
