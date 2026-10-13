import { toNextJsHandler } from 'better-auth/next-js'
import { APIError } from 'better-auth/api'
import { NextResponse } from 'next/server'
import { auth } from '@/server/auth'

const authHandler = toNextJsHandler(auth)
const DEACTIVATED_ACCOUNT_MESSAGE = 'Your account has been deactivated. Contact the owner for activation.'

function isGoogleCallback(request: Request): boolean {
  return new URL(request.url).pathname.endsWith('/api/auth/callback/google')
}

function deactivatedAccountRedirect(request: Request): Response {
  return NextResponse.redirect(new URL('/login?error=account_deactivated', request.url))
}

export async function GET(request: Request): Promise<Response> {
  if (!isGoogleCallback(request)) {
    return authHandler.GET(request)
  }

  try {
    const response = await authHandler.GET(request)
    if (response.status === 403) {
      const responseBody = await response.clone().text()
      if (responseBody.includes(DEACTIVATED_ACCOUNT_MESSAGE)) {
        return deactivatedAccountRedirect(request)
      }
    }

    return response
  } catch (error: unknown) {
    if (error instanceof APIError && error.message === DEACTIVATED_ACCOUNT_MESSAGE) {
      return deactivatedAccountRedirect(request)
    }

    throw error
  }
}

export const POST = authHandler.POST