import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true, // Ignore TypeScript errors during build for Render
  },
  outputFileTracingRoot: process.cwd(),
  
  // Disable static page generation for error handling to prevent HTML import errors
  experimental: {
    optimizePackageImports: ['lucide-react', '@heroicons/react'],
    optimizeCss: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
  // Development configuration to prevent chunk loading issues
  ...(process.env.NODE_ENV === 'development' && {
    generateEtags: false,
    poweredByHeader: false,
    // Disable static optimization in development
    experimental: {
      optimizePackageImports: ['lucide-react', '@heroicons/react'],
      optimizeCss: true,
    },
  }),
  // Production configuration
  ...(process.env.NODE_ENV === 'production' && {
    experimental: {
      optimizePackageImports: ['lucide-react', '@heroicons/react'],
      optimizeCss: true,
    },
  }),
  async headers() {
    return [
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json'
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600'
          }
        ]
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript'
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate'
          }
        ]
      },
      {
        source: '/favicon.ico',
        headers: [
          {
            key: 'Content-Type',
            value: 'image/vnd.microsoft.icon'
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400'
          }
        ]
      },
      {
        source: '/background.jpg',
        headers: [
          {
            key: 'Content-Type',
            value: 'image/jpeg'
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000'
          }
        ]
      },
      {
        source: '/uploads/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000'
          }
        ]
      },
      {
        source: '/_next/static/css/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ];
  }
};

export default nextConfig;