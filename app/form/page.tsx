'use client';

import { useState, useEffect } from 'react';
import SignupForm from './components/SignupForm';
import debugEnvironment from './components/debug';

export default function FormPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check environment and initialize
  useEffect(() => {
    try {
      console.log('Form page mounted');

      // Debug environment
      const debug = debugEnvironment();
      console.log('Environment debug results:', debug);

      // Check if we're in a static build
      const isStaticBuild = typeof window !== 'undefined' && window.ENV && window.ENV.BUILD_TIME;
      console.log('Is static build:', isStaticBuild);

      // Initialize any required globals for static build
      if (isStaticBuild) {
        console.log('Initializing static build environment');
        // Ensure window.ENV is available to child components
        window.ENV = window.ENV || {};
      }

      // Mark loading complete
      setIsLoading(false);
    } catch (err) {
      console.error('Error initializing form page:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsLoading(false);
    }
  }, []);

  // Show loading state
  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto bg-white p-8 rounded-xl shadow-md">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-3">Loading form...</span>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="max-w-xl mx-auto bg-white p-8 rounded-xl shadow-md">
        <div className="text-center py-8">
          <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded">
            <p className="font-bold">Error loading form</p>
            <p>{error}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show the form
  return (
    <div className="max-w-xl mx-auto bg-white p-8 rounded-xl shadow-md">
      {/* Removed header labels */}
      <SignupForm />
    </div>
  );
}
