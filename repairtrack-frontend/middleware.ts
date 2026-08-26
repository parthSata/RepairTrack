import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/server/auth'

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const userEmail = session.user?.email ?? ''
  const isEmailVerified = Boolean(session.user?.emailVerified)

  if (!isEmailVerified) {
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
    '/dashboard/:path*',
    '/repairs/:path*',
    '/customers/:path*',
    '/devices/:path*',
    '/inventory/:path*',
    '/invoices/:path*',
    '/settings/:path*',
  ],
}