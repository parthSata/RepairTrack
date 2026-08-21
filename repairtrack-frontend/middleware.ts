import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/server/auth'

export async function middleware(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return NextResponse.redirect(new URL('/login', request.url))
  return NextResponse.next()
}

export const config = { matcher: ['/dashboard/:path*', '/repairs/:path*', '/customers/:path*', '/devices/:path*', '/inventory/:path*', '/invoices/:path*', '/settings/:path*'] }