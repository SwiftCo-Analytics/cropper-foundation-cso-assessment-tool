/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';
const useStandalone = process.env.USE_STANDALONE === 'true';
const path = require('path');

/** Hostnames only (no scheme), comma-separated — extra origins allowed to invoke Server Actions */
function parseServerActionsAllowedOrigins() {
  const raw = process.env.SERVER_ACTIONS_ALLOWED_ORIGINS;
  if (!raw?.trim()) return undefined;
  const list = raw.split(',').map((s) => s.trim()).filter(Boolean);
  return list.length ? list : undefined;
}

const serverActionsAllowedOrigins = parseServerActionsAllowedOrigins();

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
  ...(serverActionsAllowedOrigins && {
    experimental: {
      serverActions: {
        allowedOrigins: serverActionsAllowedOrigins,
      },
    },
  }),
};

module.exports = nextConfig;
