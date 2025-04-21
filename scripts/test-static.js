/**
 * Test Static Build Script
 *
 * This script tests the static build output locally
 * by setting up a simple static file server and checking
 * that routes work correctly.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Set up environment for build
process.env.IS_BUILD_TIME = 'true';
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  try {
    require('dotenv').config();
  } catch (e) {
    console.log('dotenv not available, using existing environment variables');
  }
}

// Clean output directory
console.log('Cleaning previous build output...');
try {
  execSync('rm -rf out');
} catch (error) {
  console.warn('Warning: Could not clean output directory:', error.message);
}

// Run the build-static.js script
console.log('Building static version...');
try {
  execSync('node scripts/build-static.js', { stdio: 'inherit' });
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}

// Run the routes config script to ensure routes.json is created
console.log('Creating routes.json...');
try {
  require('./create-routes-config')();
} catch (error) {
  console.error('Failed to create routes.json:', error.message);
  process.exit(1);
}

// Validate the build output
console.log('\nValidating build output...');
const outDir = path.join(process.cwd(), 'out');

// Check for key files
const requiredFiles = [
  'index.html',
  'routes.json',
  'env-config.js',
  'form/index.html',
  'api/credentials/index.json',
];

const missingFiles = [];
requiredFiles.forEach(file => {
  const filePath = path.join(outDir, file);
  if (!fs.existsSync(filePath)) {
    missingFiles.push(file);
    console.error(`❌ Missing required file: ${file}`);
  } else {
    console.log(`✅ Found required file: ${file}`);
  }
});

if (missingFiles.length > 0) {
  console.error(`\n❌ Build validation failed: Missing ${missingFiles.length} required files.`);
} else {
  console.log('\n✅ Build validation passed: All required files present.');
}

// Simplistic route handling based on routes.json
const routesFile = path.join(outDir, 'routes.json');
let routes = {};

try {
  const routesConfig = JSON.parse(fs.readFileSync(routesFile, 'utf8'));
  routes = routesConfig.routes || [];
  console.log(`✅ Successfully loaded routes.json with ${routes.length} routes`);
} catch (error) {
  console.error('❌ Error loading routes.json:', error.message);
}

// Start a simple HTTP server to test the static build
const PORT = 3456;
console.log(`\nStarting test server on http://localhost:${PORT}`);

// Simplistic MIME type mapping
const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

// Create a simple server that implements the routes.json logic
const server = http.createServer((req, res) => {
  let url = req.url;

  // Skip query parameters
  if (url.includes('?')) {
    url = url.split('?')[0];
  }

  console.log(`Request: ${req.method} ${url}`);

  // Implement routing similar to DigitalOcean App Platform
  let filePath = path.join(outDir, url);

  // Handle routes based on routes.json
  let routeApplied = false;

  // First check filesystem handler
  const filesystemHandler = routes.find(route => route.handle === 'filesystem');
  if (filesystemHandler && fs.existsSync(filePath) && !fs.statSync(filePath).isDirectory()) {
    console.log(`Using filesystem handler for ${url}`);
    routeApplied = true;
  } else {
    // Check other routes
    for (const route of routes) {
      if (route.handle) continue; // Skip filesystem handler

      // Convert route src to regex
      const pattern = route.src
        .replace(/\/$/, '') // Remove trailing slash
        .replace(/\./g, '\\.') // Escape dots
        .replace(/\//g, '\\/') // Escape slashes
        .replace(/\(([^)]+)\)/g, '($1)'); // Keep parentheses for captures

      const regex = new RegExp(`^${pattern}$`);

      if (regex.test(url)) {
        console.log(`Route match: ${route.src} -> ${route.dest}`);

        // Apply route destination, including capture groups
        let dest = route.dest;
        const matches = url.match(regex);

        if (matches && matches.length > 1) {
          // Replace $1, $2, etc. with capture groups
          for (let i = 1; i < matches.length; i++) {
            dest = dest.replace(`$${i}`, matches[i]);
          }
        }

        filePath = path.join(outDir, dest);
        routeApplied = true;
        break;
      }
    }
  }

  if (!routeApplied) {
    console.log(`No route match for ${url}, using direct path`);
  }

  // Special case for directory index
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  // Log resolved path
  console.log(`Resolved to: ${filePath.replace(outDir, '')}`);

  // Check if file exists
  fs.access(filePath, fs.constants.F_OK, err => {
    if (err) {
      // File not found, try fallback to index.html
      console.log(`File not found, trying fallback...`);

      // Check for catch-all route
      const catchAllRoute = routes.find(route => route.src === '/(.*)');
      if (catchAllRoute) {
        filePath = path.join(outDir, catchAllRoute.dest);
        console.log(`Using catch-all route: ${catchAllRoute.dest}`);
      } else {
        // Default to index.html
        filePath = path.join(outDir, 'index.html');
      }

      fs.access(filePath, fs.constants.F_OK, err => {
        if (err) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Not Found');
          return;
        }
        serveFile(filePath, res);
      });
      return;
    }

    serveFile(filePath, res);
  });
});

function serveFile(filePath, res) {
  const extname = path.extname(filePath);
  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('500 Internal Server Error');
      return;
    }

    // Success
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

// Start the server
server.listen(PORT, () => {
  console.log(`
🚀 Server started successfully!

Test your build with these URLs:
- Home: http://localhost:${PORT}/
- Form page: http://localhost:${PORT}/form
- Form page with slash: http://localhost:${PORT}/form/
- API credentials: http://localhost:${PORT}/api/credentials

Press Ctrl+C to stop the server.
`);
});

// Handle server shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  server.close(() => {
    console.log('Server stopped.');
    process.exit(0);
  });
});
