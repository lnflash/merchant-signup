'use client';

import React, { useCallback, useState, useEffect } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { mapsLogger } from '../../../src/utils/mapsLogger';

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

export const AddressMap: React.FC<AddressMapProps> = ({
  latitude,
  longitude,
  isExpanded = true,
  toggleExpand,
}) => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  const invalidApiKey = !apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE';
  const buildTime = process.env.IS_BUILD_TIME === 'true';

  // Log API key status on mount and set up error listeners
  useEffect(() => {
    mapsLogger.logApiKeyStatus();

    // Additional console logging in development for easier debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('🗺️ AddressMap initialized with:', {
        hasApiKey: !!apiKey && apiKey !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE',
        keyLength: apiKey ? apiKey.length : 0,
        buildTime,
        environment: process.env.NODE_ENV,
        coordinates: {
          lat: latitude,
          lng: longitude,
        },
      });
    }

    // Set up a global error listener specifically for Maps API
    const handleGlobalError = (event: ErrorEvent) => {
      if (event.message && event.message.includes('google.maps')) {
        mapsLogger.logCorsIssue(event);
      }
    };

    window.addEventListener('error', handleGlobalError);

    return () => {
      window.removeEventListener('error', handleGlobalError);
    };
  }, [apiKey, latitude, longitude, buildTime]);

  // Show warnings only in development
  if (process.env.NODE_ENV === 'development' && invalidApiKey) {
    console.warn(
      'Google Maps API Key not set or invalid in .env.local. Map will not render properly. Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key to .env.local'
    );
  }

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    // No additional options needed here
  });

  // Log when the map loads or fails to load
  useEffect(() => {
    if (isLoaded) {
      mapsLogger.logMapLoading(true);
    }
  }, [isLoaded]);

  // Map state is used in the callbacks
  const [, setMap] = useState<google.maps.Map | null>(null);

  const center = {
    lat: latitude || 0,
    lng: longitude || 0,
  };

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  if (!isLoaded || !latitude || !longitude) {
    return (
      <div className="w-full h-[200px] bg-gray-100 rounded-lg flex items-center justify-center">
        <span className="text-gray-500">No location selected</span>
      </div>
    );
  }

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
