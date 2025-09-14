declare module 'next-pwa' {
  import { NextConfig } from 'next'

  interface PWAConfig {
    dest: string
    register: boolean
    skipWaiting: boolean
    disable?: boolean
    sw?: string
    runtimeCaching?: Array<{
      urlPattern: RegExp
      handler: string
      options?: {
        cacheName: string
        expiration?: {
          maxEntries: number
          maxAgeSeconds: number
        }
        networkTimeoutSeconds?: number
      }
    }>
  }

  function nextPWA(config: PWAConfig): (nextConfig: NextConfig) => NextConfig

  export default nextPWA
}
