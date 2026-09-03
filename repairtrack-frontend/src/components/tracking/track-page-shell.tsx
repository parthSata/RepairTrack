import type { ReactNode } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'

export function TrackPageShell({
  title,
  description,
  footer,
  children,
  wide = false,
}: {
  title: string
  description: string
  footer?: ReactNode
  children: ReactNode
  wide?: boolean
}) {
  const header = (
    <header className="flex w-full min-w-0 flex-col gap-2 sm:gap-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
        Repair tracking
      </p>
      <h1 className="text-xl font-semibold tracking-tight text-foreground break-words sm:text-2xl md:text-3xl">
        {title}
      </h1>
      <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
    </header>
  )

  const brandLink = (
    <Link
      href="/track"
      className="mb-5 flex w-full min-w-0 items-center justify-center gap-3 text-lg font-semibold tracking-tight sm:mb-6 sm:text-xl"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent text-sm font-bold text-accent-foreground">
        RT
      </span>
      <span className="truncate">RepairTrack</span>
    </Link>
  )

  return (
    <main className="flex min-h-screen w-full flex-col items-stretch bg-background px-3 py-5 sm:items-center sm:px-6 sm:py-8">
      <div
        className={`page-enter flex w-full min-w-0 flex-col ${wide ? 'max-w-3xl' : 'max-w-md'}`}
      >
        {brandLink}

        {wide ? (
          <div className="flex w-full min-w-0 flex-col gap-5 pb-16 sm:gap-6">
            {header}
            <div className="flex w-full min-w-0 flex-col gap-5 sm:gap-6">{children}</div>
          </div>
        ) : (
          <Card className="w-full min-w-0 border-border shadow-[0_12px_32px_rgba(24,33,43,0.08)]">
            <CardContent className="flex min-w-0 flex-col gap-6 p-4 sm:p-8">
              {header}
              <div className="flex w-full min-w-0 flex-col">{children}</div>
            </CardContent>
          </Card>
        )}

        {footer ? (
          <p className="mt-5 text-center text-sm text-muted-foreground sm:mt-6">{footer}</p>
        ) : null}
      </div>
    </main>
  )
}
