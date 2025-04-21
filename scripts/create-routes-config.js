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
      handle: "filesystem"
    },
    {
      src: "/form",
      dest: "/form/index.html",
      status: 200
    },
    {
      src: "/form/",
      dest: "/form/index.html",
      status: 200
    },
    {
      src: "/api/credentials",
      dest: "/api/credentials/index.json",
      status: 200
    },
    {
      src: "/api/(.*)",
      dest: "/api/$1/index.json",
      status: 200
    },
    {
      src: "/(.*)",
      dest: "/index.html",
      status: 200
    }
  ]
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
  fs.writeFileSync(
    routesFilePath,
    JSON.stringify(routesConfig, null, 2)
  );
  
  console.log(`✅ Created routes.json file at ${routesFilePath}`);
}

// Execute if this script is run directly
if (require.main === module) {
  createRoutesConfig();
}

module.exports = createRoutesConfig;