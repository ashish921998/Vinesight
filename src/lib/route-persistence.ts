/**
 * Route Persistence Utility for PWA State Restoration
 *
 * This utility manages saving and restoring the user's last visited route
 * to provide a seamless PWA experience when the app is reopened.
 */

const LAST_ROUTE_KEY = 'vinesight_last_route'

/**
 * Public routes that should not be persisted as "last route"
 * When users visit these, we don't save them as the restoration target
 */
const PUBLIC_ROUTES = [
  '/',
  '/auth',
  '/login',
  '/signup',
  '/privacy',
  '/terms',
  '/auth/callback',
  '/auth/verify-email',
  '/auth/auth-code-error'
]

/**
 * Check if a route should be persisted
 */
function shouldPersistRoute(pathname: string): boolean {
  // Don't persist public routes
  if (PUBLIC_ROUTES.includes(pathname)) {
    return false
  }

  // Don't persist routes that start with public paths
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route + '/'))) {
    return false
  }

  return true
}

/**
 * Save the current route to localStorage
 * Only saves private/authenticated routes
 */
export function saveLastRoute(pathname: string): void {
  try {
    if (typeof window === 'undefined') return

    if (shouldPersistRoute(pathname)) {
      localStorage.setItem(LAST_ROUTE_KEY, pathname)
    }
  } catch (error) {
    // Silently fail if localStorage is not available
    console.debug('Failed to save last route:', error)
  }
}

/**
 * Get the last saved route from localStorage
 * Returns null if no route is saved or if the saved route is invalid
 */
export function getLastRoute(): string | null {
  try {
    if (typeof window === 'undefined') return null

    const savedRoute = localStorage.getItem(LAST_ROUTE_KEY)

    // Validate that the saved route should be restored
    if (savedRoute && shouldPersistRoute(savedRoute)) {
      return savedRoute
    }

    return null
  } catch (error) {
    console.debug('Failed to get last route:', error)
    return null
  }
}

/**
 * Clear the saved route from localStorage
 * Should be called on logout to prevent restoring authenticated routes
 */
export function clearLastRoute(): void {
  try {
    if (typeof window === 'undefined') return

    localStorage.removeItem(LAST_ROUTE_KEY)
  } catch (error) {
    console.debug('Failed to clear last route:', error)
  }
}
