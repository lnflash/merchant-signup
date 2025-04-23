# Environment Variables Guide

This document explains the environment variables used in the Flash Merchant Signup application.

## Core Environment Variables

| Variable                          | Description                                | Required | Example                              |
| --------------------------------- | ------------------------------------------ | -------- | ------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`        | Your Supabase project URL                  | Yes      | `https://abcdefghijklm.supabase.co`  |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`   | Your Supabase anonymous key                | Yes      | `eyJhbGciOiJIUzI1N...`               |
| `NEXT_PUBLIC_SITE_URL`            | Production site URL for auth redirects     | Yes      | `https://flash-merchant.example.com` |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps API key for address validation | Yes      | `AIzaSyBh3QkzJL...`                  |
| `NEXT_PUBLIC_API_BASE_URL`        | Base URL for API endpoints                 | No       | `/api`                               |
| `NEXT_PUBLIC_VERCEL_URL`          | Automatically set by Vercel in production  | No       | `flash-merchant-signup.vercel.app`   |

## Authentication Configuration

The `NEXT_PUBLIC_SITE_URL` variable is critical for email authentication. Without it, Supabase will append localhost URLs to confirmation links, which can cause issues in production environments.

## Google Maps Integration

The `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` variable is required for the address autocomplete and map display features. This key should be created in the Google Cloud Console with the following APIs enabled:

- Google Maps JavaScript API
- Places API
- Geocoding API

For security, restrict the API key to your application's domains. For detailed setup instructions, see [GOOGLE_MAPS_SETUP.md](GOOGLE_MAPS_SETUP.md).

When deploying to a hosting provider like Vercel, you should set `NEXT_PUBLIC_SITE_URL` to your actual production domain.

## Local Development

For local development, you can set `NEXT_PUBLIC_SITE_URL` to `http://localhost:3000` to ensure proper authentication flows during testing.

## Other Optional Variables

| Variable                | Description                       | Default |
| ----------------------- | --------------------------------- | ------- |
| `LOG_LEVEL`             | Logging level for the application | `info`  |
| `DEBUG_IN_PRODUCTION`   | Enable debug logs in production   | `false` |
| `ENABLE_REMOTE_LOGGING` | Send logs to remote service       | `false` |
| `IS_BUILD_TIME`         | Indicates static build process    | -       |

## Using Environment Variables

Environment variables should be stored in the appropriate place based on your deployment target:

- Local development: `.env.local`
- Vercel: Environment Variables section in the project settings
- Other platforms: Follow platform-specific instructions for setting environment variables

Always ensure that secret environment variables are properly secured and not committed to the repository.
