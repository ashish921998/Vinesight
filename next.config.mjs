import { withSentryConfig } from '@sentry/nextjs'
const isProd = process.env.NODE_ENV === 'production'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: isProd
  },

  eslint: {
    ignoreDuringBuilds: isProd
  },

  // Performance optimizations from next.config.ts
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-select',
      '@radix-ui/react-progress',
      'jspdf'
    ]
  },

  // Compiler optimizations
  compiler: {
    removeConsole: isProd
  },

  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    domains: ['images.unsplash.com', 'plus.unsplash.com']
  },

  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js'
      }
    }
  },

  // Security headers and PWA settings
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
    ]

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
          "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.open-meteo.com https://*.sentry.io wss://*.sentry.io https://*.i.posthog.com",
          "frame-src 'self' https://accounts.google.com",
          "worker-src 'self' blob:",
          "manifest-src 'self'"
        ].join('; ')
      })
    }

    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate'
          }
        ]
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json'
          }
        ]
      },
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        source: '/(.*)',
        headers: securityHeaders
      }
    ]
  },

  // Rewrites for PostHog analytics ingestion + auth.md agent-registration discovery.
  async rewrites() {
    return [
      {
        source: '/ingest/static/:path*',
        destination: 'https://us-assets.i.posthog.com/static/:path*'
      },
      {
        source: '/ingest/:path*',
        destination: 'https://us.i.posthog.com/:path*'
      },
      // auth.md: expose the discovery artifacts at their well-known public paths while the
      // route handlers live under /api (so the request origin can be computed dynamically).
      {
        source: '/.well-known/oauth-protected-resource',
        destination: '/api/agent-auth/oauth-protected-resource'
      },
      {
        source: '/.well-known/oauth-authorization-server',
        destination: '/api/agent-auth/oauth-authorization-server'
      },
      {
        source: '/auth.md',
        destination: '/api/agent-auth/auth-md'
      }
    ]
  },

  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true
}

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: 'vinesight-6s',

  project: 'vinesight',

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: '/monitoring',

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  webpack: {
    treeshake: {
      removeDebugLogging: true
    },
    automaticVercelMonitors: true
  }
})
