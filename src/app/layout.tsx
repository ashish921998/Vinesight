import type { Metadata } from 'next'
import { Manrope, DM_Serif_Display, Playfair_Display, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { I18nProvider } from '@/components/providers/I18nProvider'
import { AsyncErrorBoundary } from '@/components/ErrorBoundary'
import { SentryErrorBoundary } from '@/components/SentryErrorBoundary'
import { Suspense } from 'react'
import { GlobalAuthErrorHandler } from '@/components/auth/GlobalAuthErrorHandler'
import { Analytics } from '@vercel/analytics/next'
import { GoogleAnalytics, SearchConsoleVerification } from '@/components/GoogleAnalytics'
import dynamic from 'next/dynamic'
import { SEO_KEYWORDS } from '@/lib/seo-constants'

const LayoutContent = dynamic(
  () => import('@/components/layout/LayoutContent').then((mod) => ({ default: mod.LayoutContent })),
  {
    ssr: true
  }
)

const manrope = Manrope({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800']
})

const dmSerifDisplay = DM_Serif_Display({
  variable: '--font-heading',
  subsets: ['latin'],
  weight: '400'
})

const playfairDisplay = Playfair_Display({
  variable: '--font-serif',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700']
})

const jetBrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin']
})

export const metadata: Metadata = {
  title: 'VineSight - AI-Powered Smart Farm Management',
  description:
    'AI-powered vineyard management with crop monitoring, yield prediction, and disease detection. Transform your farming operations with precision agriculture technology.',
  keywords: SEO_KEYWORDS,
  authors: [{ name: 'VineSight Team' }],
  creator: 'VineSight - Smart Agriculture Solutions',
  publisher: 'VineSight Technologies',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SEARCH_CONSOLE_VERIFICATION
  },
  category: 'agriculture',
  classification: 'Agriculture Technology',
  manifest: '/manifest.json',
  metadataBase: new URL('https://vinesight.vercel.app'),
  alternates: {
    canonical: '/'
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://vinesight.vercel.app',
    title: 'VineSight - AI-Powered Smart Farm Management System',
    description:
      'Transform your farming operations with AI-driven crop monitoring, yield prediction, and automated farm management. Perfect for grape farming and precision agriculture.',
    siteName: 'VineSight',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'VineSight - Smart Farm Management System'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VineSight - AI-Powered Smart Farm Management',
    description:
      'Transform farming with AI-driven crop monitoring, yield prediction, and automated management systems.',
    images: ['/og-image.png'],
    creator: '@VineSight'
  },
  icons: {
    icon: [
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' }
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }]
  }
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#5D3A58'
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={manrope.variable}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#5D3A58" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="VineSight" />

        {/* Enhanced SEO Meta Tags */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="VineSight" />
        <meta name="msapplication-TileColor" content="#5D3A58" />
        <meta name="msapplication-config" content="/browserconfig.xml" />

        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Canonical URL will be set per page */}
        <link rel="canonical" href="https://vinesight.vercel.app" />

        {/* Additional SEO enhancements */}
        <meta name="keywords" content={SEO_KEYWORDS} />
        <meta name="rating" content="general" />
        <meta name="distribution" content="global" />
        <meta name="language" content="en" />
        <meta name="geo.region" content="IN" />
        <meta name="geo.placename" content="India" />

        {/* Google Search Console Verification */}
        <SearchConsoleVerification />
      </head>
      <body
        className={`${manrope.variable} ${dmSerifDisplay.variable} ${playfairDisplay.variable} ${jetBrainsMono.variable} antialiased`}
      >
        <SentryErrorBoundary>
          <AsyncErrorBoundary>
            <Suspense
              fallback={
                <div className="min-h-screen flex items-center justify-center bg-background">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading VineSight...</p>
                  </div>
                </div>
              }
            >
              <GlobalAuthErrorHandler />
              <I18nProvider>
                <LayoutContent>{children}</LayoutContent>
              </I18nProvider>
            </Suspense>
          </AsyncErrorBoundary>
        </SentryErrorBoundary>
        <GoogleAnalytics />
        <Analytics />
      </body>
    </html>
  )
}
