import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

export function TrackErrorState() {
  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center space-y-4">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertCircle className="h-5 w-5" />
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">We couldn&apos;t find this repair.</p>
        <p className="text-xs text-muted-foreground leading-5">
          Please check your repair number and phone number, or use the tracking link shared by the shop.
        </p>
      </div>
      <Link
        href="/track"
        className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-muted"
      >
        Track a Repair
      </Link>
    </div>
  )
}
