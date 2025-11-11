/**
 * Performance monitoring utilities for tracking and optimizing app performance
 */

export interface PerformanceMetric {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  timestamp: number
}

export class PerformanceMonitor {
  private static metrics: PerformanceMetric[] = []
  private static readonly MAX_METRICS = 100

  /**
   * Measure and record First Contentful Paint (FCP)
   */
  static measureFCP(): void {
    if (typeof window === 'undefined') return

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            const fcp = entry.startTime
            this.recordMetric({
              name: 'FCP',
              value: fcp,
              rating: fcp < 1800 ? 'good' : fcp < 3000 ? 'needs-improvement' : 'poor',
              timestamp: Date.now()
            })
          }
        })
      })

      observer.observe({ type: 'paint', buffered: true })
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('FCP measurement not supported', error)
      }
    }
  }

  /**
   * Measure and record Largest Contentful Paint (LCP)
   */
  static measureLCP(): void {
    if (typeof window === 'undefined') return

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        if (entries.length === 0) return

        const lastEntry = entries[entries.length - 1]
        const lcp = lastEntry.startTime

        this.recordMetric({
          name: 'LCP',
          value: lcp,
          rating: lcp < 2500 ? 'good' : lcp < 4000 ? 'needs-improvement' : 'poor',
          timestamp: Date.now()
        })
      })

      observer.observe({ type: 'largest-contentful-paint', buffered: true })
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('LCP measurement not supported', error)
      }
    }
  }

  /**
   * Measure and record Cumulative Layout Shift (CLS)
   */
  static measureCLS(): void {
    if (typeof window === 'undefined') return

    try {
      const observer = new PerformanceObserver((list) => {
        let clsValue = 0
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value
          }
        }

        if (clsValue > 0) {
          this.recordMetric({
            name: 'CLS',
            value: clsValue,
            rating: clsValue < 0.1 ? 'good' : clsValue < 0.25 ? 'needs-improvement' : 'poor',
            timestamp: Date.now()
          })
        }
      })

      observer.observe({ type: 'layout-shift', buffered: true })
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('CLS measurement not supported', error)
      }
    }
  }

  /**
   * Measure and record First Input Delay (FID)
   */
  static measureFID(): void {
    if (typeof window === 'undefined') return

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          const fid = entry.processingStart - entry.startTime

          this.recordMetric({
            name: 'FID',
            value: fid,
            rating: fid < 100 ? 'good' : fid < 300 ? 'needs-improvement' : 'poor',
            timestamp: Date.now()
          })
        })
      })

      observer.observe({ type: 'first-input', buffered: true })
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('FID measurement not supported', error)
      }
    }
  }

  /**
   * Measure Time to First Byte (TTFB)
   */
  static measureTTFB(): void {
    if (typeof window === 'undefined') return

    try {
      const navigation = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming

      if (navigation) {
        const ttfb = navigation.responseStart - navigation.requestStart

        this.recordMetric({
          name: 'TTFB',
          value: ttfb,
          rating: ttfb < 800 ? 'good' : ttfb < 1800 ? 'needs-improvement' : 'poor',
          timestamp: Date.now()
        })
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('TTFB measurement not supported', error)
      }
    }
  }

  /**
   * Record custom performance metric
   */
  static recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric)

    // Keep only last MAX_METRICS entries
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS)
    }

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Perf] ${metric.name}: ${metric.value.toFixed(2)}ms (${metric.rating})`)
    }
  }

  /**
   * Get all recorded metrics
   */
  static getMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }

  /**
   * Get metrics summary
   */
  static getMetricsSummary() {
    const summary: Record<string, { avg: number; min: number; max: number; count: number }> = {}

    this.metrics.forEach((metric) => {
      if (!summary[metric.name]) {
        summary[metric.name] = {
          avg: 0,
          min: Infinity,
          max: -Infinity,
          count: 0
        }
      }

      const stat = summary[metric.name]
      stat.count++
      stat.avg = (stat.avg * (stat.count - 1) + metric.value) / stat.count
      stat.min = Math.min(stat.min, metric.value)
      stat.max = Math.max(stat.max, metric.value)
    })

    return summary
  }

  /**
   * Clear all metrics
   */
  static clearMetrics(): void {
    this.metrics = []
  }

  /**
   * Initialize all Core Web Vitals measurements
   */
  static initializeCoreWebVitals(): void {
    if (typeof window === 'undefined') return

    this.measureFCP()
    this.measureLCP()
    this.measureCLS()
    this.measureFID()
    this.measureTTFB()
  }

  /**
   * Measure custom timing
   */
  static measure(name: string, startMark: string, endMark?: string): void {
    if (typeof window === 'undefined') return

    try {
      const measure = endMark
        ? performance.measure(name, startMark, endMark)
        : performance.measure(name, startMark)

      if (measure) {
        this.recordMetric({
          name,
          value: measure.duration,
          rating:
            measure.duration < 100 ? 'good' : measure.duration < 300 ? 'needs-improvement' : 'poor',
          timestamp: Date.now()
        })
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Performance measurement failed for ${name}`, error)
      }
    }
  }

  /**
   * Mark a performance timing point
   */
  static mark(name: string): void {
    if (typeof window === 'undefined') return

    try {
      performance.mark(name)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Performance mark failed for ${name}`, error)
      }
    }
  }
}

// Export initialization function instead of auto-initializing
export function initializePerformanceMonitoring() {
  if (typeof window === 'undefined') return

  if (document.readyState === 'complete') {
    PerformanceMonitor.initializeCoreWebVitals()
  } else {
    window.addEventListener('load', () => {
      PerformanceMonitor.initializeCoreWebVitals()
    })
  }
}

// Only auto-initialize in development for debugging
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  initializePerformanceMonitoring()
}
