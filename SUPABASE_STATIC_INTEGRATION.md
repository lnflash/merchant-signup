# Supabase Integration with Static Builds

This document explains how the Flash Merchant Signup application integrates with Supabase in a static site deployment environment.

## Overview

When deploying a Next.js application with API routes as a static site (using `output: 'export'`), server-side API routes are not available. However, our application still needs to interact with Supabase for:

1. Form submissions
2. File uploads
3. Data retrieval

Our solution involves direct client-side Supabase connections as a fallback when API routes are unavailable.

## Implementation Details

### Credential Management

The application has a multi-layer approach to managing Supabase credentials:

1. **Window Environment Variables**: In static builds, credentials are embedded in `window.ENV` via the `env-config.js` file
2. **Environment Variables**: The application can fall back to `process.env.NEXT_PUBLIC_*` variables
3. **Config Fallback**: As a last resort, hardcoded values in `config.ts` (safe for public endpoints)

The hierarchy is managed in the `getBestCredentials()` function in `lib/supabase-singleton.ts`.

### Direct Client Connection

For static builds, we create a direct Supabase client in the browser:

```typescript
// Create a default client instance for direct imports
// This is especially useful in static builds where we can't rely on API routes
export const supabase = getSupabase();
```

Components and services can import this singleton client for direct Supabase operations:

```typescript
import { supabase } from '../lib/supabase-singleton';

// Use supabase directly
const { data, error } = await supabase
  .from('merchant_signups')
  .insert([formData]);
```

### API Service with Fallback

The API service (`src/services/api.ts`) has been enhanced with a fallback mechanism:

1. It first tries to use the standard API endpoint for form submission
2. If that fails (which it will in static builds), it falls back to direct Supabase connection
3. The logic automatically detects if we're in a static build via `window.ENV.BUILD_TIME`

```typescript
// For static builds, try direct Supabase connection first
if (isStaticBuild) {
  return await this.submitFormWithSupabaseDirect(data);
}

// For regular builds, use the API endpoint
return await this.submitFormWithApi(data, baseUrl);
```

### File Upload Component

The `FileUpload` component demonstrates this hybrid approach:

1. It tries to get credentials from the `useCredentials` hook
2. If running in a static build, it detects embedded credentials in `window.ENV`
3. It then uploads files directly to Supabase Storage using those credentials

### Error Handling and Fallbacks

The system includes robust error handling:

1. Mock Supabase client for local development and testing
2. Multiple fallback layers for credential acquisition
3. Detailed logging for debugging credential and connection issues
4. Graceful degradation when services aren't available

## Static Build Process Integration

During the static build process:

1. The `output: 'export'` configuration in `next.config.js` is activated
2. API routes are temporarily removed from the build
3. The `env-config.js` file is generated with embedded credentials
4. Static fallbacks for API endpoints are created in the output directory

## Testing

To test the static Supabase integration:

1. Run a static build with test credentials:
   ```bash
   npm run build:static:test
   ```

2. Serve the static site:
   ```bash
   npx serve out
   ```

3. Test form submission and file uploads to verify direct Supabase connections

## Security Considerations

1. **Credentials**: Only public anon keys are embedded in the client. Row-level security in Supabase tables provides data protection.
2. **API Fallbacks**: Static JSON fallbacks are only for read-only operations.
3. **Data Validation**: All data is validated client-side before submission.

## Troubleshooting

Common issues:

1. **Missing Credentials**: Check that the `env-config.js` file is correctly generated in the static build
2. **Upload Failures**: Verify that the Supabase storage bucket exists and has appropriate permissions
3. **Form Submission Errors**: Check browser console for detailed error logs