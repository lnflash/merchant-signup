# GitHub Actions Deployment Setup

This document provides instructions for setting up GitHub Actions to build and deploy the Flash Merchant Signup application to DigitalOcean App Platform.

## Required Secrets

The following secrets must be set in your GitHub repository settings:

1. `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
3. `DIGITALOCEAN_ACCESS_TOKEN` - A DigitalOcean personal access token with appropriate permissions

## Setting Up GitHub Secrets

1. Go to your GitHub repository
2. Click on "Settings" tab
3. In the left sidebar, click on "Secrets and variables" > "Actions"
4. Click on "New repository secret"
5. Add each of the required secrets listed above

## DigitalOcean App Platform Setup

Before running the GitHub Actions workflow, you need to create an App on DigitalOcean App Platform:

1. Go to DigitalOcean App Platform
2. Create a new app and configure it as a static site
3. Configure the app name to match the one in the GitHub Actions workflow (`merchant-signup`)

## How This Works

The workflow does the following:

1. Checks out the code repository
2. Sets up Node.js and installs dependencies
3. Runs environment checks to validate the Supabase credentials
4. Builds the Next.js application with Supabase credentials baked into the client bundle
5. Deploys the built application to DigitalOcean App Platform

The environment variables are embedded during the build phase, so they are available to client-side code without needing to be set as runtime environment variables on DigitalOcean.

## Manual Deployment

You can also trigger a manual deployment by:

1. Going to the "Actions" tab in your GitHub repository
2. Selecting the "Build and Deploy to DigitalOcean" workflow
3. Clicking on "Run workflow"
4. Selecting the branch to deploy from and clicking "Run workflow"
