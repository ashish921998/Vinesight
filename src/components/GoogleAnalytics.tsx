'use client'

import Script from 'next/script'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, Suspense } from 'react'
import { pageview } from '@/lib/analytics'

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

function GoogleAnalyticsContent() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (pathname) {
      const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')
      pageview(url)
    }
  }, [pathname, searchParams])

  if (process.env.NODE_ENV !== 'production') {
    return null
  }

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_location: window.location.href,
              page_title: document.title,
              send_page_view: false, // We'll handle this manually for SPA behavior
              custom_map: {
                'custom_parameter_1': 'farm_type',
                'custom_parameter_2': 'user_type',
                'custom_parameter_3': 'tool_category'
              }
            });

            // Enhanced measurement for agriculture app
            gtag('config', '${GA_MEASUREMENT_ID}', {
              // Agriculture-specific enhanced measurement
              enhanced_measurements: {
                scrolls: true,
                outbound_clicks: true,
                site_search: true,
                video_engagement: true,
                file_downloads: true
              },
              // Custom dimensions for farming context
              custom_parameters: {
                content_group1: 'Farm Management',
                content_group2: 'Agricultural Tools',
                content_group3: 'Smart Farming'
              }
            });

            // Track important farming-related interactions
            document.addEventListener('DOMContentLoaded', function() {
              // Track calculator usage
              document.querySelectorAll('[data-calculator]').forEach(function(el) {
                el.addEventListener('click', function() {
                  gtag('event', 'calculator_click', {
                    event_category: 'tools',
                    event_label: el.getAttribute('data-calculator'),
                    custom_parameters: {
                      calculator_type: el.getAttribute('data-calculator')
                    }
                  });
                });
              });

              // Track AI assistant interactions
              document.querySelectorAll('[data-ai-action]').forEach(function(el) {
                el.addEventListener('click', function() {
                  gtag('event', 'ai_interaction', {
                    event_category: 'ai_assistant',
                    event_label: el.getAttribute('data-ai-action')
                  });
                });
              });
            });
          `
        }}
      />
    </>
  )
}

export function GoogleAnalytics() {
  return (
    <Suspense fallback={null}>
      <GoogleAnalyticsContent />
    </Suspense>
  )
}

// Google Search Console verification component
export function SearchConsoleVerification() {
  const verificationCode = process.env.NEXT_PUBLIC_GOOGLE_SEARCH_CONSOLE_VERIFICATION

  if (!verificationCode) {
    return null
  }

  return <meta name="google-site-verification" content={verificationCode} />
}
