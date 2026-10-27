import Link from 'next/link'
import { ShieldOff } from 'lucide-react'

type AccessDeniedProps = {
  resource: string
}

export function AccessDenied({ resource }: AccessDeniedProps) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <ShieldOff className="h-5 w-5" aria-hidden="true" />
      </div>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">Access denied</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        You don&apos;t have permission to view {resource}. Contact the shop owner if you need access.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/repairs"
          className="inline-flex h-10 items-center justify-center rounded-md bg-accent px-4 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90"
        >
          View repairs
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  )
}
