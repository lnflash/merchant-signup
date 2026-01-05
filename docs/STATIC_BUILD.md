# Static Build Guide for Flash Merchant Signup

This document provides instructions for building and deploying the Flash Merchant Signup app as a static site on DigitalOcean App Platform.

## Overview

The Flash Merchant Signup app is a Next.js application that can be deployed as a static site. This approach has some limitations but allows for simple hosting on platforms like DigitalOcean App Platform.

## Key Challenges in Static Builds

1. **API Routes**: Next.js static exports do not support API routes. We handle this by:
   - Temporarily removing API routes during the build process
   - Creating static JSON fallbacks for API endpoints
   - Adding client-side fallbacks to directly connect to Supabase

2. **Routing**: DigitalOcean App Platform requires a `routes.json` file to correctly handle routing. We create this file during the build process.

3. **Environment Variables**: Static builds cannot access server environment variables at runtime. We handle this by:
   - Embedding environment variables in the client-side JavaScript at build time
   - Using a `window.ENV` object to make them available to client code

## Building Locally

To build and test the static export locally:

```bash
# Build the static site
npm run build:static:legacy

# Test the static site with a local server
npm run test:static-server
```

This will build the app and start a local server at http://localhost:3456 that simulates the routing behavior of DigitalOcean App Platform.

## Deployment Process

The app is automatically deployed to DigitalOcean App Platform via GitHub Actions when commits are pushed to the main branch.

The deployment process:

1. Builds the app with `IS_BUILD_TIME=true`
2. Temporarily removes API routes
3. Creates static fallbacks for API endpoints
4. Generates the `routes.json` file for routing
5. Creates a GitHub Pages branch with the static build
6. Deploys to DigitalOcean App Platform

## Routing Configuration

The `routes.json` file is crucial for proper routing in DigitalOcean App Platform. It contains the following routes:

```json
{
  "routes": [
    {
      "handle": "filesystem"
    },
    {
      "src": "/form",
      "dest": "/form/index.html",
      "status": 200
    },
    {
      "src": "/form/",
      "dest": "/form/index.html",
      "status": 200
    },
    {
      "src": "/form/(.*)",
      "dest": "/form/index.html",
      "status": 200
    },
    {
      "src": "/api/credentials",
      "dest": "/api/credentials/index.json",
      "status": 200
    },
    {
      "src": "/api/(.*)",
      "dest": "/api/$1/index.json",
      "status": 200
    },
    {
      "src": "/(.*)",
      "dest": "/index.html",
      "status": 200
    }
  ]
}
```

This configuration ensures that:

- The form page is accessible at `/form`
- API endpoints have static fallbacks
- All other routes fallback to the index page

## Troubleshooting

### 404 Errors on Form Page

If you get a 404 error when accessing the form page:

1. Verify that `routes.json` exists in your deployment
2. Ensure that the `form/index.html` file exists in your build
3. Check if the deployment platform is correctly using the `routes.json` file

To fix 404 errors:

- Rebuild and redeploy the app
- Manually check the `out/form/index.html` file exists in the build
- Run the `test:static-server` script locally to verify routes work

### Environment Variables

If environment variables are not available in the static build:

1. Check if `env-config.js` is being loaded in the HTML
2. Verify that meta tags with Supabase credentials are present
3. Use the debug tools to inspect the environment:

```javascript
// In browser console
console.log('ENV check:', {
  hasWindowENV: !!window.ENV,
  envKeys: window.ENV ? Object.keys(window.ENV) : [],
  supabaseUrl: window.ENV?.SUPABASE_URL ? 'Available' : 'Missing',
  supabaseKey: window.ENV?.SUPABASE_KEY ? 'Available' : 'Missing',
});
```

## Testing the Deployment

After deploying, verify the following URLs work:

- Home: https://flash-merchant-signup-ov4yh.ondigitalocean.app/
- Form: https://flash-merchant-signup-ov4yh.ondigitalocean.app/form
- API: https://flash-merchant-signup-ov4yh.ondigitalocean.app/api/credentials

The debug navigation page is available at:

- Debug: https://flash-merchant-signup-ov4yh.ondigitalocean.app/debug-nav.html
