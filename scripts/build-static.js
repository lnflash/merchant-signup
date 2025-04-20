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
  // Create a temporary directory for the API-free build
  console.log('📂 Creating temporary build environment...');
  execSync('mkdir -p temp_build_app', { stdio: 'inherit' });

  // Copy app directory without API routes
  console.log('📋 Copying app directory without API routes...');
  execSync('cp -r app temp_build_app/', { stdio: 'inherit' });
  execSync('rm -rf temp_build_app/app/api', { stdio: 'inherit' });

  // Temporarily rename the original app directory and use our modified one
  console.log('🔄 Swapping app directories...');
  execSync('mv app app_original', { stdio: 'inherit' });
  execSync('mv temp_build_app/app ./', { stdio: 'inherit' });

  // Run the build with the current environment variables
  // With 'output: export' in next.config.js, this will automatically build and export
  console.log('📦 Building Next.js app (with automatic export)...');
  execSync('next build', { stdio: 'inherit' });

  // Restore the original app directory
  console.log('🔄 Restoring original app directory...');
  execSync('rm -rf app', { stdio: 'inherit' });
  execSync('mv app_original app', { stdio: 'inherit' });
  execSync('rm -rf temp_build_app', { stdio: 'inherit' });

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
