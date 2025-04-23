'use client';

import React, { useCallback, useState, useEffect } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { mapsLogger } from '../../../src/utils/mapsLogger';
import { useGoogleMapsApi } from '../../../src/hooks/useGoogleMapsApi';

interface AddressMapProps {
  latitude: number | null;
  longitude: number | null;
  isExpanded?: boolean;
  toggleExpand?: () => void;
}

// Responsive container style
const containerStyle = {
  width: '100%',
  height: '200px',
  borderRadius: '8px',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
};

/**
 * Enhanced address map component with better API key detection
 * and error handling
 */
export const AddressMap: React.FC<AddressMapProps> = ({
  latitude,
  longitude,
  isExpanded = true,
  toggleExpand,
}) => {
  // Use our custom hook for Google Maps API
  const { status, isLoaded, hasValidKey, loadScript, error } = useGoogleMapsApi();

  // Map state
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Diagnostic function to check all possible API key sources
  const checkApiKey = () => {
    // Log all possible API key sources
    console.log('🗺️ Google Maps API Key Debug:');
    console.log(
      '- window.googleMapsApiKey:',
      typeof window !== 'undefined' && !!(window as any).googleMapsApiKey
    );
    console.log(
      '- window.ENV?.GOOGLE_MAPS_API_KEY:',
      typeof window !== 'undefined' && !!(window as any).ENV?.GOOGLE_MAPS_API_KEY
    );

    // Check meta tag
    const metaTag =
      typeof document !== 'undefined' && document.querySelector('meta[name="google-maps-api-key"]');
    console.log('- Meta tag present:', !!metaTag);
    console.log(
      '- Meta tag content:',
      metaTag ? (metaTag.getAttribute('content') ? 'has content' : 'empty content') : 'N/A'
    );

    // Check process.env
    console.log(
      '- process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY:',
      !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    );

    // Check if script is in DOM
    const script = typeof document !== 'undefined' && document.getElementById('google-maps-script');
    console.log('- Google Maps script in DOM:', !!script);

    // Get content of window.ENV
    if (typeof window !== 'undefined' && (window as any).ENV) {
      console.log('- window.ENV object:', Object.keys((window as any).ENV));
    } else {
      console.log('- window.ENV object: not found');
    }
  };

  // Load the Google Maps API on component mount
  useEffect(() => {
    // Run diagnostic check
    checkApiKey();

    // Try to manually set the key for debugging
    if (
      typeof window !== 'undefined' &&
      document.querySelector('meta[name="google-maps-api-key"]')
    ) {
      const metaTag = document.querySelector('meta[name="google-maps-api-key"]');
      const metaContent = metaTag?.getAttribute('content');

      if (metaContent && !window.googleMapsApiKey) {
        console.log('🗺️ Setting window.googleMapsApiKey from meta tag');
        (window as any).googleMapsApiKey = metaContent;

        // Also set it in window.ENV if it exists
        if ((window as any).ENV) {
          console.log('🗺️ Setting window.ENV.GOOGLE_MAPS_API_KEY from meta tag');
          (window as any).ENV.GOOGLE_MAPS_API_KEY = metaContent;
        }
      }
    }

    // Now call the load script
    loadScript();
  }, [loadScript]);

  // Set status messages based on API loading state
  useEffect(() => {
    switch (status) {
      case 'loading':
        setStatusMessage('Loading map...');
        break;
      case 'no-key':
        setStatusMessage('Maps not available - API key not configured');
        break;
      case 'invalid-key':
        setStatusMessage('Maps not available - Invalid API key');
        break;
      case 'error':
        setStatusMessage(`Error loading map: ${error?.message || 'Unknown error'}`);
        break;
      case 'ready':
        if (!latitude || !longitude) {
          setStatusMessage('Select an address to see the location on map');
        } else {
          setStatusMessage(null);
          // Log successful map loading
          mapsLogger.logMapLoading(true);
        }
        break;
    }
  }, [status, error, latitude, longitude]);

  // Center coordinates
  const center = {
    lat: latitude || 0,
    lng: longitude || 0,
  };

  // Map loading and unloading callbacks
  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Show a collapsed view if not expanded
  if (!isExpanded) {
    return (
      <div className="w-full text-center">
        <button
          type="button"
          onClick={toggleExpand}
          className="text-blue-600 text-sm hover:text-blue-800 underline focus:outline-none"
        >
          Show map
        </button>
      </div>
    );
  }

  // Show loading or error state
  if (!isLoaded || !latitude || !longitude || !hasValidKey) {
    return (
      <div className="w-full h-[200px] bg-gray-100 rounded-lg flex flex-col items-center justify-center p-4">
        {!hasValidKey ? (
          <>
            <svg
              className="h-8 w-8 text-amber-500 mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span className="text-gray-500 text-center">{statusMessage || 'Map unavailable'}</span>
          </>
        ) : (
          <>
            {status === 'loading' ? (
              <div className="animate-pulse flex space-x-2">
                <div className="h-2 w-2 bg-blue-400 rounded-full"></div>
                <div className="h-2 w-2 bg-blue-400 rounded-full"></div>
                <div className="h-2 w-2 bg-blue-400 rounded-full"></div>
              </div>
            ) : (
              <span className="text-gray-500">{statusMessage || 'No location selected'}</span>
            )}
          </>
        )}
      </div>
    );
  }

  // Render the map when everything is ready
  return (
    <div className="relative">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={15}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
          fullscreenControl: true,
          mapTypeControl: false,
          streetViewControl: false,
        }}
      >
        <Marker position={center} />
      </GoogleMap>

      {toggleExpand && (
        <button
          type="button"
          onClick={toggleExpand}
          className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md text-gray-700 hover:bg-gray-100"
          aria-label="Hide map"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
};
