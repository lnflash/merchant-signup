// Simple test script to verify coordinate handling in form submissions

const { createClient } = require('@supabase/supabase-js');

// Load environment variables (if using dotenv)
try {
  require('dotenv').config();
} catch (e) {
  console.log('dotenv not installed, skipping...');
}

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    'ERROR: Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.'
  );
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function testCoordinateSubmission() {
  console.log('Testing coordinate submission...');

  // Test data with explicitly set coordinates
  const testData = {
    name: 'Coordinate Test',
    phone: '+18765551234',
    email: 'test@coordinates.com',
    account_type: 'business',
    business_name: 'Coordinate Testing LLC',
    business_address: '123 Test Avenue, Kingston, Jamaica',
    latitude: 18.0179,
    longitude: -76.8099,
    terms_accepted: true,
    wants_terminal: true,
    client_version: 'test-script',
    submission_source: 'test_script',
    timestamp: new Date().toISOString(),
  };

  console.log('Test data to be submitted:', testData);
  console.log('Coordinates being submitted:');
  console.log(' - Latitude:', testData.latitude, 'Type:', typeof testData.latitude);
  console.log(' - Longitude:', testData.longitude, 'Type:', typeof testData.longitude);

  try {
    // Insert the test data
    const { data, error } = await supabase.from('signups').insert([testData]).select();

    if (error) {
      console.error('ERROR inserting test data:', error);
      return;
    }

    console.log('Test data inserted successfully:', data);

    // Verify the data was stored correctly
    const { data: retrievedData, error: retrieveError } = await supabase
      .from('signups')
      .select('*')
      .eq('id', data[0].id)
      .single();

    if (retrieveError) {
      console.error('ERROR retrieving test data:', retrieveError);
      return;
    }

    console.log('Retrieved test data:', retrievedData);
    console.log('Retrieved coordinates:');
    console.log(' - Latitude:', retrievedData.latitude, 'Type:', typeof retrievedData.latitude);
    console.log(' - Longitude:', retrievedData.longitude, 'Type:', typeof retrievedData.longitude);

    // Check if the coordinates match
    if (
      retrievedData.latitude === testData.latitude &&
      retrievedData.longitude === testData.longitude
    ) {
      console.log('✅ SUCCESS: Coordinates were stored and retrieved correctly!');
    } else {
      console.log('❌ FAIL: Coordinates do not match what was submitted!');
      console.log(' - Expected:', testData.latitude, testData.longitude);
      console.log(' - Got:', retrievedData.latitude, retrievedData.longitude);
    }

    // Clean up test data (optional - comment out if you want to keep the test data)
    const { error: deleteError } = await supabase.from('signups').delete().eq('id', data[0].id);

    if (deleteError) {
      console.error('ERROR deleting test data:', deleteError);
    } else {
      console.log('Test data cleaned up successfully');
    }
  } catch (error) {
    console.error('ERROR during test execution:', error);
  }
}

testCoordinateSubmission();
