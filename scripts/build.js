#!/usr/bin/env node

/**
 * Custom build script that allows the build to continue even if ESLint fails.
 * This is useful for production deployments where we want to deploy the code
 * even if there are linting issues, while still showing the warnings.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Starting production build process...');

// Check for TypeScript errors first (these should fail the build)
try {
  console.log('Running TypeScript type check...');
  execSync('npm run typecheck', { stdio: 'inherit' });
} catch (error) {
  console.error('TypeScript errors detected. Aborting build.');
  process.exit(1);
}

// Then run lint in a way that reports errors but doesn't fail the build
try {
  console.log("Running ESLint (errors will be reported but won't stop the build)...");
  execSync('npm run lint', { stdio: 'inherit' });
  console.log('ESLint completed without errors.');
} catch (error) {
  console.warn('ESLint found issues, but continuing with build...');
  console.warn(error.message);
}

// Run the Next.js build
try {
  console.log('Running Next.js build...');
  execSync('next build', { stdio: 'inherit' });
  console.log('Build completed successfully.');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
