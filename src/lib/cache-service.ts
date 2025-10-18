/**
 * Client-side caching service for performance optimization
 * Reduces redundant API calls and speeds up data retrieval
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class CacheService {
  private cache: Map<string, CacheEntry<any>> = new Map()
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes

  /**
   * Get cached data if valid, otherwise return null
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      // Cache expired, remove it
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  /**
   * Set cache data with optional TTL
   */
  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })

    // Clean up old entries if cache gets too large
    if (this.cache.size > 100) {
      this.cleanup()
    }
  }

  /**
   * Remove specific cache entry
   */
  delete(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key)
      }
    })

    keysToDelete.forEach((key) => this.cache.delete(key))
  }

  /**
   * Get or fetch data with caching
   * Useful pattern: if cached, return cached data, else fetch and cache
   */
  async getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = this.DEFAULT_TTL
  ): Promise<T> {
    const cached = this.get<T>(key)

    if (cached !== null) {
      return cached
    }

    const data = await fetchFn()
    this.set(key, data, ttl)
    return data
  }

  /**
   * Invalidate cache entries matching a pattern
   */
  invalidatePattern(pattern: string): void {
    const keysToDelete: string[] = []

    this.cache.forEach((_, key) => {
      if (key.includes(pattern)) {
        keysToDelete.push(key)
      }
    })

    keysToDelete.forEach((key) => this.cache.delete(key))
  }

  /**
   * Get cache statistics for debugging
   */
  getStats() {
    const now = Date.now()
    let validEntries = 0
    let expiredEntries = 0

    this.cache.forEach((entry) => {
      if (now - entry.timestamp > entry.ttl) {
        expiredEntries++
      } else {
        validEntries++
      }
    })

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries
    }
  }
}

// Singleton instance
export const cacheService = new CacheService()

// Cache TTL constants for different data types
export const CACHE_TTL = {
  SHORT: 2 * 60 * 1000, // 2 minutes
  MEDIUM: 5 * 60 * 1000, // 5 minutes
  LONG: 15 * 60 * 1000, // 15 minutes
  VERY_LONG: 60 * 60 * 1000 // 1 hour
} as const
