'use client'

import { useEffect, useRef, useCallback } from 'react'

interface PerformanceMetrics {
  loadTime: number
  renderTime: number
  componentName: string
  memoryUsage?: number
}

// Performance monitoring hook
export function usePerformanceMonitor(componentName: string) {
  const renderStartTime = useRef<number>(Date.now())
  const mountTime = useRef<number>(0)
  const metricsRef = useRef<PerformanceMetrics[]>([])

  // Measure initial load time
  useEffect(() => {
    mountTime.current = Date.now()
    const loadTime = mountTime.current - renderStartTime.current

    // Get memory usage if available
    const memoryUsage = (performance as any).memory
      ? (performance as any).memory.usedJSHeapSize
      : undefined

    const metrics: PerformanceMetrics = {
      loadTime,
      renderTime: 0, // Will be updated on render
      componentName,
      memoryUsage,
    }

    metricsRef.current.push(metrics)

    // Log metrics in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 Performance [${componentName}]:`, {
        loadTime: `${loadTime}ms`,
        memoryUsage: memoryUsage ? `${(memoryUsage / 1024 / 1024).toFixed(2)}MB` : 'N/A',
      })
    }

    // Send to analytics in production (placeholder)
    if (process.env.NODE_ENV === 'production') {
      // sendToAnalytics(metrics);
    }
  }, [componentName])

  // Measure render time
  useEffect(() => {
    const renderTime = Date.now() - renderStartTime.current
    if (metricsRef.current.length > 0) {
      metricsRef.current[metricsRef.current.length - 1].renderTime = renderTime
    }
  })

  // Function to track custom performance events
  const trackEvent = useCallback(
    (eventName: string, duration?: number) => {
      const timestamp = Date.now()
      const eventDuration = duration || timestamp - renderStartTime.current

      if (process.env.NODE_ENV === 'development') {
        console.log(`⚡ Event [${componentName}/${eventName}]:`, `${eventDuration}ms`)
      }
    },
    [componentName],
  )

  // Function to get current metrics
  const getMetrics = useCallback(() => {
    return metricsRef.current
  }, [])

  return { trackEvent, getMetrics }
}

// Hook for measuring async operations
export function useAsyncPerformance() {
  const measureAsync = useCallback(
    async <T>(operation: () => Promise<T>, operationName: string): Promise<T> => {
      const startTime = Date.now()

      try {
        const result = await operation()
        const duration = Date.now() - startTime

        if (process.env.NODE_ENV === 'development') {
          console.log(`🚀 Async Operation [${operationName}]:`, `${duration}ms`)
        }

        return result
      } catch (error) {
        const duration = Date.now() - startTime

        if (process.env.NODE_ENV === 'development') {
          console.error(`❌ Async Operation Failed [${operationName}]:`, `${duration}ms`, error)
        }

        throw error
      }
    },
    [],
  )

  return { measureAsync }
}

// Hook for bundle size monitoring
export function useBundleAnalyzer() {
  const trackBundleSize = useCallback((chunkName: string) => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const entries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
      const navigation = entries[0]

      if (navigation) {
        const metrics = {
          chunkName,
          loadTime: navigation.loadEventEnd - navigation.loadEventStart,
          domContentLoaded:
            navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          transferSize: navigation.transferSize,
          encodedBodySize: navigation.encodedBodySize,
          decodedBodySize: navigation.decodedBodySize,
        }

        if (process.env.NODE_ENV === 'development') {
          console.log(`📦 Bundle [${chunkName}]:`, {
            loadTime: `${metrics.loadTime.toFixed(2)}ms`,
            transferSize: `${(metrics.transferSize / 1024).toFixed(2)}KB`,
            encodedSize: `${(metrics.encodedBodySize / 1024).toFixed(2)}KB`,
            decodedSize: `${(metrics.decodedBodySize / 1024).toFixed(2)}KB`,
          })
        }

        return metrics
      }
    }
    return null
  }, [])

  return { trackBundleSize }
}

// Core Web Vitals monitoring
export function useCoreWebVitals() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      // Largest Contentful Paint (LCP)
      if ('PerformanceObserver' in window) {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]

          if (process.env.NODE_ENV === 'development') {
            console.log('🎯 LCP:', `${lastEntry.startTime.toFixed(2)}ms`)
          }
        })

        try {
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
        } catch (e) {
          // Browser doesn't support LCP
        }

        // First Input Delay (FID)
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry: any) => {
            if (process.env.NODE_ENV === 'development') {
              console.log('👆 FID:', `${entry.processingStart - entry.startTime}ms`)
            }
          })
        })

        try {
          fidObserver.observe({ entryTypes: ['first-input'] })
        } catch (e) {
          // Browser doesn't support FID
        }

        // Cumulative Layout Shift (CLS)
        const clsObserver = new PerformanceObserver((list) => {
          let clsScore = 0
          const entries = list.getEntries()

          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsScore += entry.value
            }
          })

          if (process.env.NODE_ENV === 'development' && clsScore > 0) {
            console.log('📐 CLS:', clsScore.toFixed(4))
          }
        })

        try {
          clsObserver.observe({ entryTypes: ['layout-shift'] })
        } catch (e) {
          // Browser doesn't support CLS
        }

        return () => {
          lcpObserver.disconnect()
          fidObserver.disconnect()
          clsObserver.disconnect()
        }
      }
    }
  }, [])
}
