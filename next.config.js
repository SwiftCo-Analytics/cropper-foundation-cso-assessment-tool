/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone', // ensures all dependencies are bundled for cPanel deployment
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'self'; sandbox;",
  },
  // Ensure assets are loaded correctly on subdomain
  assetPrefix: isProd ? '/' : '', 
  // Optional: If your app will be served from a subfolder like /app
  // assetPrefix: isProd ? '/your-subfolder/' : '',

  // If you later use API routes behind a reverse proxy
  experimental: {
    outputFileTracingRoot: __dirname, // helps cPanel locate files for standalone mode
  },
};

module.exports = nextConfig;
