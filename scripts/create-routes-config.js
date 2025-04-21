/**
 * This script creates a routes.json file for DigitalOcean App Platform
 * to correctly handle routing in the static site deployment.
 */

const fs = require('fs');
const path = require('path');

// Define routes configuration for DigitalOcean App Platform
const routesConfig = {
  routes: [
    {
      // First try file system
      handle: 'filesystem',
    },
    {
      // Form page route
      src: '/form',
      dest: '/form/index.html',
      status: 200,
    },
    {
      // Form page with trailing slash
      src: '/form/',
      dest: '/form/index.html',
      status: 200,
    },
    {
      // Form page with any subpath
      src: '/form/(.*)',
      dest: '/form/index.html',
      status: 200,
    },
    {
      // API credentials endpoint
      src: '/api/credentials',
      dest: '/api/credentials/index.json',
      status: 200,
    },
    {
      // Any API endpoint
      src: '/api/(.*)',
      dest: '/api/$1/index.json',
      status: 200,
    },
    {
      // Catch-all route to index for SPA-like behavior
      src: '/(.*)',
      dest: '/index.html',
      status: 200,
    },
  ],
};

// Function to create the routes.json file
function createRoutesConfig() {
  const outDir = path.join(process.cwd(), 'out');

  // Create out directory if it doesn't exist
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // Write routes.json to the output directory
  const routesFilePath = path.join(outDir, 'routes.json');
  fs.writeFileSync(routesFilePath, JSON.stringify(routesConfig, null, 2));

  console.log(`✅ Created routes.json file at ${routesFilePath}`);

  // Also create a copy in the deploy-debug directory for reference
  const debugDir = path.join(process.cwd(), 'deploy-debug');
  if (!fs.existsSync(debugDir)) {
    fs.mkdirSync(debugDir, { recursive: true });
  }

  const debugFilePath = path.join(debugDir, 'routes.json');
  fs.writeFileSync(debugFilePath, JSON.stringify(routesConfig, null, 2));

  console.log(`✅ Created reference copy at ${debugFilePath}`);

  // Validate that the form directory exists
  const formDir = path.join(outDir, 'form');
  const formIndexPath = path.join(formDir, 'index.html');

  if (!fs.existsSync(formDir)) {
    console.warn(`⚠️ Warning: 'form' directory not found at ${formDir}`);
    // Create it if it doesn't exist
    fs.mkdirSync(formDir, { recursive: true });
    console.log(`✅ Created missing 'form' directory`);
  }

  // Check for form/index.html
  if (!fs.existsSync(formIndexPath)) {
    console.warn(`⚠️ Warning: 'form/index.html' not found at ${formIndexPath}`);

    // If form.html exists at the root, copy it to form/index.html
    const rootFormPath = path.join(outDir, 'form.html');
    if (fs.existsSync(rootFormPath)) {
      console.log(`Found 'form.html' at root, copying to 'form/index.html'...`);
      fs.copyFileSync(rootFormPath, formIndexPath);
      console.log(`✅ Copied 'form.html' to 'form/index.html'`);
    } else {
      console.warn(`❌ No form HTML found to copy!`);
    }
  }

  return {
    routesFilePath,
    routesConfig,
  };
}

// Execute if this script is run directly
if (require.main === module) {
  createRoutesConfig();
}

module.exports = createRoutesConfig;
