'use client'

import { useState } from 'react'
import { LoaderCircle, Mail } from 'lucide-react'
import { GMAIL_CONNECT_URL } from '@/features/gmail/schemas'
import { cn } from '@/lib/utils'

type ConnectGmailButtonProps = {
  label?: string
  className?: string
}

/** A plain link: the connect route redirects the browser to Google's consent screen. */
export function ConnectGmailButton({ label = 'Connect Gmail', className }: ConnectGmailButtonProps) {
  const [isRedirecting, setIsRedirecting] = useState(false)
  const Icon = isRedirecting ? LoaderCircle : Mail

  return (
    <a
      href={GMAIL_CONNECT_URL}
      onClick={() => setIsRedirecting(true)}
      aria-busy={isRedirecting}
      className={cn(
        'inline-flex h-11 items-center justify-center gap-2 rounded-md bg-foreground px-4 text-sm font-medium text-background transition-colors duration-200 hover:bg-foreground/90',
        isRedirecting && 'pointer-events-none opacity-70',
        className,
      )}
    >
      <Icon className={cn('h-4 w-4', isRedirecting && 'animate-spin')} aria-hidden />
      {label}
    </a>
  )
}
