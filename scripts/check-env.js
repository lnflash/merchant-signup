/**
 * Environment variable validation script
 *
 * This script checks for required environment variables and validates their format.
 * It's designed to run both during development and as a pre-build check.
 */

console.log('🔍 Checking environment variables...');

// Required environment variables
const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
];

// Optional environment variables
const optionalVars = ['NEXT_PUBLIC_API_BASE_URL', 'NEXT_PUBLIC_IS_DIGITALOCEAN'];

// Platform detection
const isDigitalOcean =
  process.env.NEXT_PUBLIC_IS_DIGITALOCEAN || process.env.DO_APP_ID || process.env.DO_NAMESPACE;

console.log(`🖥️ Platform: ${isDigitalOcean ? 'DigitalOcean' : 'Other'}`);
console.log(`🔄 Environment: ${process.env.NODE_ENV || 'unknown'}`);

// Track issues
let hasErrors = false;
let hasWarnings = false;

// Check required vars
requiredVars.forEach(varName => {
  const value = process.env[varName] || '';

  if (!value) {
    console.error(`❌ Required environment variable ${varName} is missing!`);
    hasErrors = true;
    return;
  }

  // Special validation for specific variables
  if (varName === 'NEXT_PUBLIC_SUPABASE_URL') {
    if (!value.startsWith('https://')) {
      console.error(`❌ ${varName} must start with https://`);
      hasErrors = true;
    }

    // Check for trailing slash which can cause issues
    if (value.endsWith('/')) {
      console.warn(`⚠️ ${varName} has a trailing slash which may cause issues`);
      hasWarnings = true;
    }

    console.log(`✅ ${varName} is set (${value.substring(0, 15)}...)`);
  } else if (varName === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') {
    // Simple length check
    if (value.length < 20) {
      console.error(`❌ ${varName} appears to be invalid (too short)`);
      hasErrors = true;
    } else {
      console.log(`✅ ${varName} is set (length: ${value.length})`);
    }
  } else if (varName === 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY') {
    // Simple length check for Google Maps API key
    if (value.length < 10) {
      console.error(`❌ ${varName} appears to be invalid (too short)`);
      hasErrors = true;
    } else {
      console.log(`✅ ${varName} is set (length: ${value.length})`);
    }
  } else {
    console.log(`✅ ${varName} is set`);
  }
});

// Check optional vars
optionalVars.forEach(varName => {
  const value = process.env[varName];

  if (value) {
    console.log(`✅ Optional ${varName} is set`);
  } else {
    console.log(`ℹ️ Optional ${varName} is not set`);
  }
});

// Check for whitespace in environment variables
Object.keys(process.env).forEach(key => {
  if (requiredVars.includes(key) || optionalVars.includes(key)) {
    const value = process.env[key] || '';
    const trimmed = value.trim();

    if (value !== trimmed) {
      console.warn(`⚠️ ${key} has leading or trailing whitespace which may cause issues`);
      console.warn(`   Consider setting this value: "${trimmed}"`);
      hasWarnings = true;
    }
  }
});

// Digital Ocean specific checks
if (isDigitalOcean) {
  console.log('\n📋 DigitalOcean specific checks:');

  // Check for common DigitalOcean environment variable issues
  const doEnvVars = Object.keys(process.env).filter(
    key => key.startsWith('DO_') || key.includes('DIGITAL_OCEAN') || key.includes('DIGITALOCEAN')
  );

  console.log(`🔢 Found ${doEnvVars.length} DigitalOcean environment variables`);

  if (doEnvVars.length > 0) {
    console.log('🗒️ DigitalOcean variables detected:');
    doEnvVars.forEach(key => console.log(`   - ${key}`));
  }

  // Important note about DigitalOcean App Platform
  console.log('\n⚠️ IMPORTANT DigitalOcean App Platform Note:');
  console.log('   Make sure NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,');
  console.log('   and NEXT_PUBLIC_GOOGLE_MAPS_API_KEY are set as Runtime Environment Variables,');
  console.log('   not Build-time Environment Variables.');
  console.log(
    '   Build-time variables are only available during build and not when the app is running!'
  );
}

// Summarize results
// Special message for static build environment
if (process.env.IS_BUILD_TIME === 'true') {
  console.log('\n🏗️ STATIC BUILD ENVIRONMENT DETECTED');
  console.log('Environment variables will be embedded in the static build.');
  console.log(
    'Supabase URL:',
    process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Available' : '❌ Missing'
  );
  console.log(
    'Supabase Key:',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Available' : '❌ Missing'
  );
  console.log(
    'Google Maps API Key:',
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? '✅ Available' : '❌ Missing'
  );
}

console.log('\n📊 Environment check summary:');
if (hasErrors) {
  console.error('❌ Errors found in environment configuration');
  if (process.env.NODE_ENV === 'production' && process.env.IS_BUILD_TIME !== 'true') {
    console.error('🚨 Application will not function correctly in production!');
    process.exit(1); // Exit with error in production unless it's build time
  } else {
    console.warn('⚠️ Application may not function correctly in development');
  }
} else if (hasWarnings) {
  console.warn('⚠️ Warnings found in environment configuration');
  console.log('🔍 Application may work but you should address these warnings');
} else {
  console.log('✅ All environment variables appear to be configured correctly!');

  if (process.env.IS_BUILD_TIME === 'true') {
    console.log('🚀 Ready for static build with embedded environment variables!');
  }
}
