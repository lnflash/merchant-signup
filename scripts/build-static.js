/**
 * Static Build Script
 *
 * This script builds the Next.js app with environment variables baked in
 * for deployment to static hosting like DigitalOcean App Platform.
 */

// Load environment variables from .env file if available
try {
  require('dotenv').config();
} catch (e) {
  console.log('dotenv not available, using existing environment variables');
}

// Set build-time flag
process.env.IS_BUILD_TIME = 'true';

// Check if we have required environment variables
const requiredVars = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];

let missingVars = false;
requiredVars.forEach(varName => {
  if (!process.env[varName]) {
    console.error(`❌ Required environment variable ${varName} is missing!`);
    missingVars = true;
  } else {
    console.log(`✅ ${varName} is set`);
  }
});

if (missingVars) {
  console.error('❌ Cannot build without required environment variables.');
  console.log('Set them in your .env file or environment before building.');
  process.exit(1);
}

// Use the check-env script for more detailed checks
try {
  require('./check-env');
} catch (e) {
  console.error('Error running environment check:', e);
  // Continue anyway
}

// Start the build process
console.log('\n🏗️ Starting static build process...');

const { execSync } = require('child_process');

try {
  // Force-remove any api route directories that might cause issues with static export
  console.log('🗑️ Cleaning up API routes to avoid static export issues...');
  try {
    execSync('rm -rf app/api', { stdio: 'inherit' });
  } catch (e) {
    console.warn('Warning: Could not remove API routes directory (might not exist)');
  }

  // Run the build with the current environment variables
  // With 'output: export' in next.config.js, this will automatically build and export
  console.log('📦 Building Next.js app (with automatic export)...');
  execSync('next build', { stdio: 'inherit' });

  console.log('\n✅ Static build completed successfully!');
  console.log('📂 Output directory: ./out');
  console.log('\nTo test the static build:');
  console.log('1. cd out');
  console.log('2. npx serve'); // or any static file server
  console.log('\nTo deploy to DigitalOcean App Platform:');
  console.log('1. Push to your GitHub repository');
  console.log('2. GitHub Actions will handle deployment automatically');
} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  process.exit(1);
}
