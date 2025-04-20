'use client';

import { useState } from 'react';

export default function TestSubmit() {
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleTestSubmit = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);
    
    // Simple test data
    const testData = {
      name: "Test User",
      phone: "+12345678900",
      email: "test@example.com",
      account_type: "personal",
      terms_accepted: true
    };
    
    try {
      console.log('Submitting test data to API');
      const baseUrl = window.location.origin;
      const url = `${baseUrl}/api/submit`;
      
      console.log('Fetch URL:', url);
      console.log('Request data:', JSON.stringify(testData, null, 2));
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });
      
      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('Response data:', data);
      
      setResponse(data);
    } catch (err) {
      console.error('Test submit error:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 mt-8 border border-gray-200 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">API Test</h3>
      
      <button
        onClick={handleTestSubmit}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test API Submit'}
      </button>
      
      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded text-red-700">
          <p className="font-semibold">Error:</p>
          <p>{error}</p>
        </div>
      )}
      
      {response && (
        <div className="mt-4 p-3 bg-green-100 border border-green-200 rounded text-green-700">
          <p className="font-semibold">Response:</p>
          <pre className="mt-2 whitespace-pre-wrap text-sm">
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}