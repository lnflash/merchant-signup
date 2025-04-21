/**
 * Test Static Build Script
 *
 * This script builds a test version of the Next.js app using the new `output: export` method
 * It's useful for testing the static export build locally before pushing to GitHub Actions
 */

// Set build-time flag
process.env.IS_BUILD_TIME = 'true';
process.env.NEXT_PUBLIC_SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://test-supabase-url.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-anon-key-for-local-testing';

// Start the build process
console.log('\n🏗️ Starting test static build process...');
console.log('Environment variables (detected):', {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'set' : 'not set',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'set' : 'not set',
  IS_BUILD_TIME: process.env.IS_BUILD_TIME,
});

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  // Build the Next.js application with static export
  console.log('📦 Building Next.js app with static export...');
  execSync('next build', { stdio: 'inherit' });

  // Check if the out directory exists
  if (!fs.existsSync('out')) {
    console.error('❌ Static export failed: "out" directory not found');
    process.exit(1);
  }

  // Create API fallbacks
  console.log('📦 Creating API fallbacks...');
  const apiCredentialsDir = path.join('out', 'api', 'credentials');
  fs.mkdirSync(apiCredentialsDir, { recursive: true });

  // Create credentials fallback JSON
  const credentialsContent = JSON.stringify(
    {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      bucket: 'id_uploads',
      environment: 'test',
      buildTime: true,
      platform: 'LocalTestBuild',
      traceId: `local_test_${Date.now().toString(36)}`,
      serverTime: new Date().toISOString(),
    },
    null,
    2
  );

  fs.writeFileSync(path.join(apiCredentialsDir, 'index.json'), credentialsContent);

  // Create enhanced env-config.js
  console.log('📦 Creating enhanced env-config.js...');
  const envConfigContent = `// Static build environment configuration
window.ENV = {
  SUPABASE_URL: "${process.env.NEXT_PUBLIC_SUPABASE_URL}",
  SUPABASE_KEY: "${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}",
  BUILD_TIME: true,
  BUILD_DATE: "${new Date().toISOString()}",
  PLATFORM: "LocalTestBuild"
};

// Log that the environment variables have been loaded from the static build
console.log('Static build environment variables loaded:', {
  hasUrl: !!window.ENV.SUPABASE_URL,
  hasKey: !!window.ENV.SUPABASE_KEY,
  buildTime: window.ENV.BUILD_TIME,
  buildDate: window.ENV.BUILD_DATE
});`;

  fs.writeFileSync(path.join('out', 'env-config.js'), envConfigContent);

  // Verify the build output
  console.log('\n✅ Static build completed successfully!');
  console.log('📂 Output directory: ./out');
  console.log('📂 Structure:');
  const outContents = fs.readdirSync('out');
  console.log(outContents.join(', '));

  // Check if form page exists
  if (fs.existsSync(path.join('out', 'form', 'index.html'))) {
    console.log('✅ Form page exists at out/form/index.html');
  } else if (fs.existsSync(path.join('out', 'form.html'))) {
    console.log('✅ Form page exists at out/form.html');
  } else {
    console.log('⚠️ Warning: Form page not found in expected locations');
  }

  // Check if critical files exist
  const criticalFiles = [
    ['out/env-config.js', 'Environment configuration'],
    ['out/api/credentials/index.json', 'API credentials fallback'],
  ];

  for (const [filePath, description] of criticalFiles) {
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${description} exists`);
    } else {
      console.log(`❌ ${description} is missing!`);
    }
  }

  console.log('\nTo test the static build:');
  console.log('1. npx serve out');
} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  process.exit(1);
}
