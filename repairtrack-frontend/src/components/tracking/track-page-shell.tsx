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
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8 sm:px-6">
      <div className={`page-enter w-full ${wide ? 'max-w-2xl' : 'max-w-md'}`}>
        <Link
          href="/track"
          className="mb-8 flex items-center justify-center gap-3 text-xl font-semibold tracking-tight"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-sm font-bold text-accent-foreground">
            RT
          </span>
          RepairTrack
        </Link>
        <Card className="border-border shadow-[0_12px_32px_rgba(24,33,43,0.08)]">
          <CardContent className="p-6 sm:p-8">
            <div className="mb-7 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                Repair tracking
              </p>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
              <p className="text-sm leading-6 text-muted-foreground">{description}</p>
            </div>
            {children}
          </CardContent>
        </Card>
        {footer ? <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p> : null}
      </div>
    </main>
  )
}
