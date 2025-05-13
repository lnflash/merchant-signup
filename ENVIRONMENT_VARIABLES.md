# Environment Variables Guide

This document explains all environment variables used in the Flash Merchant Signup application, their purpose, and how to configure them properly.

## Required Environment Variables

These variables are essential for the application to function correctly:

| Variable                          | Description                                | Example                             |
| --------------------------------- | ------------------------------------------ | ----------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`        | Your Supabase project URL                  | `https://abcdefghijklm.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`   | Your Supabase anonymous key                | `eyJhbGciOiJIUzI1N...`              |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps API key for address validation | `AIzaSyBh3QkzJL...`                 |

## Additional Environment Variables

These variables provide additional configuration options:

| Variable                      | Description                               | Default | Required?          |
| ----------------------------- | ----------------------------------------- | ------- | ------------------ |
| `NEXT_PUBLIC_SITE_URL`        | Production site URL for auth redirects    | -       | Yes for production |
| `NEXT_PUBLIC_API_BASE_URL`    | Base URL for API endpoints                | `/api`  | No                 |
| `NEXT_PUBLIC_VERCEL_URL`      | Automatically set by Vercel in production | -       | No                 |
| `NEXT_PUBLIC_IS_DIGITALOCEAN` | Flag for DigitalOcean deployments         | `false` | No                 |
| `LOG_LEVEL`                   | Logging level for the application         | `info`  | No                 |
| `DEBUG_IN_PRODUCTION`         | Enable debug logs in production           | `false` | No                 |
| `ENABLE_REMOTE_LOGGING`       | Send logs to remote service               | `false` | No                 |
| `IS_BUILD_TIME`               | Indicates static build process            | -       | No                 |

## Static Build Environment Variables

For static builds, environment variables are injected at build time into a client-accessible object. If you're building for static deployment, these need to be available during the build process.

## Environment-Specific Configuration

### Development

For local development, create a `.env.local` file in the project root with:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Production

For production deployments, set these environment variables in your deployment platform (Vercel, DigitalOcean, etc.).

For DigitalOcean App Platform static deployments, the variables are injected at build time using GitHub Actions.

## Google Maps API Configuration

The `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` must be configured with access to:

- Google Maps JavaScript API
- Places API
- Geocoding API

For detailed setup instructions, see [GOOGLE_MAPS_SETUP.md](GOOGLE_MAPS_SETUP.md).

## Security Considerations

- The `NEXT_PUBLIC_` prefix makes variables available on the client-side
- Client-side variables will be visible in the browser's source code
- For Supabase, this is secure as long as you've configured proper Row Level Security (RLS) policies
- For production, consider restricting your Google Maps API key to specific domains

## Troubleshooting

If you experience environment variable issues:

1. **Variables not available in components**:

   - Ensure `NEXT_PUBLIC_` prefix is used for client-side variables
   - Restart the development server after changing .env files

2. **Static build environment issues**:

   - For static builds, check that variables are properly injected during build
   - Verify the `window.ENV` object in browser console

3. **Authentication redirection problems**:
   - Ensure `NEXT_PUBLIC_SITE_URL` is set correctly for your environment
   - It should match the actual URL where your application is hosted
