// Memoization utilities for performance optimization

// Simple memoization for pure functions
export function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map()

  return ((...args: any[]) => {
    const key = JSON.stringify(args)

    if (cache.has(key)) {
      return cache.get(key)
    }

    const result = fn(...args)
    cache.set(key, result)

    // Clean up old entries if cache gets too large
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value
      cache.delete(firstKey)
    }

    return result
  }) as T
}

// Debounce function for expensive operations
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      fn(...args)
      timeoutId = null
    }, delay)
  }
}

// Throttle function for rate-limiting operations
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

// Request idle callback helper with fallback
export function requestIdleCallbackPolyfill(callback: () => void) {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    return window.requestIdleCallback(callback)
  }
  return setTimeout(callback, 1)
}

// Cancel idle callback with fallback
export function cancelIdleCallbackPolyfill(id: number) {
  if (typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
    return window.cancelIdleCallback(id)
  }
  return clearTimeout(id)
}

// LRU Cache implementation for more advanced caching
export class LRUCache<K, V> {
  private max: number
  private cache: Map<K, V>

  constructor(max = 100) {
    this.max = max
    this.cache = new Map()
  }

  get(key: K): V | undefined {
    const item = this.cache.get(key)
    if (item !== undefined) {
      // Refresh position
      this.cache.delete(key)
      this.cache.set(key, item)
    }
    return item
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key)
    } else if (this.cache.size >= this.max) {
      // Delete oldest item
      const iterator = this.cache.keys().next()
      if (!iterator.done) {
        const firstKey = iterator.value
        this.cache.delete(firstKey as K)
      }
    }
    this.cache.set(key, value)
  }

  clear(): void {
    this.cache.clear()
  }

  has(key: K): boolean {
    return this.cache.has(key)
  }

  delete(key: K): void {
    this.cache.delete(key)
  }
}

// Batch updates to reduce re-renders
export class BatchQueue {
  private queue: Array<() => void> = []
  private scheduled = false

  add(fn: () => void) {
    this.queue.push(fn)
    this.scheduleFlush()
  }

  private scheduleFlush() {
    if (!this.scheduled) {
      this.scheduled = true
      requestIdleCallbackPolyfill(() => {
        this.flush()
      })
    }
  }

  private flush() {
    const callbacks = this.queue.slice()
    this.queue = []
    this.scheduled = false

    callbacks.forEach((fn) => {
      try {
        fn()
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error in batch queue:', error)
        }
      }
    })
  }
}
