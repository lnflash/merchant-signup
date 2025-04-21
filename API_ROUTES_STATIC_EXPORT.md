# Handling API Routes in Next.js Static Exports

This document explains the approach we take to handle API routes in a Next.js application when using static exports.

## The Problem

Next.js 14+ no longer supports the `next export` command, requiring the use of `output: 'export'` in `next.config.js` instead. However, there's a significant issue: **API routes are not compatible with static exports**.

When you attempt to build a Next.js app with API routes using static export mode, you'll encounter errors like:

```
Build error occurred
Error: Failed to collect page data for /api/credentials
```

This happens because Next.js tries to pre-render all routes during the static export process, including API routes, which can't be pre-rendered into static HTML files.

## Our Solution

Our solution to this problem involves a multi-step approach:

1. **Temporarily Remove API Routes During Build**:
   - Before the build process, we temporarily move the `app/api` directory out of the way
   - After the build is complete, we restore the API directory to its original location

2. **Create Static Fallbacks for API Endpoints**:
   - We create static JSON files that mimic the responses of our API endpoints
   - These files are placed in the `out/api` directory with appropriate paths
   - For example, `out/api/credentials/index.json` contains the same data structure as our `/api/credentials` endpoint

3. **Adjust Client-Side Code to Work With or Without API Routes**:
   - The `useCredentials` hook is designed to try multiple sources for credentials
   - It first checks `window.ENV` (populated by `env-config.js`)
   - If that fails, it tries to fetch from the API endpoint
   - If the API fetch fails, it falls back to environment variables

## Implementation Details

### Build Process Change

In our build scripts and CI pipeline, we include these steps:

```bash
# Before build: Move API routes aside
if [ -d "app/api" ]; then
  mkdir -p app-api-backup
  cp -r app/api app-api-backup/
  rm -rf app/api
fi

# Run the build with static export mode
npm run build

# After build: Restore API routes
if [ -d "app-api-backup/api" ]; then
  rm -rf app/api 2>/dev/null || true
  mkdir -p app
  mv app-api-backup/api app/
  rm -rf app-api-backup
fi
```

### Static API Fallbacks

We create static JSON files in the output directory to simulate API responses:

```bash
# Create API fallbacks
mkdir -p out/api/credentials

# Create credentials fallback JSON
cat > out/api/credentials/index.json << EOF
{
  "supabaseUrl": "${NEXT_PUBLIC_SUPABASE_URL}",
  "supabaseKey": "${NEXT_PUBLIC_SUPABASE_ANON_KEY}",
  "bucket": "id_uploads",
  "environment": "production",
  "buildTime": true,
  "platform": "StaticBuild",
  "traceId": "static_build_$(date +%s)",
  "serverTime": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF
```

### Client-Side Adjustments

The `useCredentials` hook implements multiple fallback mechanisms:

```typescript
// Check if window.ENV is populated (browser runtime)
if (
  typeof window !== 'undefined' &&
  window.ENV &&
  window.ENV.SUPABASE_URL &&
  window.ENV.SUPABASE_KEY
) {
  console.info(`[🔑] Using credentials from window.ENV (static deployment)`);
  setCredentials({
    supabaseUrl: window.ENV.SUPABASE_URL,
    supabaseKey: window.ENV.SUPABASE_KEY,
    bucket: 'id_uploads',
    environment: 'production',
    buildTime: true,
    platform: 'StaticDeployment',
    traceId: `static_${Date.now().toString(36)}`,
    serverTime: new Date().toISOString(),
  });
  return;
}

// Try to fetch from API with fallbacks
try {
  const response = await fetch('/api/credentials');
  if (!response.ok) throw new Error(`Failed to fetch credentials`);
  const data = await response.json();
  setCredentials(data);
} catch (error) {
  // Fallback to window.ENV if API fetch fails
  if (window.ENV && window.ENV.SUPABASE_URL && window.ENV.SUPABASE_KEY) {
    setCredentials({
      supabaseUrl: window.ENV.SUPABASE_URL,
      supabaseKey: window.ENV.SUPABASE_KEY,
      // ...other properties
    });
  }
}
```

## Testing This Approach

To test this approach locally:

1. Run the test build script:
   ```bash
   npm run build:static:test
   ```

2. Serve the static output:
   ```bash
   npx serve out
   ```

3. Open your browser and check that:
   - The form loads correctly
   - Supabase credentials are available in the browser
   - Form submissions and file uploads work

## Future Considerations

While this approach works well for our specific use case, there are some considerations for future development:

1. **Server Components**: This approach works for client-side code, but doesn't support React Server Components
2. **API Complexity**: For more complex APIs, consider moving to external API services
3. **Authentication**: For authenticated APIs, consider using Supabase functions or edge functions
4. **Next.js Evolution**: Keep an eye on Next.js updates that might improve static export handling