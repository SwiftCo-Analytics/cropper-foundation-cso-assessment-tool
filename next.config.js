/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Image settings
  images: {
    unoptimized: false, // keep false for production optimization
    remotePatterns: [], // add external image patterns if needed
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    // Allow scripts for SSR and hydration; previous 'script-src none' blocked Next.js
    contentSecurityPolicy: "default-src 'self'; script-src 'self'; sandbox;",
  },

  // Experimental optimizations
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },

  // Optional: standalone output is helpful on cPanel
  output: 'standalone',
};

module.exports = nextConfig;
