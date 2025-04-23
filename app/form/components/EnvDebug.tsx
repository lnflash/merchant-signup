'use client';

import React, { useEffect, useState } from 'react';

/**
 * Environmental Variable Debug Component
 *
 * This component is for development debugging only and should not be used in production.
 * It displays masked versions of environment variables to help debug static site builds.
 */
const EnvDebug = () => {
  const [showDebug, setShowDebug] = useState(false);
  const [envVars, setEnvVars] = useState<Record<string, string>>({});

  // Only load in development
  const isDevelopment = process.env.NODE_ENV === 'development';

  useEffect(() => {
    if (!isDevelopment) return;

    // Wait a bit to ensure window is fully loaded
    const timer = setTimeout(() => {
      // Collect environment variables
      const vars: Record<string, string> = {};

      // Add runtime information
      vars['RUNTIME'] = typeof window !== 'undefined' ? 'client' : 'server';
      vars['HAS_WINDOW'] = typeof window !== 'undefined' ? 'true' : 'false';
      vars['HAS_DOCUMENT'] = typeof document !== 'undefined' ? 'true' : 'false';

      // Safely access window properties with type assertions
      if (typeof window !== 'undefined') {
        try {
          // Safely access window.location.href
          if (window.location && window.location.href) {
            const href = window.location.href;
            const urlParts = href.split('?');
            vars['WINDOW_LOCATION'] =
              urlParts && urlParts.length > 0 ? String(urlParts[0]) : 'incomplete-url';
          } else {
            vars['WINDOW_LOCATION'] = 'unavailable';
          }

          // Check if Google Maps is loaded
          vars['GOOGLE_MAPS_LOADED'] = window.google && window.google.maps ? 'true' : 'false';

          // Check for window.googleMapsApiKey (our custom global API key)
          if ((window as any).googleMapsApiKey) {
            const key = (window as any).googleMapsApiKey as string;
            if (key.length > 10) {
              vars['WINDOW_GOOGLE_MAPS_API_KEY'] =
                `${key.substring(0, 3)}...${key.substring(key.length - 3)}`;
            } else if (key) {
              vars['WINDOW_GOOGLE_MAPS_API_KEY'] = '****';
            } else {
              vars['WINDOW_GOOGLE_MAPS_API_KEY'] = 'empty';
            }
          } else {
            vars['WINDOW_GOOGLE_MAPS_API_KEY'] = 'not set';
          }

          // Check if Google Maps script exists in DOM
          const scriptExists = document.getElementById('google-maps-script') !== null;
          vars['MAPS_SCRIPT_IN_DOM'] = scriptExists ? 'true' : 'false';
        } catch (e) {
          vars['ERROR'] = e instanceof Error ? e.message : 'unknown error';
        }
      }

      // Process environment variables (only public ones for security)
      Object.keys(process.env).forEach(key => {
        if (key.startsWith('NEXT_PUBLIC_')) {
          const value = process.env[key] || '';

          // Mask the value for sensitive information
          if (key.includes('KEY') || key.includes('TOKEN') || key.includes('SECRET')) {
            if (value.length > 10) {
              vars[key] = `${value.substring(0, 4)}...${value.substring(value.length - 4)}`;
            } else if (value) {
              vars[key] = '****';
            } else {
              vars[key] = 'empty';
            }
          } else {
            vars[key] = value;
          }
        }
      });

      // Add build time flag
      vars['IS_BUILD_TIME'] = process.env.IS_BUILD_TIME || 'false';
      vars['NODE_ENV'] = process.env.NODE_ENV || 'unknown';

      setEnvVars(vars);
    }, 1000); // Wait for everything to initialize

    return () => clearTimeout(timer);
  }, [isDevelopment]);

  // Don't render anything in production
  if (!isDevelopment) return null;

  return (
    <div className="fixed bottom-0 right-0 bg-white border border-gray-200 rounded-tl-lg shadow-lg p-2 z-50 text-xs">
      <button
        onClick={() => setShowDebug(!showDebug)}
        className="text-blue-600 hover:text-blue-800 font-medium"
      >
        {showDebug ? 'Hide' : 'Show'} Env Debug
      </button>

      {showDebug && (
        <div className="mt-2 max-w-md">
          <h3 className="font-bold mb-1">Environment Variables</h3>
          <ul className="space-y-1">
            {Object.entries(envVars).map(([key, value]) => (
              <li key={key} className="flex justify-between">
                <span className="font-mono text-gray-700">{key}:</span>
                <span className="font-mono text-gray-900 ml-2">{value}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default EnvDebug;
