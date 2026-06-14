import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Module routing. Users who belong to an organization (a row in organization_members)
// live in the consultant module; everyone else — farmers — lives in the farmer module.
// Middleware is the SINGLE authority that performs these redirects, and each role is only
// ever sent to its own home, so the two modules can never ping-pong.
const FARMER_HOME = '/dashboard'
const ORG_HOME = '/consultant'

// Farmer-module route roots. Org members who hit any of these are sent to ORG_HOME.
// The farmer module is frozen, so this list is stable; add new farmer routes here.
const FARMER_ROOTS = [
  '/dashboard',
  '/calculators',
  '/farms',
  '/ai-assistant',
  '/disease-prediction',
  '/analytics',
  '/reports',
  '/reminders',
  '/weather',
  '/workers',
  '/yield-prediction',
  '/warehouse',
  '/portfolio',
  '/precision-agriculture',
  '/performance',
  '/export',
  '/grape-farming-guide'
]
// Org-module route roots. Non-org users who hit these are sent to FARMER_HOME.
// /users is the org member-management page (OrganizationService) — org-scoped.
const ORG_ROOTS = ['/consultant', '/users']

function matchesRoot(pathname: string, roots: string[]) {
  return roots.some((root) => pathname === root || pathname.startsWith(`${root}/`))
}

// Build a redirect that carries the session cookies already set on `source`.
// supabase.auth.getUser() may refresh the access token and write new cookies onto
// supabaseResponse; a bare NextResponse.redirect() returns a fresh response and drops
// them, which logs the user out mid-navigation. (Supabase SSR requirement.)
function redirectPreservingCookies(url: URL, source: NextResponse) {
  const res = NextResponse.redirect(url)
  source.cookies.getAll().forEach((cookie) => {
    const { name, value, ...options } = cookie
    res.cookies.set(name, value, options)
  })
  return res
}

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
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
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

  // Unauthenticated requests are left to the pages / ProtectedRoute to handle.
  if (!user) {
    return supabaseResponse
  }

  const { pathname } = req.nextUrl
  const isAuthRoute = pathname.startsWith('/auth')
  const onFarmerRoute = matchesRoot(pathname, FARMER_ROOTS)
  const onOrgRoute = matchesRoot(pathname, ORG_ROOTS)

  // Only the auth landing and the two module areas depend on which module the user
  // belongs to, so we only pay for the membership lookup there. Everything else (settings,
  // help, legal, homepage, etc.) is shared and passes through untouched.
  if (isAuthRoute || onFarmerRoute || onOrgRoute) {
    // Source of truth for "is an org user" is organization_members — the same table the
    // consultant layout (via getConsultantAccess) gates on. We deliberately do NOT key off
    // profiles.user_type: it's a derived cache that can lag behind real membership (e.g.
    // accounts created before it was written), and any disagreement with the layout would
    // bounce a real member off /consultant before the layout could admit them. limit(1)
    // keeps maybeSingle() safe if a user ever belongs to more than one org.
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('user_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    // On a transient error we can't safely decide the user's module. Pass through and
    // let the destination page gate normally (e.g. consultant layout's
    // getConsultantAccess) rather than silently treating a real org member as a farmer.
    if (membershipError) {
      console.error(
        '[middleware] organization_members lookup failed; passing through:',
        membershipError.message
      )
      return supabaseResponse
    }

    const isOrgUser = Boolean(membership)
    const home = isOrgUser ? ORG_HOME : FARMER_HOME

    // Signed-in users shouldn't sit on auth pages — send them to their module home.
    // Verification pages are mid-signup and must stay reachable.
    if (
      isAuthRoute &&
      !pathname.startsWith('/auth/verify-email') &&
      !pathname.startsWith('/auth/verify-otp')
    ) {
      return redirectPreservingCookies(new URL(home, req.url), supabaseResponse)
    }

    // Keep each role inside its own module.
    if (isOrgUser && onFarmerRoute) {
      return redirectPreservingCookies(new URL(ORG_HOME, req.url), supabaseResponse)
    }
    if (!isOrgUser && onOrgRoute) {
      return redirectPreservingCookies(new URL(FARMER_HOME, req.url), supabaseResponse)
    }
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
     * - monitoring (Sentry tunnel route)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|monitoring|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
  ]
}
