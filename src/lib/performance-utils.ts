/**
 * Performance Utilities for VineSight
 *
 * Memoization helpers, debouncing, and performance optimization utilities
 */

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Debounce hook for input fields
 * Delays execution until user stops typing
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Debounced callback hook
 * Delays function execution until calls stop
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args)
      }, delay)
    },
    [callback, delay]
  )
}

/**
 * Throttle hook - ensures function runs at most once per interval
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  limit: number = 300
): (...args: Parameters<T>) => void {
  const inThrottle = useRef<boolean>(false)

  return useCallback(
    (...args: Parameters<T>) => {
      if (!inThrottle.current) {
        callback(...args)
        inThrottle.current = true
        setTimeout(() => {
          inThrottle.current = false
        }, limit)
      }
    },
    [callback, limit]
  )
}

/**
 * Memoized array comparison
 * Returns true if arrays have same values in same order
 */
export function areArraysEqual<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false
  return a.every((value, index) => value === b[index])
}

/**
 * Shallow object comparison
 * Returns true if objects have same key-value pairs
 */
export function shallowEqual(objA: any, objB: any): boolean {
  if (objA === objB) return true

  if (typeof objA !== 'object' || objA === null || typeof objB !== 'object' || objB === null) {
    return false
  }

  const keysA = Object.keys(objA)
  const keysB = Object.keys(objB)

  if (keysA.length !== keysB.length) return false

  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(objB, key) || objA[key] !== objB[key]) {
      return false
    }
  }

  return true
}

/**
 * Intersection Observer hook for lazy loading
 */
export function useIntersectionObserver(
  ref: React.RefObject<Element>,
  options?: IntersectionObserverInit
): boolean {
  const [isIntersecting, setIsIntersecting] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting)
    }, options)

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [ref, options])

  return isIntersecting
}

/**
 * Performance measurement hook
 * Logs component render time in development
 */
export function usePerformanceMonitor(componentName: string, enabled: boolean = false) {
  const renderCount = useRef<number>(0)
  const startTime = useRef<number>(performance.now())

  useEffect(() => {
    if (!enabled || process.env.NODE_ENV !== 'development') return

    renderCount.current++
    const endTime = performance.now()
    const renderTime = endTime - startTime.current

    console.log(
      `[Performance] ${componentName} render #${renderCount.current}: ${renderTime.toFixed(2)}ms`
    )

    startTime.current = endTime
  })
}

/**
 * Memoized formatter function creator
 * Useful for number/date formatting that doesn't need recreation
 */
export function createFormatter<T extends (...args: any[]) => string>(
  formatterFn: T
): (...args: Parameters<T>) => string {
  const cache = new Map<string, string>()

  return (...args: Parameters<T>): string => {
    const key = JSON.stringify(args)
    if (cache.has(key)) {
      return cache.get(key)!
    }

    const result = formatterFn(...args)
    cache.set(key, result)
    return result
  }
}

/**
 * Batch state updates helper
 * Combines multiple state updates into one render
 */
export function useBatchedUpdates() {
  const [, forceUpdate] = useState({})
  const batchRef = useRef<(() => void)[]>([])

  const executeBatch = useCallback(() => {
    if (batchRef.current.length === 0) return

    // Execute all batched updates
    batchRef.current.forEach((fn) => fn())
    batchRef.current = []

    // Force a single re-render
    forceUpdate({})
  }, [])

  const addToBatch = useCallback(
    (fn: () => void) => {
      batchRef.current.push(fn)

      // Schedule batch execution
      if (batchRef.current.length === 1) {
        Promise.resolve().then(executeBatch)
      }
    },
    [executeBatch]
  )

  return addToBatch
}

/**
 * Previous value hook
 * Useful for comparison in useEffect
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined)

  useEffect(() => {
    ref.current = value
  }, [value])

  return ref.current
}

/**
 * Window resize hook with debouncing
 */
export function useWindowSize(debounceMs: number = 150) {
  const [size, setSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    let timeoutId: NodeJS.Timeout | undefined

    const handleResize = () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      timeoutId = setTimeout(() => {
        setSize({
          width: window.innerWidth,
          height: window.innerHeight
        })
      }, debounceMs)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      window.removeEventListener('resize', handleResize)
    }
  }, [debounceMs])

  return size
}
