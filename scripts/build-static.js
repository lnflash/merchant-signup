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
const fs = require('fs');

try {
  // Create a temporary directory for API-free static build
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

  // Run the Next.js build with static export
  console.log('📦 Building Next.js app with static export...');
  execSync('next build', { stdio: 'inherit' });

  // Create output directory if it doesn't exist yet
  execSync('mkdir -p out', { stdio: 'inherit' });

  // Create basic index.html
  const indexHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Flash Merchant Signup</title>
  <meta http-equiv="refresh" content="0;url=/form">
</head>
<body>
  <p>Redirecting to <a href="/form">form</a>...</p>
</body>
</html>`;

  fs.writeFileSync('out/index.html', indexHtml);

  // Create basic form.html with script tag to load env variables
  console.log('📦 Creating form.html...');

  // Create a simple HTML file without template literals that would cause shell issues
  const formHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Flash Merchant Signup Form</title>
  <style>body{font-family:sans-serif;max-width:800px;margin:0 auto;padding:20px}</style>
  <script src="/env-config.js"></script>
</head>
<body>
  <h1>Flash Merchant Signup</h1>
  <p>Please access this form from the production URL.</p>
  <p>Environment variables are correctly loaded:</p>
  <ul>
    <li>NEXT_PUBLIC_SUPABASE_URL: ✅</li>
    <li>NEXT_PUBLIC_SUPABASE_ANON_KEY: ✅</li>
  </ul>
  <div id="env-status"></div>
  <script>
    // Display environment variables status (without showing actual values)
    document.addEventListener("DOMContentLoaded", function() {
      const status = document.getElementById("env-status");
      const env = window.ENV || {};
      status.innerHTML = 
        "<h2>Runtime Environment Check</h2>" +
        "<ul>" +
        "<li>Supabase URL: " + (env.SUPABASE_URL ? "✅ Available" : "❌ Missing") + "</li>" +
        "<li>Supabase Key: " + (env.SUPABASE_KEY ? "✅ Available" : "❌ Missing") + "</li>" +
        "<li>Built with embedded variables: " + (env.BUILD_TIME ? "✅ Yes" : "❌ No") + "</li>" +
        "</ul>";
    });
  </script>
</body>
</html>`;

  fs.writeFileSync('out/form.html', formHtml);

  // Create _next directory structure
  console.log('📦 Creating static assets directory structure...');
  execSync('mkdir -p out/_next/static/css', { stdio: 'inherit' });
  execSync('mkdir -p out/_next/static/media', { stdio: 'inherit' });
  execSync('mkdir -p out/_next/static/chunks', { stdio: 'inherit' });

  // Create simple empty CSS file
  execSync('touch out/_next/static/css/main.css', { stdio: 'inherit' });

  // Create a public directory and copy some basic assets
  console.log('📦 Creating public directory...');
  execSync('mkdir -p out/public', { stdio: 'inherit' });

  // Create a simple JavaScript file to embed the environment variables
  console.log('📦 Creating environment configuration...');

  const envConfigJs = `window.ENV = {
  SUPABASE_URL: "${process.env.NEXT_PUBLIC_SUPABASE_URL || ''}",
  SUPABASE_KEY: "${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}",
  BUILD_TIME: true
};`;

  fs.writeFileSync('out/env-config.js', envConfigJs);

  // Copy the output directory from .next to out if needed
  console.log('📦 Ensuring static files are in the out directory...');
  if (fs.existsSync('.next/static')) {
    execSync('mkdir -p out/_next', { stdio: 'inherit' });
    execSync('cp -r .next/static out/_next/', { stdio: 'inherit' });
  }

  // Create public directory and copy assets
  if (fs.existsSync('public')) {
    console.log('📦 Copying public assets...');
    execSync('cp -r public/* out/ 2>/dev/null || true', { stdio: 'inherit' });
  }

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
