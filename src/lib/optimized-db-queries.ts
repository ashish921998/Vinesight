/**
 * Optimized database query utilities for performance
 * Implements batching, caching, and deduplication strategies
 */

import { cacheService, CACHE_TTL } from './cache-service'

type QueryKey = string
type QueryFn<T> = () => Promise<T>

interface PendingQuery<T> {
  promise: Promise<T>
  timestamp: number
}

/**
 * Request deduplication manager
 * Prevents duplicate concurrent requests for the same data
 */
class QueryDeduplicator {
  private pending: Map<QueryKey, PendingQuery<any>> = new Map()
  private readonly PENDING_TIMEOUT = 30000 // 30 seconds

  /**
   * Execute query with deduplication
   * If same query is already pending, return the existing promise
   */
  async dedupe<T>(key: QueryKey, queryFn: QueryFn<T>): Promise<T> {
    const now = Date.now()

    // Check if query is already pending
    const pending = this.pending.get(key)
    if (pending) {
      // Check if pending query hasn't timed out
      if (now - pending.timestamp < this.PENDING_TIMEOUT) {
        return pending.promise as Promise<T>
      } else {
        // Timeout expired, remove it
        this.pending.delete(key)
      }
    }

    // Create new query
    const promise = queryFn()
      .then((result) => {
        this.pending.delete(key)
        return result
      })
      .catch((error) => {
        this.pending.delete(key)
        throw error
      })

    this.pending.set(key, { promise, timestamp: now })
    return promise
  }

  /**
   * Clear all pending queries
   */
  clear(): void {
    this.pending.clear()
  }

  /**
   * Get number of pending queries
   */
  getPendingCount(): number {
    return this.pending.size
  }
}

export const queryDeduplicator = new QueryDeduplicator()

/**
 * Batch query executor
 * Collects multiple queries and executes them in a single batch
 */
export class BatchQueryExecutor<TKey, TResult> {
  private queue: Array<{
    key: TKey
    resolve: (value: TResult) => void
    reject: (error: any) => void
  }> = []
  private scheduled = false
  private batchFn: (keys: TKey[]) => Promise<Map<TKey, TResult>>

  constructor(batchFn: (keys: TKey[]) => Promise<Map<TKey, TResult>>) {
    this.batchFn = batchFn
  }

  /**
   * Queue a query to be executed in batch
   */
  query(key: TKey): Promise<TResult> {
    return new Promise((resolve, reject) => {
      this.queue.push({ key, resolve, reject })
      this.scheduleFlush()
    })
  }

  private scheduleFlush(): void {
    if (!this.scheduled) {
      this.scheduled = true
      // Use microtask to batch queries in the same tick
      Promise.resolve().then(() => this.flush())
    }
  }

  private async flush(): Promise<void> {
    if (this.queue.length === 0) {
      this.scheduled = false
      return
    }

    const batch = this.queue.slice()
    this.queue = []
    this.scheduled = false

    try {
      const keys = batch.map((item) => item.key)
      const results = await this.batchFn(keys)

      batch.forEach((item) => {
        const result = results.get(item.key)
        if (result !== undefined) {
          item.resolve(result)
        } else {
          item.reject(new Error('Result not found in batch response'))
        }
      })
    } catch (error) {
      batch.forEach((item) => item.reject(error))
    }
  }
}

/**
 * Optimized query helper that combines caching, deduplication, and batching
 */
export async function optimizedQuery<T>(
  key: string,
  queryFn: QueryFn<T>,
  options: {
    cache?: boolean
    ttl?: number
    dedupe?: boolean
  } = {}
): Promise<T> {
  const { cache = true, ttl = CACHE_TTL.MEDIUM, dedupe = true } = options

  // Try cache first
  if (cache) {
    const cached = cacheService.get<T>(key)
    if (cached !== null) {
      return cached
    }
  }

  // Deduplicate if enabled
  const result = dedupe ? await queryDeduplicator.dedupe(key, queryFn) : await queryFn()

  // Cache result
  if (cache) {
    cacheService.set(key, result, ttl)
  }

  return result
}

/**
 * Prefetch data in the background
 * Useful for predictive loading
 */
export function prefetchData<T>(key: string, queryFn: QueryFn<T>, ttl?: number): void {
  // Check if already cached
  if (cacheService.get(key) !== null) {
    return
  }

  // Use requestIdleCallback if available
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    window.requestIdleCallback(() => {
      optimizedQuery(key, queryFn, { cache: true, ttl, dedupe: true }).catch(() => {
        // Silently fail prefetch
      })
    })
  } else {
    // Fallback to setTimeout
    setTimeout(() => {
      optimizedQuery(key, queryFn, { cache: true, ttl, dedupe: true }).catch(() => {
        // Silently fail prefetch
      })
    }, 1)
  }
}

/**
 * Pagination helper with intelligent prefetching
 */
export class PaginationHelper<T> {
  private currentPage = 1
  private prefetchedPages = new Set<number>()

  constructor(
    private fetchPage: (page: number) => Promise<T>,
    private getCacheKey: (page: number) => string,
    private prefetchAhead = 1
  ) {}

  async getPage(page: number): Promise<T> {
    this.currentPage = page

    // Fetch current page
    const result = await optimizedQuery(this.getCacheKey(page), () => this.fetchPage(page))

    // Prefetch next pages
    for (let i = 1; i <= this.prefetchAhead; i++) {
      const nextPage = page + i
      if (!this.prefetchedPages.has(nextPage)) {
        this.prefetchedPages.add(nextPage)
        prefetchData(this.getCacheKey(nextPage), () => this.fetchPage(nextPage))
      }
    }

    return result
  }

  clearPrefetchedPages(): void {
    this.prefetchedPages.clear()
  }
}

/**
 * Parallel query executor with concurrency limit
 */
export async function parallelQueries<T>(
  queries: Array<() => Promise<T>>,
  concurrency = 3
): Promise<T[]> {
  const results: T[] = []
  const executing: Promise<void>[] = []

  for (const query of queries) {
    const promise = query().then((result) => {
      results.push(result)
      const index = executing.indexOf(promise)
      if (index > -1) {
        executing.splice(index, 1)
      }
    })

    executing.push(promise)

    if (executing.length >= concurrency) {
      await Promise.race(executing)
    }
  }

  await Promise.all(executing)
  return results
}
