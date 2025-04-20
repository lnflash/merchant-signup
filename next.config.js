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
  // Fix Cloudflare cookie warnings by setting appropriate headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Set-Cookie',
            // This ensures cookies are only set with the SameSite attribute
            value:
              '__cf_bm=; Path=/; Domain=flash-merchant-signup-ov4yh.ondigitalocean.app; SameSite=None; Secure; HttpOnly; Max-Age=0',
          },
          {
            key: 'Content-Security-Policy',
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' https://*.ondigitalocean.app; frame-src 'self';",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
