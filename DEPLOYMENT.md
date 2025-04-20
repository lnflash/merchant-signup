# Flash Merchant Signup Deployment Guide

This guide explains how to properly configure environment variables for deployment, with a focus on DigitalOcean App Platform.

## Required Environment Variables

The following environment variables **MUST** be set as **Runtime Environment Variables**:

| Variable                        | Description                                 | Example                                   |
| ------------------------------- | ------------------------------------------- | ----------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | The URL of your Supabase project            | `https://abcdefghijklm.supabase.co`       |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | The anonymous key for your Supabase project | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

## Environment Variable Configuration

### DigitalOcean App Platform

1. Go to your app in the DigitalOcean App Platform
2. Navigate to **Settings** > **Environment Variables**
3. Add the required variables mentioned above
4. **CRITICAL**: Make sure to set these as **Runtime Environment Variables**, not Build-time Environment Variables
   - Build-time variables are only available during build and not when the app is running
   - The file upload functionality will not work if these are set as Build-time variables

![DigitalOcean Environment Variables](/docs/images/do-env-vars.png)

### Troubleshooting Environment Variables

If you're experiencing issues with file uploads, follow these steps:

1. Verify the environment variables are set correctly:

   ```
   npm run check-env
   ```

2. Ensure the variables are available at runtime:

   - DigitalOcean: Verify they are set as Runtime Environment Variables, not Build-time
   - Other platforms: Check your platform's documentation for environment variable configuration

3. Look for these specific log messages in your application logs:
   ```
   [🔑] CRITICAL: Missing Supabase credentials
   ```
   This indicates the environment variables aren't available during runtime.

## Storage Configuration in Supabase

1. Log in to your Supabase project
2. Navigate to **Storage** > **Buckets**
3. Create a bucket named `id_uploads` if it doesn't exist
4. Configure RLS (Row Level Security) policies for the bucket:
   - For development, you can temporarily set it to public access
   - For production, configure proper RLS policies based on your authentication setup

## Testing Your Deployment

After deploying, test the file upload functionality:

1. Fill out the merchant signup form
2. Upload an ID image
3. Check the browser console for any error messages
4. Verify in Supabase Storage that the file was uploaded successfully

## Common Issues

1. **Mock URLs in Production**: If you see URLs like `https://example.com/id_uploads/...`, it means the application is falling back to mock mode because it can't access the Supabase credentials.

2. **Credentials Loading Issues**: If you see `[🔑] ⚠️ MISSING CREDENTIALS IN RESPONSE!` in the console, check that:

   - Environment variables are properly set
   - They are available at runtime (not just build time)
   - There are no typos or trailing/leading spaces in the values

3. **API Endpoint Access**: Ensure your Supabase project allows API access from your deployment domain.

## Support

If you continue to experience issues, please provide:

1. The output of `npm run check-env`
2. Console logs from the browser
3. Any error messages from the deployment platform
