'use client';

import { useState, useEffect } from 'react';
import { useSupabase } from '../hooks/useSupabase';

export const DatabaseStatus = () => {
  const { isConnected, error, isStaticBuild, checkConnection, debugConnectionStatus } = useSupabase();
  const [showStatus, setShowStatus] = useState(true); // Always show initially

  // Debug log
  console.log('DatabaseStatus rendering:', { isConnected, error, isStaticBuild, showStatus });

  useEffect(() => {
    // Always show on first load, error, or when connection status changes
    setShowStatus(true);

    // If connected successfully and no error, hide after 5 seconds
    if (isConnected === true && !error) {
      console.log('Connection successful, will hide status in 5 seconds');
      const timer = setTimeout(() => {
        setShowStatus(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isConnected, error]);

  // Always render the component, even if it might be invisible,
  // to make sure it stays in the DOM
  return (
    <div
      className={`fixed bottom-4 right-4 p-3 rounded-lg shadow-lg transition-all duration-500 z-50 ${
        showStatus ? 'opacity-90 visible' : 'opacity-0 invisible'
      } ${
        error
          ? 'bg-red-50 border border-red-200 text-red-700'
          : isConnected === true
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-yellow-50 border border-yellow-200 text-yellow-700'
      }`}
      style={{ zIndex: 9999 }} // Ensure it's above everything
    >
      <div className="flex items-center gap-2">
        <div
          className={`w-3 h-3 rounded-full ${
            error
              ? 'bg-red-500 animate-pulse'
              : isConnected === true
                ? 'bg-green-500'
                : 'bg-yellow-500 animate-pulse'
          }`}
        ></div>

        <div className="text-sm font-medium">
          {error
            ? 'Database connection error'
            : isConnected === true
              ? isStaticBuild
                ? 'Using static Supabase credentials'
                : 'Connected to database'
              : 'Checking database connection...'}
        </div>

        <button
          onClick={() => debugConnectionStatus()}
          className="ml-3 text-xs bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded transition-colors"
          aria-label="Check connection"
        >
          Check
        </button>

        {error && (
          <button
            onClick={() => checkConnection()}
            className="ml-3 text-xs bg-red-100 hover:bg-red-200 px-2 py-1 rounded transition-colors"
            aria-label="Retry connection"
          >
            Retry
          </button>
        )}

        {/* Always visible toggle button */}
        <button
          onClick={() => setShowStatus(prev => !prev)}
          className="ml-3 text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors"
          aria-label="Toggle visibility"
        >
          {showStatus ? 'Hide' : 'Show'}
        </button>
      </div>

      {error && (
        <div className="mt-1 text-xs opacity-80 max-w-xs overflow-hidden text-ellipsis">
          {error}
        </div>
      )}
    </div>
  );
};

export default DatabaseStatus;
