/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';
const useStandalone = process.env.USE_STANDALONE === 'true';
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  // swcMinify is enabled by default in Next.js 13+, no need to specify
  // Only use standalone output when explicitly requested (for production deployment)
  ...(useStandalone && { output: 'standalone' }),
  // outputFileTracingRoot is only available in Next.js 15+, removed for Next.js 14.1.0 compatibility
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'self'; sandbox;",
  },
  webpack: (config) => {
    // Explicitly configure path aliases for webpack
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, './src'),
    };
    return config;
  },
};

module.exports = nextConfig;
