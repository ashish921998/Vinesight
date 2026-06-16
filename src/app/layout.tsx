import type { Metadata, Viewport } from 'next'
import {
  Geist,
  Geist_Mono,
  Montserrat,
  Merriweather,
  Source_Code_Pro,
  Inter
} from 'next/font/google'
import './globals.css'
import { I18nProvider } from '@/components/providers/I18nProvider'
import { MotionConfigProvider } from '@/components/providers/MotionConfigProvider'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { AsyncErrorBoundary } from '@/components/ErrorBoundary'
import { SentryErrorBoundary } from '@/components/SentryErrorBoundary'
import { Suspense } from 'react'
import { GlobalAuthErrorHandler } from '@/components/auth/GlobalAuthErrorHandler'
import { Analytics } from '@vercel/analytics/next'
import { GoogleAnalytics } from '@/components/GoogleAnalytics'
import dynamic from 'next/dynamic'
import { SEO_KEYWORDS } from '@/lib/seo-constants'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

const LayoutContent = dynamic(
  () => import('@/components/layout/LayoutContent').then((mod) => ({ default: mod.LayoutContent })),
  {
    ssr: true
  }
)

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
  title: 'VineSight - Grower Network Management for Grape Exporters',
  description:
    'One view of your grower network for grape exporters, FPCs, and consultants worldwide: spray records, lab results, advisory, and export compliance across every farm.',
  keywords: SEO_KEYWORDS,
  applicationName: 'VineSight',
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
  appleWebApp: {
    capable: true,
    title: 'VineSight',
    statusBarStyle: 'default'
  },
  formatDetection: {
    telephone: false
  },
  metadataBase: new URL('https://vinesight.vercel.app'),
  alternates: {
    canonical: '/'
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://vinesight.vercel.app',
    title: 'VineSight - Grower Network Management for Grape Exporters',
    description:
      'Growers log sprays, irrigation, and lab results from the field. Exporters, FPCs, and consultants see compliance and crop status across every farm they source from.',
    siteName: 'VineSight',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'VineSight - Grower network management for grape exporters'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VineSight - Grower Network Management for Grape Exporters',
    description:
      'One view of your grower network: spray records, lab results, advisory, and export compliance across every farm.',
    images: ['/og-image.png'],
    creator: '@VineSight'
  },
  icons: {
    icon: [
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' }
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }]
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'msapplication-TileColor': '#6F8F5E',
    'msapplication-config': '/browserconfig.xml',
    rating: 'general',
    distribution: 'global',
    language: 'en',
    'geo.region': 'IN',
    'geo.placename': 'India'
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#6F8F5E'
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${montserrat.variable} ${merriweather.variable} ${sourceCodePro.variable} antialiased`}
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
              <AuthProvider>
                <MotionConfigProvider>
                  <I18nProvider>
                    <LayoutContent>{children}</LayoutContent>
                  </I18nProvider>
                </MotionConfigProvider>
              </AuthProvider>
            </Suspense>
          </AsyncErrorBoundary>
        </SentryErrorBoundary>
        <GoogleAnalytics />
        <Analytics />
      </body>
    </html>
  )
}
