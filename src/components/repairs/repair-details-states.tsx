'use client'

import Link from 'next/link'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export function RepairDetailsLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  )
}

type RepairDetailsErrorProps = {
  message?: string
  onRetry: () => void
}

export function RepairDetailsError({ message, onRetry }: RepairDetailsErrorProps) {
  return (
    <div className="space-y-4">
      <Link href="/repairs">
        <Button variant="ghost" className="h-8 gap-2 px-3 text-xs text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Repair Tickets
        </Button>
      </Link>
      <div className="space-y-2 rounded-lg border border-destructive/20 bg-destructive/10 p-6 text-center text-sm text-destructive">
        <AlertCircle className="mx-auto h-6 w-6" />
        <p className="font-semibold">
          {message ?? 'Repair ticket not found or access denied.'}
        </p>
        <p className="text-xs text-muted-foreground">
          If you are signed in as a Technician, you can only view tickets assigned to you.
        </p>
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-2">
          Retry Loading
        </Button>
      </div>
    </div>
  )
}
