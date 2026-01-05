# GitHub Actions Deployment to DigitalOcean

This guide explains how to deploy the Flash Merchant Signup application using GitHub Actions and DigitalOcean App Platform.

## Overview

Instead of relying on runtime environment variables in DigitalOcean, we're using a different approach:

1. Build the application locally or in GitHub Actions with environment variables provided at build time
2. The environment variables get embedded in the JavaScript bundles during the build process
3. Deploy the static output to DigitalOcean App Platform
4. No runtime environment variables are needed on DigitalOcean

This solves the problem of client-side components not having access to environment variables.

## Prerequisites

- GitHub repository with the Flash Merchant Signup code
- DigitalOcean account with access to App Platform
- Supabase project with URL and anonymous key

## Setup Steps

### 1. Create DigitalOcean Access Token

1. Log in to your DigitalOcean account
2. Go to API > Tokens/Keys
3. Click "Generate New Token"
4. Give it a name like "GitHub Actions Deployment"
5. Set appropriate permissions (read and write)
6. Copy the token (you'll only see it once)

### 2. Set up GitHub Secrets

In your GitHub repository:

1. Go to Settings > Secrets and variables > Actions
2. Add the following secrets:
   - `DIGITALOCEAN_ACCESS_TOKEN`: Your DigitalOcean access token
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key

### 3. Create Static App on DigitalOcean App Platform

1. Go to your DigitalOcean dashboard
2. Navigate to Apps > Create App
3. Choose "Create a static site"
4. Name your app "merchant-signup" (must match the name in the GitHub Actions workflow)
5. For now, choose any deployment method (we'll override it with GitHub Actions)
6. Complete the setup with minimal configuration

### 4. Run the GitHub Actions Workflow

1. Push to your main branch or manually trigger the workflow from the Actions tab
2. The workflow will:
   - Build the application with environment variables
   - Export it as a static site
   - Deploy to DigitalOcean

## How It Works

### Environment Variables During Build

The environment variables are embedded in the JavaScript bundles during the build process:

1. `next.config.js` explicitly includes the environment variables:

   ```javascript
   env: {
     NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
     NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
   }
   ```

2. GitHub Actions provides these variables during the build step:

   ```yaml
   env:
     NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
     NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
   ```

3. Next.js replaces all instances of `process.env.NEXT_PUBLIC_*` in the client-side code with the actual values

### Static Export

The `next export` command creates a static version of the app in the `out/` directory, which is deployed to DigitalOcean App Platform.

## Troubleshooting

### File Upload Issues

If file uploads are still using mock URLs:

1. Check the browser console for logging output
2. Verify that the environment variables were correctly embedded during build
3. Check if there are any CSP (Content-Security-Policy) issues blocking connections to Supabase

### GitHub Actions Failures

If the workflow fails:

1. Check the workflow logs in the GitHub Actions tab
2. Verify that all required secrets are set correctly
3. Make sure the DigitalOcean access token has the necessary permissions
4. Check if the app name in the workflow matches the one in DigitalOcean

## Updating the Deployment

To update your deployment:

1. Make your changes to the code
2. Commit and push to the main branch
3. The GitHub Actions workflow will automatically build and deploy the updated version

Alternatively, you can manually trigger the workflow from the Actions tab.

## Security Considerations

- The Supabase anonymous key is embedded in client-side JavaScript and will be visible to users
- This is expected behavior and is secure as long as you've configured proper Row Level Security (RLS) in Supabase
- Ensure your Supabase storage buckets have appropriate RLS policies
