/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Using conditional output mode based on build environment
  ...(process.env.IS_BUILD_TIME === 'true' ? { output: 'export' } : {}),
  distDir: '.next',
  // Set trailing slash and static parameters
  trailingSlash: false,
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // We're allowing TypeScript errors to be ignored at build time.
    // This is not ideal, but necessary to deploy while fixing issues.
    ignoreBuildErrors: false,
  },
  env: {
    // This ensures the IS_BUILD_TIME var is explicitly false in production
    IS_BUILD_TIME: process.env.IS_BUILD_TIME === 'true' ? 'true' : 'false',
    // Explicitly pass Supabase credentials to be baked into the client build
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    // Pass Google Maps API key for client-side usage
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  },
  images: {
    unoptimized: true, // Required for static export
    domains: ['example.com', 'maps.googleapis.com', 'maps.gstatic.com'],
    formats: ['image/avif', 'image/webp'],
  },
  // Headers not used with static export, but keep the config for non-static builds
  ...(process.env.IS_BUILD_TIME === 'true'
    ? {}
    : {
        async headers() {
          return [
            {
              source: '/(.*)',
              headers: [
                {
                  key: 'Content-Security-Policy',
                  value:
                    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.cloudflare.com https://challenges.cloudflare.com https://*.googleapis.com https://*.gstatic.com https://maps.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.googleapis.com; img-src 'self' data: blob: https://*.googleapis.com https://*.gstatic.com; connect-src 'self' https://*.ondigitalocean.app https://*.cloudflare.com https://*.supabase.co https://*.supabase.in https://*.googleapis.com https://maps.googleapis.com; font-src 'self' https://fonts.gstatic.com; frame-src 'self' https://*.cloudflare.com https://*.google.com; report-uri https://flash-merchant-signup-ov4yh.ondigitalocean.app/api/csp-report;",
                },
                {
                  key: 'X-Content-Type-Options',
                  value: 'nosniff',
                },
                {
                  key: 'X-Frame-Options',
                  value: 'DENY',
                },
                {
                  key: 'X-XSS-Protection',
                  value: '1; mode=block',
                },
              ],
            },
          ];
        },
      }),
};

module.exports = nextConfig;
