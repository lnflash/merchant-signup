'use client';

import { useState } from 'react';

export default function TestSubmit() {
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Check if we're in a static build - more comprehensive detection
  const isStaticBuild = typeof window !== 'undefined' && (
    // Check window.ENV.BUILD_TIME
    (window.ENV && window.ENV.BUILD_TIME) ||
    // Check URL for DigitalOcean domain
    (window.location.hostname.includes('digitalocean') && !window.navigator.serviceWorker) ||
    // Check for other static build indicators
    document.querySelector('meta[name="static-build"]') !== null
  );
  
  const handleTestSubmit = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);
    
    // Simple test data for personal account - only required fields
    const testData = {
      name: "Test User",
      phone: "+12345678900",
      email: "test@example.com",
      account_type: "personal",
      terms_accepted: true,
      // Empty fields for business/merchant
      business_name: "",
      business_address: "",
      bank_name: "",
      bank_branch: "",
      bank_account_type: "",
      account_currency: "",
      bank_account_number: "",
      id_image_url: ""
    };
    
    try {
      console.log('Submitting test data');
      console.log('Is static build:', isStaticBuild);
      
      if (isStaticBuild) {
        // For static builds, use direct Supabase connection
        console.log('Using direct Supabase connection for static build');
        
        // Import from supabase-singleton
        const { supabase } = await import('../../../lib/supabase-singleton');
        
        // Test the connection
        console.log('Testing Supabase connection');
        
        // Try inserting directly into the signups table (primary table)
        console.log('Attempting to insert directly into signups table...');
        try {
          const { data, error } = await supabase
            .from('signups')
            .insert([
              {
                ...testData,
                created_at: new Date().toISOString()
              }
            ])
            .select();
            
          if (error) {
            console.error('Error inserting into signups table:', error);
            throw new Error(`Error inserting into signups table: ${error.message}`);
          }
          
          console.log('Successfully inserted data into signups table:', data);
          setResponse({
            success: true,
            message: 'Form submitted successfully via direct Supabase connection',
            data: data[0]
          });
          setLoading(false);
          return;
        } catch (insertError) {
          console.error('Failed to insert into signups table:', insertError);
          
          // Try using the storage fallback
          console.log('Trying storage fallback...');
          
          try {
            // Convert data to JSON string
            const jsonData = JSON.stringify({
              ...testData,
              submitted_at: new Date().toISOString(),
              submission_source: 'test_static_client'
            });
            
            // Create a blob
            const blob = new Blob([jsonData], { type: 'application/json' });
            
            // Generate a unique filename
            const filename = `form_submission_${Date.now()}.json`;
            
            // Try both the id_uploads bucket and fallback buckets
            for (const bucketName of ['id_uploads', 'public', 'forms']) {
              try {
                console.log(`Trying to upload to ${bucketName} bucket...`);
                const { data, error } = await supabase
                  .storage
                  .from(bucketName)
                  .upload(filename, blob);
                  
                if (!error) {
                  console.log(`Successfully uploaded to ${bucketName} bucket:`, data);
                  setResponse({
                    success: true,
                    message: `Form data stored as file in ${bucketName} bucket`,
                    data: {
                      path: data.path,
                      bucket: bucketName,
                      created_at: new Date().toISOString()
                    }
                  });
                  setLoading(false);
                  return;
                } else {
                  console.error(`Error uploading to ${bucketName}:`, error);
                }
              } catch (bucketError) {
                console.error(`Error with ${bucketName} bucket:`, bucketError);
              }
            }
            
            // If we get here, all storage attempts failed
            throw new Error('All storage fallback attempts failed');
          } catch (storageError) {
            console.error('Storage fallback failed:', storageError);
            throw new Error(`Could not submit form data: ${storageError.message}`);
          }
        }
      } else {
        // For regular builds, use the API endpoint
        console.log('Using API endpoint for regular build');
        const baseUrl = window.location.origin;
        const url = `${baseUrl}/api/submit`;
        
        console.log('Fetch URL:', url);
        console.log('Request data:', JSON.stringify(testData, null, 2));
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json',
          },
          body: JSON.stringify(testData),
          credentials: 'include',
        });
        
        console.log('Response status:', response.status);
        
        const data = await response.json();
        console.log('Response data:', data);
        
        setResponse(data);
      }
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
      
      {isStaticBuild && (
        <div className="mb-2 px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-lg inline-block">
          Static Build Mode: Using Direct Supabase Connection
        </div>
      )}
      
      <button
        onClick={handleTestSubmit}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Testing...' : isStaticBuild ? 'Test Direct Connection' : 'Test API Submit'}
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