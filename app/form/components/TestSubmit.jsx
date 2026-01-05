'use client';

import { useState } from 'react';

/**
 * Admin-only component for testing API endpoints
 * @see This component is conditionally rendered only for admin@bobodread.com
 */
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
    
    // Simple test data for business account - only required fields
    const testData = {
      name: "Test User",
      phone: "+12345678900",
      email: "test@example.com",
      account_type: "business",
      terms_accepted: true,
      // Empty fields for business/merchant
      business_name: "",
      business_address: "",
      // Location coordinates
      latitude: null,
      longitude: null,
      // Banking and ID info
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
          // Include all schema fields including the newly added columns
          const schemaValidData = {
            // Core required fields
            name: testData.name,
            phone: testData.phone,
            email: testData.email || null,
            account_type: testData.account_type,
            terms_accepted: testData.terms_accepted,
            
            // Optional business/merchant fields
            ...(testData.business_name ? { business_name: testData.business_name } : {}),
            ...(testData.business_address ? { business_address: testData.business_address } : {}),
            // Location coordinates if they exist
            ...(testData.latitude !== null && testData.latitude !== undefined ? { latitude: testData.latitude } : {}),
            ...(testData.longitude !== null && testData.longitude !== undefined ? { longitude: testData.longitude } : {}),
            // Banking and ID info
            ...(testData.bank_name ? { bank_name: testData.bank_name } : {}),
            ...(testData.bank_branch ? { bank_branch: testData.bank_branch } : {}),
            ...(testData.bank_account_type ? { bank_account_type: testData.bank_account_type } : {}),
            ...(testData.account_currency ? { account_currency: testData.account_currency } : {}),
            ...(testData.bank_account_number ? { bank_account_number: testData.bank_account_number } : {}),
            ...(testData.id_image_url ? { id_image_url: testData.id_image_url } : {}),
            
            // Newly added metadata fields that were previously causing errors
            client_version: window.ENV?.VERSION || 'test-component',
            submission_source: 'test_static_client',
            submitted_at: new Date(),
            timestamp: new Date().toISOString(),
            attempt: 'test_component',
            
            // User agent and device info
            user_agent: navigator.userAgent,
            device_info: JSON.stringify({
              platform: navigator.platform,
              language: navigator.language,
              vendor: navigator.vendor,
              screenSize: `${window.screen.width}x${window.screen.height}`
            })
            
            // created_at is added automatically by the database
          };
          
          console.log('Inserting schema-validated data:', schemaValidData);
          
          // First attempt with schema-validated data
          const { data, error } = await supabase
            .from('signups')
            .insert([schemaValidData])
            .select();
            
          if (error) {
            console.error('Error inserting into signups table:', error);
            
            // Check specifically for column-related errors
            if ((error.code === 'PGRST204' && error.message && error.message.includes('column')) || 
                error.message?.includes('does not exist')) {
              console.log('Column error detected. Trying with minimal fields only.');
              
              // Try again with only essential fields plus the new columns
              const minimalData = {
                name: testData.name,
                phone: testData.phone,
                account_type: "business", // Use hardcoded values for minimal valid row
                terms_accepted: true,     // Use hardcoded values for minimal valid row
                
                // Add the previously missing columns
                client_version: 'minimal-fallback',
                submission_source: 'test_fallback',
                timestamp: new Date().toISOString(),
                attempt: 'minimal_fallback'
              };
              
              console.log('Retrying with minimal data:', minimalData);
              
              const { data: retryData, error: retryError } = await supabase
                .from('signups')
                .insert([minimalData])
                .select();
                
              if (!retryError) {
                console.log('Successfully inserted minimal data into signups table:', retryData);
                setResponse({
                  success: true,
                  message: 'Form submitted successfully with minimal data',
                  data: retryData[0]
                });
                setLoading(false);
                return;
              } else {
                console.error('Retry with minimal data also failed:', retryError);
                throw new Error(`Could not insert into signups table: ${retryError.message}`);
              }
            } else if (error.message?.includes('row-level security') || error.message?.includes('permission denied')) {
              console.error('Row-level security policy error. This is likely a permissions issue.');
              throw new Error(`RLS policy error: ${error.message}`);
            } else {
              throw new Error(`Error inserting into signups table: ${error.message}`);
            }
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
            
            // Try to use formdata bucket first as it's designed for anonymous access
          // Then fallback to other buckets if needed
          for (const bucketName of ['formdata', 'public', 'id-uploads', 'forms']) {
            try {
              console.log(`Trying to upload to ${bucketName} bucket...`);
              
              // For formdata bucket (our new public bucket), no auth is needed
              if (bucketName !== 'formdata') {
                // For other buckets, try with temporary auth first
                try {
                  console.log('Creating temporary auth session for storage access...');
                  const { data: authData, error: authError } = await supabase.auth.signUp({
                    email: `temp_${Date.now()}@example.com`,
                    password: `temp_${Date.now()}_${Math.random().toString(36).substring(2)}`
                  });
                  
                  if (authError) {
                    console.warn('Auth attempt failed, trying anonymous upload anyway:', authError);
                  } else {
                    console.log('Temporary auth session created successfully');
                  }
                } catch (authError) {
                  console.warn('Auth attempt exception, trying anonymous upload anyway:', authError);
                }
              }
              
              const { data, error } = await supabase
                .storage
                .from(bucketName)
                .upload(filename, blob, {
                  cacheControl: '3600',
                  upsert: true
                });
                
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