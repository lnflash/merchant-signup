'use client';

import { useState, useEffect } from 'react';
import { useSupabase } from '../hooks/useSupabase';

export const DatabaseStatus = () => {
  const { isConnected, error, checkConnection } = useSupabase();
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    // Show the status briefly on first load or error
    if (isConnected !== null || error) {
      setShowStatus(true);

      if (isConnected && !error) {
        // If connected successfully, hide after 5 seconds
        const timer = setTimeout(() => {
          setShowStatus(false);
        }, 5000);

        return () => clearTimeout(timer);
      }
    }
  }, [isConnected, error]);

  // Keep the status visible longer if there's an error
  if (!showStatus && !error) return null;

  return (
    <div
      className={`fixed bottom-4 right-4 p-3 rounded-lg shadow-lg transition-opacity duration-500 ${
        showStatus ? 'opacity-90' : 'opacity-0'
      } ${
        error
          ? 'bg-red-50 border border-red-200 text-red-700'
          : isConnected
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-yellow-50 border border-yellow-200 text-yellow-700'
      }`}
    >
      <div className="flex items-center gap-2">
        <div
          className={`w-3 h-3 rounded-full ${
            error
              ? 'bg-red-500 animate-pulse'
              : isConnected
                ? 'bg-green-500'
                : 'bg-yellow-500 animate-pulse'
          }`}
        ></div>

        <div className="text-sm font-medium">
          {error
            ? 'Database connection error'
            : isConnected
              ? 'Connected to database'
              : 'Connecting to database...'}
        </div>

        {error && (
          <button
            onClick={() => checkConnection()}
            className="ml-3 text-xs bg-red-100 hover:bg-red-200 px-2 py-1 rounded transition-colors"
            aria-label="Retry connection"
          >
            Retry
          </button>
        )}
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
