import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist'
import {
  CacheFirst,
  ExpirationPlugin,
  NetworkFirst,
  RangeRequestsPlugin,
  Serwist,
  StaleWhileRevalidate
} from 'serwist'

// This adds the "SerwistGlobalConfig" interface to the global scope
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST ?? [],
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      matcher: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: new CacheFirst({
        cacheName: 'google-fonts',
        plugins: [
          new ExpirationPlugin({
            maxEntries: 4,
            maxAgeSeconds: 365 * 24 * 60 * 60
          })
        ]
      })
    },
    {
      matcher: /^https:\/\/fonts\.gstatic\.com\/.*/i,
      handler: new CacheFirst({
        cacheName: 'google-fonts-static',
        plugins: [
          new ExpirationPlugin({
            maxEntries: 4,
            maxAgeSeconds: 365 * 24 * 60 * 60
          })
        ]
      })
    },
    {
      matcher: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
      handler: new StaleWhileRevalidate({
        cacheName: 'static-font-assets',
        plugins: [
          new ExpirationPlugin({
            maxEntries: 4,
            maxAgeSeconds: 7 * 24 * 60 * 60
          })
        ]
      })
    },
    {
      matcher: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      handler: new StaleWhileRevalidate({
        cacheName: 'static-image-assets',
        plugins: [
          new ExpirationPlugin({
            maxEntries: 64,
            maxAgeSeconds: 24 * 60 * 60
          })
        ]
      })
    },
    {
      matcher: /\/_next\/image\?url=.+$/i,
      handler: new StaleWhileRevalidate({
        cacheName: 'next-image',
        plugins: [
          new ExpirationPlugin({
            maxEntries: 64,
            maxAgeSeconds: 24 * 60 * 60
          })
        ]
      })
    },
    {
      matcher: /\.(?:mp3|wav|ogg)$/i,
      handler: new CacheFirst({
        cacheName: 'static-audio-assets',
        plugins: [
          new RangeRequestsPlugin(),
          new ExpirationPlugin({
            maxEntries: 32,
            maxAgeSeconds: 24 * 60 * 60
          })
        ]
      })
    },
    {
      matcher: /\.(?:mp4)$/i,
      handler: new CacheFirst({
        cacheName: 'static-video-assets',
        plugins: [
          new RangeRequestsPlugin(),
          new ExpirationPlugin({
            maxEntries: 16,
            maxAgeSeconds: 24 * 60 * 60
          })
        ]
      })
    },
    {
      matcher: /\.(?:js)$/i,
      handler: new StaleWhileRevalidate({
        cacheName: 'static-js-assets',
        plugins: [
          new ExpirationPlugin({
            maxEntries: 48,
            maxAgeSeconds: 24 * 60 * 60
          })
        ]
      })
    },
    {
      matcher: /\.(?:css|less)$/i,
      handler: new StaleWhileRevalidate({
        cacheName: 'static-style-assets',
        plugins: [
          new ExpirationPlugin({
            maxEntries: 32,
            maxAgeSeconds: 24 * 60 * 60
          })
        ]
      })
    },
    {
      matcher: /\/_next\/data\/.+\/.+\.json$/i,
      handler: new StaleWhileRevalidate({
        cacheName: 'next-data',
        plugins: [
          new ExpirationPlugin({
            maxEntries: 32,
            maxAgeSeconds: 24 * 60 * 60
          })
        ]
      })
    },
    {
      matcher: /\.(?:json|xml|csv)$/i,
      handler: new NetworkFirst({
        cacheName: 'static-data-assets',
        plugins: [
          new ExpirationPlugin({
            maxEntries: 32,
            maxAgeSeconds: 24 * 60 * 60
          })
        ]
      })
    },
    {
      matcher: ({ request, sameOrigin }: { request: Request; sameOrigin: boolean }) => {
        return sameOrigin && request.headers.get('sec-fetch-dest') === 'script'
      },
      handler: new NetworkFirst({
        cacheName: 'scripts',
        plugins: [
          new ExpirationPlugin({
            maxEntries: 32,
            maxAgeSeconds: 24 * 60 * 60
          })
        ]
      })
    },
    {
      matcher: ({ request, sameOrigin }: { request: Request; sameOrigin: boolean }) => {
        return sameOrigin && request.headers.get('sec-fetch-dest') === 'style'
      },
      handler: new NetworkFirst({
        cacheName: 'styles',
        plugins: [
          new ExpirationPlugin({
            maxEntries: 32,
            maxAgeSeconds: 24 * 60 * 60
          })
        ]
      })
    },

    {
      matcher: ({ sameOrigin }: { sameOrigin: boolean }) => {
        return sameOrigin
      },
      handler: new NetworkFirst({
        cacheName: 'same-origin',
        networkTimeoutSeconds: 10,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 32,
            maxAgeSeconds: 24 * 60 * 60
          })
        ]
      })
    },
    {
      matcher: ({ request }: { request: Request }) => {
        return (
          request.destination === 'image' ||
          request.destination === 'script' ||
          request.destination === 'style'
        )
      },
      handler: new StaleWhileRevalidate({
        cacheName: 'static-assets',
        plugins: [
          new ExpirationPlugin({
            maxEntries: 64,
            maxAgeSeconds: 24 * 60 * 60
          })
        ]
      })
    }
  ]
})

serwist.addEventListeners()
