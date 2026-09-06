import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/server/auth'

export async function middleware(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const path = request.nextUrl.pathname

  if (session.user?.status === 'INACTIVE') {
    return NextResponse.redirect(new URL('/login?error=account_deactivated', request.url))
  }

  const userEmail = session.user?.email ?? ''
  if (!session.user?.emailVerified && !path.startsWith('/verify-email')) {
    return NextResponse.redirect(new URL(`/verify-email?email=${encodeURIComponent(userEmail)}`, request.url))
  }

  const role = session.user?.role ?? 'OWNER'

  // STAFF role: allowed on all operational pages except shop & staff settings
  if (role === 'STAFF' && path.startsWith('/settings')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // TECHNICIAN role: restricted from inventory, invoices, and settings
  if (role === 'TECHNICIAN' && (path.startsWith('/inventory') || path.startsWith('/invoices') || path.startsWith('/settings'))) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard',
    '/dashboard/:path*',
    '/repairs',
    '/repairs/:path*',
    '/customers',
    '/customers/:path*',
    '/devices',
    '/devices/:path*',
    '/inventory',
    '/inventory/:path*',
    '/invoices',
    '/invoices/:path*',
    '/settings',
    '/settings/:path*',
  ],
}