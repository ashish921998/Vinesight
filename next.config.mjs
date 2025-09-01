import withPWA from 'next-pwa';

const isProd = process.env.NODE_ENV === 'production';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: isProd,
  },
  
  // Performance optimizations from next.config.ts
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-select', 
      '@radix-ui/react-progress',
      'jspdf'
    ],
  },
  
  // Compiler optimizations
  compiler: {
    removeConsole: isProd,
  },
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  },
  
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },

  // Security headers
  async headers() {
    const securityHeaders = [
      {
        key: 'X-DNS-Prefetch-Control',
        value: 'on'
      },
      {
        key: 'X-XSS-Protection',
        value: '1; mode=block'
      },
      {
        key: 'X-Frame-Options',
        value: 'SAMEORIGIN'
      },
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff'
      },
      {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin'
      }
    ];

    // Mobile-compatible CSP policy
    if (isProd) {
      securityHeaders.push({
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' https://fonts.gstatic.com",
          "img-src 'self' data: https: blob:",
          "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.open-meteo.com",
          "frame-src 'self' https://accounts.google.com",
          "worker-src 'self' blob:",
          "manifest-src 'self'",
        ].join('; ')
      });
    }

    return [
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: securityHeaders
      }
    ];
  },

};

// PWA configuration - online-only (no offline caching)
const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: !isProd, // Disable PWA in development
  // Custom service worker that doesn't cache anything for offline use
  sw: 'sw.js',
  // Disable workbox completely to prevent offline caching
  disableDevLogs: true,
  // No precaching of static assets
  publicExcludes: ['!**/*'],
  // No runtime caching strategies
  runtimeCaching: []
});

export default pwaConfig(nextConfig);