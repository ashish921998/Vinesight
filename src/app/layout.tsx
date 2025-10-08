import type { Metadata } from 'next'
import { Geist, Geist_Mono, Montserrat, Merriweather, Source_Code_Pro } from 'next/font/google'
import './globals.css'
import { I18nProvider } from '@/components/providers/I18nProvider'
import { AsyncErrorBoundary } from '@/components/ErrorBoundary'
import { Suspense } from 'react'
import { GlobalAuthErrorHandler } from '@/components/auth/GlobalAuthErrorHandler'
import { Analytics } from '@vercel/analytics/next'
import { GoogleAnalytics, SearchConsoleVerification } from '@/components/GoogleAnalytics'
import { LayoutContent } from '@/components/layout/LayoutContent'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin']
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin']
})

const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin']
})

const merriweather = Merriweather({
  variable: '--font-merriweather',
  subsets: ['latin'],
  weight: ['300', '400', '700', '900']
})

const sourceCodePro = Source_Code_Pro({
  variable: '--font-source-code-pro',
  subsets: ['latin']
})

export const metadata: Metadata = {
  title: 'FarmAI - AI-Powered Smart Farm Management System | Precision Agriculture Technology',
  description:
    "Transform your farming operations with FarmAI's intelligent farm management system. AI-driven crop monitoring, yield prediction, disease detection, and automation for modern agriculture. Perfect for grape farming, vineyard management, and precision farming techniques.",
  keywords:
    'farm management system, AI farming, smart agriculture, precision farming, grape farm management, vineyard management, crop monitoring, AI agriculture, farming technology, agricultural automation, yield prediction, disease detection, farming software, digital agriculture, smart farming solutions, agricultural AI, farm analytics, crop management, irrigation management, agricultural data, farming dashboard, agricultural intelligence, modern farming, agritech, farm optimization, agricultural technology, sustainable farming, farming apps, agricultural software, farm productivity, crop analytics, agricultural insights',
  authors: [{ name: 'FarmAI Team' }],
  creator: 'FarmAI - Smart Agriculture Solutions',
  publisher: 'FarmAI Technologies',
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
  metadataBase: new URL('https://farmai.vercel.app'),
  alternates: {
    canonical: '/'
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://farmai.vercel.app',
    title: 'FarmAI - AI-Powered Smart Farm Management System',
    description:
      'Transform your farming operations with AI-driven crop monitoring, yield prediction, and automated farm management. Perfect for grape farming and precision agriculture.',
    siteName: 'FarmAI',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'FarmAI - Smart Farm Management System'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FarmAI - AI-Powered Smart Farm Management',
    description:
      'Transform farming with AI-driven crop monitoring, yield prediction, and automated management systems.',
    images: ['/og-image.png'],
    creator: '@FarmAI'
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
        <meta name="apple-mobile-web-app-title" content="FarmAI" />

        {/* Enhanced SEO Meta Tags */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="FarmAI" />
        <meta name="msapplication-TileColor" content="#37a765" />
        <meta name="msapplication-config" content="/browserconfig.xml" />

        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Canonical URL will be set per page */}
        <link rel="canonical" href="https://farmai.vercel.app" />

        {/* Additional SEO enhancements */}
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
