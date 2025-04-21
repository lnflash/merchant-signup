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
        
        // First check if the merchant_signups table exists
        console.log('Checking if merchant_signups table exists...');
        const { data: tableCheck, error: tableCheckError } = await supabase
          .from('merchant_signups')
          .select('id')
          .limit(1);
          
        if (tableCheckError) {
          console.error('Error checking merchant_signups table:', tableCheckError.message);
          
          // Try alternative tables
          console.log('Trying alternative tables...');
          
          // Check for 'signups' table
          const { error: signupsError } = await supabase
            .from('signups')
            .select('id')
            .limit(1);
            
          if (!signupsError) {
            console.log('Found alternative table: signups');
            
            // Insert into signups table
            const { data, error } = await supabase
              .from('signups')
              .insert([
                {
                  ...testData,
                  submitted_at: new Date().toISOString(),
                  submission_source: 'test_static_client'
                }
              ])
              .select();
              
            if (error) {
              throw new Error(`Error inserting into signups table: ${error.message}`);
            }
            
            console.log('Successfully inserted into signups table:', data);
            setResponse({
              success: true,
              message: 'Form submitted successfully to signups table',
              data: data[0]
            });
            setLoading(false);
            return;
          }
          
          // Try users table as fallback
          console.log('Checking users table as fallback...');
          const { error: usersError } = await supabase
            .from('users')
            .select('id')
            .limit(1);
            
          if (!usersError) {
            console.log('Found users table, attempting to insert...');
            
            // Insert into users table with minimal fields
            const { data, error } = await supabase
              .from('users')
              .insert([
                {
                  email: testData.email,
                  name: testData.name,
                  created_at: new Date().toISOString(),
                  source: 'test_static_client'
                }
              ])
              .select();
              
            if (error) {
              throw new Error(`Error inserting into users table: ${error.message}`);
            }
            
            console.log('Successfully inserted into users table:', data);
            setResponse({
              success: true,
              message: 'Form submitted successfully to users table',
              data: data[0]
            });
            setLoading(false);
            return;
          }
          
          // Last resort: try storing in storage
          console.log('No suitable tables found, trying to store in Storage...');
          
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
            
            // Upload to default bucket or create one
            const { data, error } = await supabase
              .storage
              .from('forms')
              .upload(filename, blob);
              
            if (error) {
              // Try to create the bucket first if it doesn't exist
              if (error.message && error.message.includes('bucket')) {
                // Try another bucket name
                const { data: altData, error: altError } = await supabase
                  .storage
                  .from('test-submissions')
                  .upload(filename, blob);
                  
                if (altError) {
                  throw new Error(`Could not upload to storage: ${altError.message}`);
                }
                
                console.log('Uploaded to alternative storage bucket:', altData);
                setResponse({
                  success: true,
                  message: 'Data stored as file in alternative storage bucket',
                  data: altData
                });
                setLoading(false);
                return;
              }
              
              throw new Error(`Could not upload to storage: ${error.message}`);
            }
            
            console.log('Successfully stored in Storage:', data);
            setResponse({
              success: true,
              message: 'Data stored as file in Storage',
              data: data
            });
            setLoading(false);
            return;
          } catch (storageError) {
            console.error('Storage error:', storageError);
            throw new Error(`All submission methods failed. Storage error: ${storageError.message}`);
          }
        }
        
        // If we get here, the merchant_signups table exists, try to insert into it
        console.log('Inserting test data directly to Supabase merchant_signups table');
        try {
          const { data, error } = await supabase
            .from('merchant_signups')
            .insert([
              {
                ...testData,
                submitted_at: new Date().toISOString(),
                submission_source: 'test_static_client'
              }
            ])
            .select();
            
          if (error) {
            // Get detailed error information 
            console.error('Supabase insert error details:', {
              code: error.code,
              message: error.message,
              hint: error.hint || 'No hint'
            });
            
            throw new Error(`Supabase insert error: ${error.message || 'Unknown error'}`);
          }
          
          console.log('Direct Supabase insertion successful:', data);
          setResponse({
            success: true,
            message: 'Form submitted successfully via direct Supabase connection',
            data: data[0]
          });
        } catch (insertError) {
          console.error('Error during insert operation:', insertError);
          throw insertError;
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