# Static Build Process for Flash Merchant Signup

This document explains how the Flash Merchant Signup application is built as a static site and deployed to DigitalOcean App Platform.

## Overview

The application is built using Next.js with static export functionality, which converts the React application into static HTML, CSS, and JavaScript files that can be deployed to any static hosting service.

Since the application needs to interact with Supabase directly from the client in static mode (without API routes), we've implemented several mechanisms to ensure Supabase credentials are available to the client.

## Build Process

1. **Static Export Configuration**:

   - We use Next.js's `output: 'export'` configuration in `next.config.js`, which is conditionally applied when the `IS_BUILD_TIME` environment variable is set to `'true'`
   - This configuration replaces the deprecated `next export` command

2. **API Route Handling**:

   - API routes are not available in static exports
   - We create static JSON fallbacks for API endpoints in the `out/api` directory
   - Client-side code uses these fallbacks when the real API endpoints are not available

3. **Environment Variable Embedding**:

   - Supabase credentials (URL and anon key) are embedded into the static build through:
     - Meta tags in HTML (via `_document.js`)
     - Window variables (via inline scripts)
     - Static JSON files in the `api/credentials` directory
     - `env-config.js` file that populates `window.ENV`

4. **Client-Side Credential Detection**:
   - The `useCredentials` hook tries multiple sources to get Supabase credentials:
     1. `window.ENV` variables (populated by `env-config.js`)
     2. Environment variables during build time
     3. API fetch from `/api/credentials` endpoint (with fallback to static JSON)

## Deployment Process

The deployment process is automated using GitHub Actions:

1. Code is pushed to the main branch
2. GitHub Actions workflow (`deploy.yml`) is triggered
3. The workflow:
   - Checks out the repository
   - Sets up Node.js environment
   - Installs dependencies
   - Sets `IS_BUILD_TIME=true` environment variable
   - Builds the application with static export mode
   - Creates API fallbacks and enhanced `env-config.js`
   - Verifies the static output
   - Deploys to GitHub Pages (as an intermediary)
   - DigitalOcean App Platform pulls from the GitHub Pages branch

## Testing Locally

To test the static build locally:

```bash
# Build the static site with test credentials
npm run build:static:test

# Serve the static site
npx serve out
```

## File Structure

Key files involved in the static build process:

- `next.config.js` - Configures Next.js for static export
- `scripts/test-static-build.js` - Script to test the static build locally
- `.github/workflows/deploy.yml` - GitHub Actions workflow for deployment
- `src/hooks/useCredentials.ts` - Hook to retrieve Supabase credentials
- `pages/_document.js` - HTML document with meta tags for credentials
- `public/env-config.js` - Client-side script to populate `window.ENV`

## Troubleshooting

Common issues and solutions:

1. **Missing Credentials**:

   - Check if `env-config.js` is properly generated
   - Verify that meta tags are present in the HTML
   - Ensure API fallbacks are created in `out/api/credentials`

2. **Next.js Configuration Issues**:

   - Make sure `IS_BUILD_TIME=true` is set when building
   - Verify that `output: 'export'` is conditionally applied in `next.config.js`

3. **Deployment Failures**:
   - Check GitHub Actions logs for errors
   - Verify that the static output structure is correct
   - Make sure no large files (>50MB) are included in the build
