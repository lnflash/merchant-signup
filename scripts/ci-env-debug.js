/**
 * CI Environment Debug Script
 *
 * This script helps debug environment variable issues in CI environments.
 * It prints whether environment variables are set without revealing their values.
 */

console.log('=== CI Environment Variable Debug ===');

// Check environment variables related to Supabase
const envVars = {
  // Next.js environment variables
  NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,

  // Build configuration
  NODE_ENV: process.env.NODE_ENV,
  IS_BUILD_TIME: process.env.IS_BUILD_TIME,

  // Other relevant variables
  CI: process.env.CI,
  GITHUB_ACTIONS: process.env.GITHUB_ACTIONS,
  GITHUB_WORKFLOW: process.env.GITHUB_WORKFLOW,
  GITHUB_RUN_ID: process.env.GITHUB_RUN_ID,
};

console.log('Environment variable status:');
Object.entries(envVars).forEach(([key, value]) => {
  console.log(`- ${key}: ${typeof value === 'boolean' ? (value ? 'set' : 'not set') : value}`);
});

// Check for Next.js public variables
console.log('\nAll NEXT_PUBLIC_* variables:');
const nextPublicVars = Object.keys(process.env)
  .filter(key => key.startsWith('NEXT_PUBLIC_'))
  .reduce((obj, key) => {
    obj[key] = !!process.env[key];
    return obj;
  }, {});

if (Object.keys(nextPublicVars).length > 0) {
  console.log(nextPublicVars);
} else {
  console.log('No NEXT_PUBLIC_* variables found');
}

// Check file system access
console.log('\nFile system access:');
try {
  const fs = require('fs');
  const files = fs.readdirSync('.');
  console.log(`- Current directory (${process.cwd()}) has ${files.length} files`);

  // Check if critical files exist
  const criticalFiles = ['next.config.js', 'package.json', '.github/workflows/deploy.yml'];

  criticalFiles.forEach(file => {
    try {
      const exists = fs.existsSync(file);
      console.log(`- ${file}: ${exists ? 'exists' : 'missing'}`);
    } catch (err) {
      console.log(`- ${file}: error checking (${err.message})`);
    }
  });
} catch (err) {
  console.log(`Error accessing file system: ${err.message}`);
}

// Print next.config.js content
console.log('\nNext.js configuration:');
try {
  const fs = require('fs');
  if (fs.existsSync('next.config.js')) {
    const nextConfig = fs.readFileSync('next.config.js', 'utf8');
    // Extract and print only the part about output: export
    const outputMatch = nextConfig.match(/output:.*?['"](export|standalone)['"]/);
    if (outputMatch) {
      console.log(`- Found output configuration: ${outputMatch[0]}`);
    } else {
      console.log(`- No output: 'export' configuration found in next.config.js`);
    }

    // Check for conditional output configuration
    const conditionalMatch = nextConfig.match(/IS_BUILD_TIME.*?output/s);
    if (conditionalMatch) {
      console.log('- Found conditional output configuration based on IS_BUILD_TIME');
    }
  } else {
    console.log('- next.config.js not found');
  }
} catch (err) {
  console.log(`Error reading next.config.js: ${err.message}`);
}

console.log('\n=== End of CI Environment Debug ===');
