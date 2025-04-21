# Flash Merchant Signup Static Export Updates

This document summarizes the changes made to address the issues with the deprecated `next export` command and improve the static export process for the Flash Merchant Signup application.

## Critical Issue Fixed

We identified and fixed a critical issue with API routes in Next.js static exports. When using `output: 'export'`, Next.js attempts to pre-render API routes, which fails with errors like:

```
Build error occurred
Error: Failed to collect page data for /api/credentials
```

Our solution is to temporarily remove the API routes during the build process, then restore them afterward.

## Changes Made

1. **Updated Next.js Configuration**:

   - Modified `next.config.js` to use the new `output: 'export'` configuration instead of the deprecated `next export` command
   - Made the configuration conditional based on the `IS_BUILD_TIME` environment variable

2. **API Routes Handling for Static Export**:

   - Added code to temporarily move the `app/api` directory before the build
   - Restored the API routes after the build is complete
   - Created a detailed document explaining the approach in `API_ROUTES_STATIC_EXPORT.md`

3. **Updated GitHub Actions Workflow**:

   - Removed the explicit `next export` command from the workflow
   - Added environment variable `IS_BUILD_TIME=true` to trigger the export configuration
   - Added code to handle API routes during the build process
   - Enhanced API fallback creation to ensure credentials are available in static builds
   - Improved verification steps to check for critical files
   - Added more robust error handling for file copying operations

4. **Package.json Scripts**:

   - Updated the build scripts to use the new approach
   - Added a test script to verify the static build locally
   - Added a script to temporarily move API routes during the build
   - Deprecated the old build:static script that used next export

5. **Enhanced Environment Variable Handling**:

   - Added `env-config.js` to safely embed Supabase credentials in static builds
   - Added fallbacks in the useCredentials hook for static deployments
   - Created static JSON fallbacks for API routes

6. **Documentation and Debugging**:
   - Created STATIC_BUILD.md to document the static build process
   - Added CI environment debugging script for troubleshooting
   - Enhanced console logging for better visibility into the build process

## Testing

To test the new static export approach:

```bash
# Test locally with mock credentials
npm run build:static:test

# Start a local server to test the build
npx serve out
```

## Next Steps

1. **Deploy to GitHub**: Push these changes to the repository to trigger the GitHub Actions workflow
2. **Verify Deployment**: Check that the static site is correctly deployed to DigitalOcean
3. **Test Form Submission**: Verify that the form submission and file uploads work with the embedded Supabase credentials

## Troubleshooting

If there are any issues with the deployment:

1. Check for errors related to API routes:
   - Verify that API routes are properly removed during the build 
   - Check the GitHub Actions logs for any errors during the API route handling steps
   - Reference `API_ROUTES_STATIC_EXPORT.md` for detailed troubleshooting

2. Verify environment variables and credentials:
   - Run `npm run env-debug` to check environment variable availability
   - Check for the presence of `env-config.js` in the output
   - Verify that API fallbacks are created in `out/api/credentials`

3. Inspect the build output:
   - Check GitHub Actions logs for detailed build information
   - Verify that the Next.js build completes without errors
   - Ensure the static site is correctly deployed to DigitalOcean

4. Test the deployed application:
   - Check that Supabase credentials are correctly embedded in the static build
   - Verify that the React app UI is rendering correctly
   - Test form submission and file uploads to ensure they work
