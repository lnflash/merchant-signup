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

  // Create index.html with a redirect to /form
  console.log('📦 Creating index.html redirect...');
  const indexHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Flash Merchant Signup</title>
  <meta http-equiv="refresh" content="0;url=/form">
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 800px;
      margin: 40px auto;
      padding: 20px;
      text-align: center;
      color: #333;
    }
    .logo {
      max-width: 120px;
      margin-bottom: 20px;
    }
    h1 { color: #1D4ED8; margin-bottom: 10px; }
  </style>
  <meta name="supabase-url" content="${process.env.NEXT_PUBLIC_SUPABASE_URL || ''}">
  <meta name="supabase-anon-key" content="${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}">
  <script src="/env-config.js"></script>
</head>
<body>
  <img src="/images/logos/flash.png" alt="Flash Logo" class="logo" />
  <h1>Flash Merchant Signup</h1>
  <p>Redirecting to the signup form...</p>
  <p>If you are not redirected automatically, <a href="/form">click here</a>.</p>
  <script>
    window.location.href = '/form';
  </script>
</body>
</html>`;

  fs.writeFileSync('out/index.html', indexHtml);

  // Create a custom 404 page
  console.log('📦 Creating 404 error page...');
  const notFoundHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Page Not Found - Flash Merchant Signup</title>
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 800px;
      margin: 40px auto;
      padding: 20px;
      text-align: center;
      color: #333;
    }
    h1 { color: #1D4ED8; margin-bottom: 10px; }
    .error-code { font-size: 120px; font-weight: bold; color: #E5E7EB; margin: 0; line-height: 1; }
    .btn {
      display: inline-block;
      background-color: #1D4ED8;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 500;
      margin-top: 20px;
      transition: background-color 0.2s;
    }
    .btn:hover { background-color: #1E40AF; }
  </style>
  <meta name="supabase-url" content="${process.env.NEXT_PUBLIC_SUPABASE_URL || ''}">
  <meta name="supabase-anon-key" content="${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}">
  <script src="/env-config.js"></script>
</head>
<body>
  <p class="error-code">404</p>
  <h1>Page Not Found</h1>
  <p>The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.</p>
  <a href="/" class="btn">Go to Homepage</a>
  <a href="/form" class="btn">Go to Sign Up Form</a>
</body>
</html>`;

  fs.writeFileSync('out/404.html', notFoundHtml);

  // Create a basic form.html page (fallback if Next.js doesn't generate proper structure)
  console.log('📦 Creating form.html fallback...');
  const formHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Flash Merchant Signup Form</title>
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 800px;
      margin: 40px auto;
      padding: 20px;
      text-align: center;
      color: #333;
    }
    .logo {
      max-width: 120px;
      margin-bottom: 20px;
    }
    h1 { color: #1D4ED8; margin-bottom: 10px; }
  </style>
  <meta name="supabase-url" content="${process.env.NEXT_PUBLIC_SUPABASE_URL || ''}">
  <meta name="supabase-anon-key" content="${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}">
  <script src="/env-config.js"></script>
</head>
<body>
  <img src="/images/logos/flash.png" alt="Flash Logo" class="logo" />
  <h1>Flash Merchant Signup</h1>
  <p>Loading signup form...</p>
  <div id="env-status"></div>
  <script>
    // Display environment variables status (without showing actual values)
    document.addEventListener("DOMContentLoaded", function() {
      const status = document.getElementById("env-status");
      const env = window.ENV || {};
      status.innerHTML = 
        "<h2>Environment Configuration</h2>" +
        "<ul>" +
        "<li>Supabase URL: " + (env.SUPABASE_URL ? "✅ Available" : "❌ Missing") + "</li>" +
        "<li>Supabase Key: " + (env.SUPABASE_KEY ? "✅ Available" : "❌ Missing") + "</li>" +
        "<li>Built with embedded variables: " + (env.BUILD_TIME ? "✅ Yes" : "❌ No") + "</li>" +
        "</ul>";
    });
  </script>
</body>
</html>`;

  // Create the form.html file as a fallback
  fs.writeFileSync('out/form.html', formHtml);

  // Create form directory if it doesn't exist yet
  execSync('mkdir -p out/form', { stdio: 'inherit' });

  // Copy app/form content if it exists
  if (fs.existsSync('.next/server/app/form')) {
    console.log('📦 Copying Next.js generated form page...');
    execSync('cp -r .next/server/app/form/* out/form/ 2>/dev/null || true', { stdio: 'inherit' });
  }

  // Check if the form index.html exists or create an enhanced fallback
  console.log('📦 Creating enhanced form/index.html fallback...');
  
  // Check if we have a debug fallback template
  let enhancedFormHtml = formHtml; // Default to simple version
  
  if (fs.existsSync('debug/form-fallback.html')) {
    console.log('📦 Using enhanced form fallback from debug/form-fallback.html');
    try {
      enhancedFormHtml = fs.readFileSync('debug/form-fallback.html', 'utf8');
      
      // Replace placeholders with actual Supabase credentials
      enhancedFormHtml = enhancedFormHtml
        .replace(/SUPABASE_URL_PLACEHOLDER/g, process.env.NEXT_PUBLIC_SUPABASE_URL || '')
        .replace(/SUPABASE_KEY_PLACEHOLDER/g, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');
        
      console.log('📦 Successfully processed enhanced form fallback');
    } catch (error) {
      console.error('Error reading enhanced fallback:', error);
      console.log('📦 Falling back to simple form template');
    }
  }
  
  fs.writeFileSync('out/form/index.html', enhancedFormHtml);

  // Create fake API endpoint to prevent redirects to non-existent API endpoints
  console.log('📦 Creating API fallbacks to prevent redirects...');
  execSync('mkdir -p out/api/credentials', { stdio: 'inherit' });
  const credentialsApi = `{
    "supabaseUrl": "${process.env.NEXT_PUBLIC_SUPABASE_URL || ''}",
    "supabaseKey": "${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}",
    "bucket": "id_uploads",
    "environment": "${process.env.NODE_ENV || 'production'}",
    "buildTime": true,
    "platform": "StaticBuild",
    "traceId": "static_${Date.now().toString(36)}",
    "serverTime": "${new Date().toISOString()}"
  }`;
  fs.writeFileSync('out/api/credentials/index.json', credentialsApi);

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
  
  // Create debug-nav.html for navigation testing
  console.log('📦 Creating debug navigation test page...');
  if (fs.existsSync('debug/index.html')) {
    fs.copyFileSync('debug/index.html', 'out/debug-nav.html');
  } else {
    // Create a simple debug navigation page
    const debugNavHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Flash Merchant Signup - Navigation Debug</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="supabase-url" content="${process.env.NEXT_PUBLIC_SUPABASE_URL || ''}">
  <meta name="supabase-anon-key" content="${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}">
  <script src="/env-config.js"></script>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    .card { border: 1px solid #e5e7eb; padding: 15px; margin: 15px 0; border-radius: 8px; }
    .links { display: flex; flex-direction: column; gap: 10px; }
    .links a { display: inline-block; padding: 8px 16px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 4px; }
    pre { background-color: #f3f4f6; padding: 12px; border-radius: 4px; overflow-x: auto; }
  </style>
</head>
<body>
  <h1>Navigation Debug Page</h1>
  
  <div class="card">
    <h2>Test Links</h2>
    <div class="links">
      <a href="/">Home</a>
      <a href="/form">Form Page</a>
      <a href="/form/index.html">Form (explicit index.html)</a>
      <a href="/api/credentials">API Credentials</a>
    </div>
  </div>
  
  <div class="card">
    <h2>Environment</h2>
    <div id="env-info"></div>
  </div>
  
  <div class="card">
    <h2>Current Location</h2>
    <pre id="location-info"></pre>
  </div>
  
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      // Environment info
      const env = window.ENV || {};
      document.getElementById('env-info').innerHTML = 
        '<p>window.ENV: ' + (window.ENV ? 'Available' : 'Not Available') + '</p>' +
        '<p>Supabase URL: ' + (env.SUPABASE_URL ? 'Set' : 'Not Set') + '</p>' +
        '<p>Supabase Key: ' + (env.SUPABASE_KEY ? 'Set' : 'Not Set') + '</p>' + 
        '<p>Build Time: ' + (env.BUILD_TIME ? 'Yes' : 'No') + '</p>';
      
      // Location info
      document.getElementById('location-info').textContent = JSON.stringify({
        href: window.location.href,
        pathname: window.location.pathname,
        host: window.location.host
      }, null, 2);
    });
  </script>
</body>
</html>`;
    
    fs.writeFileSync('out/debug-nav.html', debugNavHtml);
  }

  // Create a simple JavaScript file to embed the environment variables
  console.log('📦 Creating environment configuration...');

  const envConfig = `// Static build environment configuration
window.ENV = {
  SUPABASE_URL: "${process.env.NEXT_PUBLIC_SUPABASE_URL || ''}",
  SUPABASE_KEY: "${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}",
  BUILD_TIME: true,
  BUILD_DATE: "${new Date().toISOString()}"
};

// Log that the environment variables have been loaded from the static build
console.log('Static build environment variables loaded:', {
  hasUrl: !!window.ENV.SUPABASE_URL,
  hasKey: !!window.ENV.SUPABASE_KEY,
  buildTime: window.ENV.BUILD_TIME,
  buildDate: window.ENV.BUILD_DATE
});`;

  fs.writeFileSync('out/env-config.js', envConfig);
  
  // Create routes.json for DigitalOcean App Platform
  console.log('📦 Creating routes.json for DigitalOcean App Platform...');
  
  try {
    // Try to use the create-routes-config script
    const createRoutesConfig = require('./create-routes-config');
    createRoutesConfig();
  } catch (error) {
    console.error('❌ Error creating routes.json:', error.message);
    
    // Fallback: Create routes.json manually
    console.log('📦 Creating routes.json manually...');
    
    const routesConfig = {
      routes: [
        { handle: "filesystem" },
        { src: "/form", dest: "/form/index.html", status: 200 },
        { src: "/form/", dest: "/form/index.html", status: 200 },
        { src: "/api/credentials", dest: "/api/credentials/index.json", status: 200 },
        { src: "/api/(.*)", dest: "/api/$1/index.json", status: 200 },
        { src: "/(.*)", dest: "/index.html", status: 200 }
      ]
    };
    
    fs.writeFileSync('out/routes.json', JSON.stringify(routesConfig, null, 2));
  }

  // Copy the output directory from .next to out if needed
  console.log('📦 Ensuring static files are in the out directory...');
  if (fs.existsSync('.next/static')) {
    execSync('mkdir -p out/_next', { stdio: 'inherit' });
    execSync('cp -r .next/static out/_next/', { stdio: 'inherit' });
  }

  // Create public directory and copy assets (excluding node_modules)
  if (fs.existsSync('public')) {
    console.log('📦 Copying public assets (excluding node_modules)...');
    // Create directories first
    execSync(
      'find public -type d -not -path "*/node_modules*" -not -path "*/\\.*" | sed "s|^public/|out/|" | xargs mkdir -p',
      { stdio: 'inherit' }
    );
    // Copy files
    execSync(
      'find public -type f -not -path "*/node_modules*" -not -path "*/\\.*" | while read file; do cp "$file" "out/${file#public/}"; done',
      { stdio: 'inherit' }
    );
  }

  // Ensure images directory exists
  execSync('mkdir -p out/images/logos', { stdio: 'inherit' });

  // Copy logo files if they don't exist
  if (fs.existsSync('app/assets')) {
    console.log('📦 Copying logo assets...');
    execSync('cp -r app/assets/* out/images/logos/ 2>/dev/null || true', { stdio: 'inherit' });
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
