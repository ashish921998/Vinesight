import withPWA from 'next-pwa';

const isProd = process.env.NODE_ENV === 'production';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
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
          "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
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

  // PWA configuration
  async rewrites() {
    return [
      {
        source: '/sw.js',
        destination: '/_next/static/sw.js',
      },
    ];
  },
};

// PWA configuration with mobile-optimized caching
const pwaConfig = withPWA({
  dest: 'public',
  disable: !isProd,
  register: true,
  skipWaiting: true,
  fallbacks: {
    document: '/offline.html',
  },
  runtimeCaching: [
    {
      urlPattern: /^https?.*\.(png|jpe?g|webp|svg|gif|tiff|js|css)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-resources',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
    {
      urlPattern: /^https?.*\/api\/.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 5 * 60, // 5 minutes
        },
        networkTimeoutSeconds: 10,
      },
    },
    {
      urlPattern: ({ request }) => request.mode === 'navigate',
      handler: 'NetworkFirst',
      options: {
        cacheName: 'pages',
        networkTimeoutSeconds: 3,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
  ],
});

export default pwaConfig(nextConfig);