import type { Metadata } from 'next'
import { Geist, Geist_Mono, Montserrat, Merriweather, Source_Code_Pro } from 'next/font/google'
import './globals.css'
import { I18nProvider } from '@/components/providers/I18nProvider'
import { AsyncErrorBoundary } from '@/components/ErrorBoundary'
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

// Optimize font loading - preload only critical fonts, defer others
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
  preload: true
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
  preload: false
})

const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin'],
  display: 'swap',
  preload: false
})

const merriweather = Merriweather({
  variable: '--font-merriweather',
  subsets: ['latin'],
  weight: ['300', '400', '700', '900'],
  display: 'swap',
  preload: false
})

const sourceCodePro = Source_Code_Pro({
  variable: '--font-source-code-pro',
  subsets: ['latin'],
  display: 'swap',
  preload: false
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
  themeColor: '#37a765'
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#37a765" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="VineSight" />

        {/* Enhanced SEO Meta Tags */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="VineSight" />
        <meta name="msapplication-TileColor" content="#37a765" />
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
        className={`${geistSans.variable} ${geistMono.variable} ${montserrat.variable} ${merriweather.variable} ${sourceCodePro.variable} antialiased`}
      >
        <AsyncErrorBoundary>
          <Suspense
            fallback={
              <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
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
        <GoogleAnalytics />
        <Analytics />
      </body>
    </html>
  )
}
