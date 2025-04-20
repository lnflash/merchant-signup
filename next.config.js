/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
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
  },
  images: {
    domains: ['example.com'],
    formats: ['image/avif', 'image/webp'],
  },
  // Basic security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' https://*.ondigitalocean.app https://*.cloudflare.com; frame-src 'self' https://*.cloudflare.com;",
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
};

module.exports = nextConfig;
