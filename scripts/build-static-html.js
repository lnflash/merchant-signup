/**
 * Static HTML Build Script
 *
 * This script creates a pure HTML version of the site for static hosting.
 */

// Load environment variables from .env file if available
try {
  require('dotenv').config();
} catch (e) {
  console.log('dotenv not available, using existing environment variables');
}

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('\n🏗️ Starting static HTML build process...');

// Set build-time flag
process.env.IS_BUILD_TIME = 'true';

// Create output directory
const outDir = path.join(process.cwd(), 'out');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Create index.html with a redirect to /form
console.log('📦 Creating index.html...');
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

fs.writeFileSync(path.join(outDir, 'index.html'), indexHtml);

// Create a custom 404 page
console.log('📦 Creating 404.html...');
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

fs.writeFileSync(path.join(outDir, '404.html'), notFoundHtml);

// Create a environment config file
console.log('📦 Creating env-config.js...');
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

fs.writeFileSync(path.join(outDir, 'env-config.js'), envConfig);

// Create form directory if it doesn't exist
const formDir = path.join(outDir, 'form');
if (!fs.existsSync(formDir)) {
  fs.mkdirSync(formDir, { recursive: true });
}

// Create a form page
console.log('📦 Creating form/index.html...');
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
    .form-container {
      background-color: #f9fafb;
      border-radius: 8px;
      padding: 24px;
      margin-top: 24px;
      text-align: left;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .form-field {
      margin-bottom: 16px;
    }
    label {
      display: block;
      margin-bottom: 4px;
      font-weight: 500;
    }
    input, select {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 4px;
    }
    button {
      background-color: #1D4ED8;
      color: white;
      border: none;
      padding: 10px 16px;
      border-radius: 4px;
      font-weight: 500;
      cursor: pointer;
    }
    button:hover {
      background-color: #1E40AF;
    }
  </style>
  <meta name="supabase-url" content="${process.env.NEXT_PUBLIC_SUPABASE_URL || ''}">
  <meta name="supabase-anon-key" content="${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}">
  <script src="/env-config.js"></script>
</head>
<body>
  <img src="/images/logos/flash.png" alt="Flash Logo" class="logo" />
  <h1>Flash Merchant Signup</h1>
  
  <div id="env-status"></div>
  
  <div class="form-container">
    <h2>Merchant Information</h2>
    <div class="form-field">
      <label for="businessName">Business Name</label>
      <input type="text" id="businessName" placeholder="Your business name">
    </div>
    <div class="form-field">
      <label for="businessType">Business Type</label>
      <select id="businessType">
        <option value="">Select business type</option>
        <option value="retail">Retail</option>
        <option value="restaurant">Restaurant</option>
        <option value="service">Service</option>
        <option value="other">Other</option>
      </select>
    </div>
    <div class="form-field">
      <label for="email">Email Address</label>
      <input type="email" id="email" placeholder="your@email.com">
    </div>
    <div class="form-field">
      <label for="phone">Phone Number</label>
      <input type="tel" id="phone" placeholder="Your phone number">
    </div>
    
    <button type="button">Get Started with Flash</button>
  </div>
  
  <script>
    // Display environment variables status
    document.addEventListener("DOMContentLoaded", function() {
      const status = document.getElementById("env-status");
      const env = window.ENV || {};
      status.innerHTML = 
        "<h2>Environment Configuration</h2>" +
        "<ul style='list-style-type: none; padding: 0;'>" +
        "<li>Supabase URL: " + (env.SUPABASE_URL ? "✅ Available" : "❌ Missing") + "</li>" +
        "<li>Supabase Key: " + (env.SUPABASE_KEY ? "✅ Available" : "❌ Missing") + "</li>" +
        "<li>Built with embedded variables: " + (env.BUILD_TIME ? "✅ Yes" : "❌ No") + "</li>" +
        "</ul>";
      
      // Handle form submission (this is just a dummy implementation)
      const button = document.querySelector('button');
      button.addEventListener('click', function() {
        const businessName = document.getElementById('businessName').value;
        const businessType = document.getElementById('businessType').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;
        
        if (!businessName || !businessType || !email || !phone) {
          alert('Please fill out all fields');
          return;
        }
        
        status.innerHTML = "<h2>Form Submitted!</h2><p>Thank you for your interest in Flash. We'll be in touch soon.</p>";
      });
    });
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(formDir, 'index.html'), formHtml);

// Create images directory structure
console.log('📦 Creating images directory...');
fs.mkdirSync(path.join(outDir, 'images', 'logos'), { recursive: true });

// Copy public directory to the output directory
console.log('📦 Copying public assets...');
if (fs.existsSync('public')) {
  try {
    execSync(`cp -r public/* ${outDir}/`, { stdio: 'inherit' });
  } catch (e) {
    console.warn('Warning: Error copying public assets, but continuing...');
  }
}

// Copy asset files
console.log('📦 Copying logo assets...');
try {
  const assetSources = [
    { src: 'app/assets', dest: 'images/logos' },
    { src: 'public/images/logos', dest: 'images/logos' },
  ];

  assetSources.forEach(({ src, dest }) => {
    if (fs.existsSync(src)) {
      try {
        execSync(`cp -r ${src}/* ${path.join(outDir, dest)}/`, { stdio: 'inherit' });
      } catch (e) {
        console.warn(`Warning: Error copying from ${src}, but continuing...`);
      }
    }
  });
} catch (e) {
  console.warn('Warning: Error copying logo assets, but continuing...');
}

// Make sure .nojekyll file exists to prevent GitHub Pages processing
fs.writeFileSync(path.join(outDir, '.nojekyll'), '');

console.log('\n✅ Static HTML build completed successfully!');
console.log('📂 Output directory: ./out');
