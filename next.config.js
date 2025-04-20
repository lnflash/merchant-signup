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
    IS_BUILD_TIME: process.env.IS_BUILD_TIME || false,
  },
  images: {
    domains: ['example.com'],
    formats: ['image/avif', 'image/webp'],
  },
};

module.exports = nextConfig;
