# Flash Merchant Signup Deployment Guide

This guide explains how to deploy the Flash Merchant Signup application to DigitalOcean App Platform using GitHub Actions with embedded environment variables.

## Overview

We've migrated to a new deployment approach that solves the issue with environment variables:

1. Environment variables are embedded at build time using GitHub Actions
2. The built static site is deployed to DigitalOcean
3. No runtime environment variables are needed on DigitalOcean

This approach ensures that client-side components like the file upload can access Supabase credentials.

## Prerequisites

- GitHub repository with this code
- GitHub repository secrets configured
- DigitalOcean App Platform account
- Supabase project with URL and anonymous key

## Required GitHub Secrets

Set these secrets in your GitHub repository (Settings > Secrets and variables > Actions):

| Secret                          | Description                                 | Example                                    |
| ------------------------------- | ------------------------------------------- | ------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`      | The URL of your Supabase project            | `https://abcdefghijklm.supabase.co`        |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | The anonymous key for your Supabase project | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`  |
| `DIGITALOCEAN_ACCESS_TOKEN`     | DigitalOcean API token                      | (Create in DigitalOcean API > Tokens/Keys) |

## Setting Up Your DigitalOcean App

### Option 1: Configure Existing App (Recommended)

If you already have a DigitalOcean app:

1. Go to your DigitalOcean App Platform dashboard
2. Select your merchant-signup app
3. Go to "Settings" > "Source"
4. Change the Branch to `gh-pages` (this is where GitHub Actions deploys the static site)
5. Go to "Settings" > "Build & Deploy"
6. Configure as a static site:
   - **Source Directory**: `/` (root of the gh-pages branch)
   - **Output Directory**: Leave empty (files are already built)
   - **Build Command**: Leave blank (GitHub Actions already handled the build)
7. Remove any existing environment variables (they're now embedded in the build)
8. Under "Routes":
   - Make sure the site is served from `/`
   - Add error handling with `404.html` as your error page
9. Under "Source Code Integration":
   - Turn ON "Autodeploy on Push" for the `gh-pages` branch only
   - Keep the GitHub connection active

### Option 2: Create a New App

If you're starting fresh:

1. In DigitalOcean App Platform, create a new app
2. Choose "Static Site" as the type
3. Connect to your GitHub repository
4. Select the `gh-pages` branch as the source
5. Use the app name that matches your GitHub Actions workflow (`merchant-signup`)
6. Configure as a static site:
   - **Source Directory**: `/` (root of the gh-pages branch)
   - **Output Directory**: Leave empty (files are already built)
   - **Build Command**: Leave blank (GitHub Actions already handled the build)
7. Skip setting environment variables (they're embedded in the build)
8. Turn ON autodeploy for the `gh-pages` branch

## Deployment Process

With the GitHub Actions workflow we've set up:

1. Push your changes to the main branch
2. GitHub Actions automatically:
   - Builds the app with environment variables embedded in the JavaScript
   - Exports a static site to the `out/` directory
   - Deploys this to your DigitalOcean App Platform app

You can also manually trigger the workflow from the GitHub Actions tab.

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

## Troubleshooting

### 404 Errors on DigitalOcean

If you're seeing 404 errors when accessing your deployed site:

1. Verify that the GitHub Actions workflow completed successfully by checking the workflow logs
2. Check that the `gh-pages` branch contains the correct files by browsing it on GitHub
3. Ensure your DigitalOcean app is configured to deploy from the `gh-pages` branch
4. Make sure you've set the proper routes in DigitalOcean App Platform:
   - Root route should be `/`
   - Error page should be `404.html`
5. Check that the static files were properly generated with `index.html` files for each route
6. Try manually triggering a redeployment in DigitalOcean App Platform

### Missing Images or Styles

If your site loads but is missing images or styles:

1. Check the browser console for any resource loading errors
2. Verify that the images and stylesheets are properly included in the static build
3. Check the network tab in browser dev tools to see if resources are returning 404 errors
4. Make sure all static assets are properly referenced with correct paths

### File Upload Issues

If file uploads are still using mock URLs:

1. Check your browser console for any errors
2. Verify that the environment variables were correctly embedded during build
3. Check if there are any CSP (Content-Security-Policy) issues blocking connections to Supabase
4. Verify Supabase bucket permissions and RLS policies

## Security Notes

- The Supabase anonymous key is embedded in client-side JavaScript and will be visible to users
- This is expected behavior and is secure as long as you've configured proper Row Level Security (RLS) in Supabase
- Ensure your Supabase storage buckets have appropriate RLS policies

## Support

If you continue to experience issues, please provide:

1. GitHub Actions workflow logs
2. Browser console logs
3. Any error messages from the DigitalOcean platform
