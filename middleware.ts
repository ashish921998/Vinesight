import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Initializes a Supabase server client with cookie synchronization, enforces auth-route redirect rules, and returns the resulting NextResponse.
 *
 * Creates a Supabase server client that mirrors cookies from the incoming request and applies any cookies Supabase sets to the outgoing response, retrieves the current user, and if the user is authenticated and is accessing an auth route (any path starting with `/auth` except `/auth/verify-email`) redirects to `/dashboard`.
 *
 * @param req - The incoming Next.js request
 * @returns The NextResponse to continue the request lifecycle; may include cookies set by Supabase or be a redirect to `/dashboard`
 */
export async function middleware(req: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: req
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => req.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request: req
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        }
      }
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user }
  } = await supabase.auth.getUser()

  // If user is signed in and accessing any auth route, redirect to dashboard
  // But exclude email verification pages
  if (
    user &&
    req.nextUrl.pathname.startsWith('/auth') &&
    !req.nextUrl.pathname.startsWith('/auth/verify-email')
  ) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Note: Homepage redirect for authenticated users is handled client-side in page.tsx
  // to prevent redirect loops with dashboard page logic

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
  ]
}